import type { Transaction } from "./transaction";

export type { ClassificationDecision } from "@/lib/classification/classification-pipeline";

export type ClassificationSource = "rule" | "ai" | "human" | "import";

export interface ClassificationMethod {
  source: ClassificationSource;
  confidence: number;
  ruleId?: string;
  ruleName?: string;
  modelName?: string;
  modelVersion?: string;
  prompt?: string;
  rawResponse?: string;
  reviewedBy?: string;
  reviewedAt?: number;
  notes?: string;
}

export interface ClassificationResult {
  transactionId: string;
  categoryId?: string;
  merchant?: string;
  tags?: string[];
  method: ClassificationMethod;
  appliedAt: number;
  previousCategoryId?: string;
}

export type ReviewStatus =
  | "pending"
  | "in_review"
  | "approved"
  | "rejected"
  | "skipped";

export interface TransactionReview {
  id: string;
  userId: string;
  transactionId: string;
  transaction: Transaction;

  suggestedCategoryId?: string;
  suggestedMerchant?: string;
  suggestedTags?: string[];
  suggestionSource: ClassificationSource;
  suggestionConfidence: number;
  suggestionReason?: string;

  status: ReviewStatus;
  priority: "low" | "medium" | "high";
  assignedTo?: string;
  reviewedBy?: string;
  reviewedAt?: number;

  approvedCategoryId?: string;
  approvedMerchant?: string;
  approvedTags?: string[];
  reviewNotes?: string;

  createRule?: boolean;
  improveSuggestion?: boolean;

  createdAt: number;
  updatedAt: number;
}

export interface ClassificationStats {
  total: number;
  bySource: Record<ClassificationSource, number>;
  averageConfidence: number;
  needsReview: number;
  reviewed: number;
  accuracy?: number; // If we have human validation data
}

export interface AIClassificationRequest {
  transaction: Transaction;
  context?: {
    recentTransactions?: Transaction[];
    userCategories?: Array<{ id: string; name: string; type: string }>;
    historicalMerchants?: string[];
  };
}

export interface AIClassificationResponse {
  categoryId?: string;
  categoryName?: string;
  merchant?: string;
  tags?: string[];
  confidence: number;
  reasoning?: string;
  modelName: string;
  modelVersion?: string;
}
