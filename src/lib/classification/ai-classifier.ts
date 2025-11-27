import "server-only";
import { AIServiceWrapper } from "@/domain/ai-usage";
import type { Category } from "@/domain/categories/types/category";
import type {
  AIClassificationRequest,
  AIClassificationResponse,
} from "@/domain/transactions/types/classification";
import type { Transaction } from "@/domain/transactions/types/transaction";
import type { LLMMessage } from "@/lib/llm";
import { LLMProviderFactory } from "@/lib/llm";
import { logger } from "@/lib/logger";
import { PrivacyService } from "@/lib/privacy";
import { getUserLocale } from "@/services/locale";

export class AIClassifier {
  private static readonly CONFIDENCE_THRESHOLD = 0.7;

  private static buildPrompt(
    transaction: Transaction,
    categories: Category[],
    locale: string,
    context?: {
      recentTransactions?: Transaction[];
      historicalMerchants?: string[];
    },
  ): string {
    const sanitizedTransaction = PrivacyService.sanitizeTransaction({
      description: transaction.description,
      merchant: transaction.merchant,
      tags: transaction.tags,
    });

    const categoriesText = categories
      .map(
        (cat) =>
          `- ${cat.name} (${cat.type})${cat.keywords ? `: Keywords: ${cat.keywords.join(", ")}` : ""}`,
      )
      .join("\n");

    const languageInstruction =
      locale === "pt-BR"
        ? "You MUST respond with JSON fields (categoryName, merchant, tags, reasoning) in Brazilian Portuguese (pt-BR)."
        : "You should respond with JSON fields in English.";

    const amountInCurrency = transaction.amount / 100;
    const currencySymbol = locale === "pt-BR" ? "R$" : "$";

    let prompt = `You are a financial transaction classifier. Analyze the following transaction and suggest the most appropriate category, merchant name, and tags.

IMPORTANT LANGUAGE INSTRUCTION:
${languageInstruction}

Transaction Details:
- Description: ${sanitizedTransaction.description}
- Amount: ${currencySymbol}${amountInCurrency.toFixed(2)}
- Type: ${transaction.type}
- Current Merchant: ${sanitizedTransaction.merchant || "Not set"}
- Date: ${new Date(transaction.date).toLocaleDateString()}

Available Categories:
${categoriesText}

`;

    if (context?.recentTransactions && context.recentTransactions.length > 0) {
      const sanitizedRecent = context.recentTransactions
        .slice(0, 5)
        .map((t) => {
          const sanitized = PrivacyService.sanitizeTransaction({
            description: t.description,
            merchant: t.merchant,
          });
          return {
            description: sanitized.description,
            amount: t.amount,
            categoryId: t.categoryId,
          };
        });

      const recentText = sanitizedRecent
        .map(
          (t) =>
            `- ${t.description} (${currencySymbol}${(t.amount / 100).toFixed(2)}) - Category: ${t.categoryId || "None"}`,
        )
        .join("\n");

      prompt += `\nRecent Similar Transactions:
${recentText}

`;
    }

    if (
      context?.historicalMerchants &&
      context.historicalMerchants.length > 0
    ) {
      const sanitizedMerchants = context.historicalMerchants
        .slice(0, 10)
        .map((merchant) => {
          const sanitized = PrivacyService.sanitizeText(merchant, {
            enableTruncation: false,
          });
          return sanitized.sanitized;
        });

      prompt += `\nKnown Merchants:
${sanitizedMerchants.join(", ")}

`;
    }

    prompt += `Please provide your classification in the following JSON format:
{
  "categoryId": "category-id-from-the-list",
  "categoryName": "Category Name",
  "merchant": "Cleaned merchant name",
  "tags": ["tag1", "tag2"],
  "confidence": 0.95,
  "reasoning": "Brief explanation of why this category was chosen"
}

Guidelines:
1. Choose the categoryId from the provided list that best matches the transaction
2. Normalize the merchant name (e.g., "AMZN*MKTPLACE" -> "Amazon")
3. Suggest 2-4 relevant tags
4. Confidence should be between 0 and 1
5. Provide clear reasoning for your choice
6. Return ONLY the JSON object, no additional text`;

    return prompt;
  }

  static async classifyTransaction(
    request: AIClassificationRequest,
  ): Promise<AIClassificationResponse | null> {
    const { transaction, context } = request;

    if (!LLMProviderFactory.isAnyProviderAvailable()) {
      logger.warn("No LLM provider configured - AI classification disabled");
      return null;
    }

    if (!context?.userCategories || context.userCategories.length === 0) {
      logger.warn("No categories available for classification");
      return null;
    }

    try {
      const locale = await getUserLocale();

      const prompt = AIClassifier.buildPrompt(
        transaction,
        context.userCategories as Category[],
        locale,
        {
          recentTransactions: context.recentTransactions,
          historicalMerchants: context.historicalMerchants,
        },
      );

      // Determine language instruction based on locale
      const languageInstruction =
        locale === "pt-BR"
          ? "You MUST respond with JSON fields (categoryName, merchant, tags, reasoning) in Brazilian Portuguese (pt-BR). Always respond with valid JSON only."
          : "You are a financial transaction classifier. Always respond with valid JSON only.";

      const messages: LLMMessage[] = [
        {
          role: "system",
          content: languageInstruction,
        },
        {
          role: "user",
          content: prompt,
        },
      ];

      const result = await AIServiceWrapper.generateJSON<{
        categoryId?: string;
        categoryName?: string;
        merchant?: string;
        tags?: string[];
        confidence?: number;
        reasoning?: string;
      }>(
        transaction.userId,
        "classification",
        messages,
        {
          temperature: 0.3, // Lower temperature for more consistent results
          maxTokens: 500,
        },
        {
          transactionId: transaction.id,
          transactionDescription: transaction.description,
          transactionAmount: transaction.amount,
        },
      );

      const provider = LLMProviderFactory.getProvider();
      return {
        categoryId: result.categoryId,
        categoryName: result.categoryName,
        merchant: result.merchant,
        tags: result.tags || [],
        confidence: result.confidence || 0.5,
        reasoning: result.reasoning,
        modelName: provider.type,
        modelVersion: "2.0",
      };
    } catch (error) {
      logger.error("AI classification error", error as Error);
      return null;
    }
  }

  static async classifyTransactionsBatch(
    requests: AIClassificationRequest[],
  ): Promise<Map<string, AIClassificationResponse>> {
    const results = new Map<string, AIClassificationResponse>();

    const BATCH_SIZE = 5;
    for (let i = 0; i < requests.length; i += BATCH_SIZE) {
      const batch = requests.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (req) => {
          const result = await AIClassifier.classifyTransaction(req);
          return {
            transactionId: req.transaction.id,
            result,
          };
        }),
      );

      for (const { transactionId, result } of batchResults) {
        if (result && transactionId) {
          results.set(transactionId, result);
        }
      }
    }

    return results;
  }

  static isAvailable(): boolean {
    return LLMProviderFactory.isAnyProviderAvailable();
  }

  static getConfidenceThreshold(): number {
    return AIClassifier.CONFIDENCE_THRESHOLD;
  }
}
