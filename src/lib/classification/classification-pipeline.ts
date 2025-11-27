import "server-only";
import type { Category } from "@/domain/categories/types/category";
import type { MappingRule } from "@/domain/categories/types/mapping-rule";
import type {
  AIClassificationRequest,
  ClassificationResult,
  ClassificationSource,
} from "@/domain/transactions/types/classification";
import type { Transaction } from "@/domain/transactions/types/transaction";
import { logger } from "@/lib/logger";
import { AIClassifier } from "./ai-classifier";
import { autoClassifyTransaction } from "./rules-engine";

export interface PipelineConfig {
  enableRules: boolean;
  ruleConfidenceThreshold: number;

  enableAI: boolean;
  aiConfidenceThreshold: number;
  onlyUseAIWhenNoRule: boolean;

  enableReviewQueue: boolean;
  reviewThreshold: number; // Transactions below this confidence go to review
  autoApplyAboveThreshold: boolean;

  includeRecentTransactions: boolean;
  recentTransactionsLimit: number;
}

export interface ClassificationDecision {
  transaction: Transaction;
  source: ClassificationSource;
  categoryId?: string;
  merchant?: string;
  tags?: string[];
  confidence: number;
  needsReview: boolean;
  reasoning?: string;
  ruleId?: string;
  ruleName?: string;
  modelName?: string;
}

export interface PipelineResult {
  decision: ClassificationDecision;
  appliedChanges: Partial<Transaction>;
  shouldSave: boolean;
  shouldQueue: boolean;
}

const DEFAULT_CONFIG: PipelineConfig = {
  enableRules: true,
  ruleConfidenceThreshold: 0.8,
  enableAI: true,
  aiConfidenceThreshold: 0.7,
  onlyUseAIWhenNoRule: true,
  enableReviewQueue: true,
  reviewThreshold: 0.85,
  autoApplyAboveThreshold: true,
  includeRecentTransactions: true,
  recentTransactionsLimit: 10,
};

export class ClassificationPipeline {
  private config: PipelineConfig;

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private async tryRuleClassification(
    transaction: Transaction,
    rules: MappingRule[],
  ): Promise<ClassificationDecision | null> {
    if (!this.config.enableRules || rules.length === 0) {
      return null;
    }

    const match = autoClassifyTransaction(transaction, rules);
    if (!match) {
      return null;
    }

    const { rule, actions, confidence } = match;

    if (confidence < this.config.ruleConfidenceThreshold) {
      return null;
    }

    const categoryAction = actions.find((a) => a.type === "assign_category");
    const merchantAction = actions.find((a) => a.type === "set_merchant");
    const tagsAction = actions.find((a) => a.type === "add_tags");

    return {
      transaction,
      source: "rule",
      categoryId:
        typeof categoryAction?.value === "string"
          ? categoryAction.value
          : undefined,
      merchant:
        typeof merchantAction?.value === "string"
          ? merchantAction.value
          : undefined,
      tags: Array.isArray(tagsAction?.value) ? tagsAction.value : undefined,
      confidence,
      needsReview: confidence < this.config.reviewThreshold,
      ruleId: rule.id,
      ruleName: rule.name,
      reasoning: `Matched rule: ${rule.name}`,
    };
  }

