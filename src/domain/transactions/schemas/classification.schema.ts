import { z } from "zod";
import { idSchema, tsSchema, uidSchema } from "@/lib/validation/common.schema";

export const classificationSourceEnum = z.enum([
  "rule",
  "ai",
  "human",
  "import",
]);

export const classificationMethodSchema = z.object({
  source: classificationSourceEnum,
  confidence: z.number().min(0).max(1),
  ruleId: idSchema.optional(),
  ruleName: z.string().optional(),
  modelName: z.string().optional(),
  modelVersion: z.string().optional(),
  prompt: z.string().optional(),
  rawResponse: z.string().optional(),
  reviewedBy: uidSchema.optional(),
  reviewedAt: tsSchema.optional(),
  notes: z.string().optional(),
});

export const classificationResultSchema = z.object({
  transactionId: idSchema,
  categoryId: idSchema.optional(),
  merchant: z.string().optional(),
  tags: z.array(z.string()).optional(),
  method: classificationMethodSchema,
  appliedAt: tsSchema,
  previousCategoryId: idSchema.optional(),
});

export const reviewStatusEnum = z.enum([
  "pending",
  "in_review",
  "approved",
  "rejected",
  "skipped",
]);

export const reviewPriorityEnum = z.enum(["low", "medium", "high"]);

export const transactionReviewSchema = z.object({
  id: idSchema,
  userId: uidSchema,
  transactionId: idSchema,

  suggestedCategoryId: idSchema.optional(),
  suggestedMerchant: z.string().optional(),
  suggestedTags: z.array(z.string()).optional(),
  suggestionSource: classificationSourceEnum,
  suggestionConfidence: z.number().min(0).max(1),
  suggestionReason: z.string().optional(),

  status: reviewStatusEnum,
  priority: reviewPriorityEnum,
  assignedTo: uidSchema.optional(),
  reviewedBy: uidSchema.optional(),
  reviewedAt: tsSchema.optional(),

  approvedCategoryId: idSchema.optional(),
  approvedMerchant: z.string().optional(),
  approvedTags: z.array(z.string()).optional(),
  reviewNotes: z.string().optional(),

  createRule: z.boolean().optional(),
  improveSuggestion: z.boolean().optional(),

  createdAt: tsSchema,
  updatedAt: tsSchema,
});

export const createReviewRequestSchema = z.object({
  userId: uidSchema,
  transactionId: idSchema,
  suggestedCategoryId: idSchema.optional(),
  suggestedMerchant: z.string().optional(),
  suggestedTags: z.array(z.string()).optional(),
  suggestionSource: classificationSourceEnum,
  suggestionConfidence: z.number().min(0).max(1),
  suggestionReason: z.string().optional(),
  priority: reviewPriorityEnum.default("medium"),
});

export const updateReviewSchema = z.object({
  id: idSchema,
  userId: uidSchema,
  status: reviewStatusEnum.optional(),
  approvedCategoryId: idSchema.optional(),
  approvedMerchant: z.string().optional(),
  approvedTags: z.array(z.string()).optional(),
  reviewNotes: z.string().optional(),
  createRule: z.boolean().optional(),
  improveSuggestion: z.boolean().optional(),
});

export const aiClassificationRequestSchema = z.object({
  transactionId: idSchema,
  userId: uidSchema,
  includeContext: z.boolean().default(true),
});

export const batchClassificationRequestSchema = z.object({
  userId: uidSchema,
  transactionIds: z.array(idSchema).min(1).max(100),
  forceAI: z.boolean().default(false),
  confidenceThreshold: z.number().min(0).max(1).default(0.7),
});