  private async tryAIClassification(
    transaction: Transaction,
    context: {
      categories: Category[];
      recentTransactions?: Transaction[];
      historicalMerchants?: string[];
    },
  ): Promise<ClassificationDecision | null> {
    if (!this.config.enableAI || !AIClassifier.isAvailable()) {
      return null;
    }

    const request: AIClassificationRequest = {
      transaction,
      context: {
        userCategories: context.categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          type: cat.type,
        })),
        recentTransactions: this.config.includeRecentTransactions
          ? context.recentTransactions?.slice(
              0,
              this.config.recentTransactionsLimit,
            )
          : undefined,
        historicalMerchants: context.historicalMerchants,
      },
    };

    const aiResult = await AIClassifier.classifyTransaction(request);
    if (!aiResult) {
      return null;
    }

    if (aiResult.confidence < this.config.aiConfidenceThreshold) {
      return null;
    }

    return {
      transaction,
      source: "ai",
      categoryId: aiResult.categoryId,
      merchant: aiResult.merchant,
      tags: aiResult.tags,
      confidence: aiResult.confidence,
      needsReview: aiResult.confidence < this.config.reviewThreshold,
      modelName: aiResult.modelName,
      reasoning: aiResult.reasoning,
    };
  }

  async classify(
    transaction: Transaction,
    context: {
      rules: MappingRule[];
      categories: Category[];
      recentTransactions?: Transaction[];
      historicalMerchants?: string[];
    },
  ): Promise<PipelineResult> {
    logger.info(`Classifying transaction: ${transaction.id}`);

    let decision = await this.tryRuleClassification(transaction, context.rules);

    if (!decision || !this.config.onlyUseAIWhenNoRule) {
      const aiDecision = await this.tryAIClassification(transaction, context);

      if (
        aiDecision &&
        (!decision || aiDecision.confidence > decision.confidence)
      ) {
        decision = aiDecision;
      }
    }

    if (!decision) {
      return {
        decision: {
          transaction,
          source: "human",
          confidence: 0,
          needsReview: true,
          reasoning: "No automatic classification available",
        },
        appliedChanges: {},
        shouldSave: false,
        shouldQueue: this.config.enableReviewQueue,
      };
    }

    const appliedChanges: Partial<Transaction> = {
      categoryId: decision.categoryId,
      merchant: decision.merchant || transaction.merchant,
      tags: decision.tags || transaction.tags,
      llm:
        decision.source === "ai"
          ? {
              classified: true,
              model: decision.modelName,
              confidence: decision.confidence,
              raw: decision.reasoning,
            }
          : transaction.llm,
    };

    const shouldAutoApply =
      this.config.autoApplyAboveThreshold &&
      decision.confidence >= this.config.reviewThreshold;

    return {
      decision,
      appliedChanges,
      shouldSave: shouldAutoApply,
      shouldQueue: !shouldAutoApply && this.config.enableReviewQueue,
    };
  }

  async classifyBatch(
    transactions: Transaction[],
    context: {
      rules: MappingRule[];
      categories: Category[];
      recentTransactions?: Transaction[];
      historicalMerchants?: string[];
    },
  ): Promise<Map<string, PipelineResult>> {
    const results = new Map<string, PipelineResult>();

    for (const transaction of transactions) {
      try {
        const result = await this.classify(transaction, context);
        if (transaction.id) {
          results.set(transaction.id, result);
        }
      } catch (error) {
        logger.error(
          `Failed to classify transaction ${transaction.id}`,
          error as Error,
        );
      }
    }

    return results;
  }

  getStats(results: Map<string, PipelineResult>) {
    const stats = {
      total: results.size,
      bySource: {
        rule: 0,
        ai: 0,
        human: 0,
        import: 0,
      },
      autoApplied: 0,
      queuedForReview: 0,
      averageConfidence: 0,
    };

    let totalConfidence = 0;

    for (const result of results.values()) {
      stats.bySource[result.decision.source]++;
      if (result.shouldSave) stats.autoApplied++;
      if (result.shouldQueue) stats.queuedForReview++;
      totalConfidence += result.decision.confidence;
    }

    stats.averageConfidence =
      stats.total > 0 ? totalConfidence / stats.total : 0;

    return stats;
  }
}

export function createClassificationResult(
  transactionId: string,
  decision: ClassificationDecision,
  previousCategoryId?: string,
): ClassificationResult {
  return {
    transactionId,
    categoryId: decision.categoryId,
    merchant: decision.merchant,
    tags: decision.tags,
    method: {
      source: decision.source,
      confidence: decision.confidence,
      ruleId: decision.ruleId,
      ruleName: decision.ruleName,
      modelName: decision.modelName,
      prompt: decision.reasoning,
    },
    appliedAt: Date.now(),
    previousCategoryId,
  };
}
