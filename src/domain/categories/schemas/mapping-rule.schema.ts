import { idSchema, tsSchema, uidSchema } from "@lib/validation/common.schema";
import { z } from "zod";
import { categoryTypeEnum } from "./category.schema";

export const ruleConditionTypeEnum = z.enum([
  "description_contains",
  "description_matches",
  "amount_greater_than",
  "amount_less_than",
  "amount_equals",
  "amount_between",
  "merchant_equals",
  "merchant_contains",
]);

export const ruleConditionSchema = z.object({
  type: ruleConditionTypeEnum,
  value: z.union([
    z.string().min(1),
    z.number(),
    z.tuple([z.number(), z.number()]),
  ]),
  caseSensitive: z.boolean().optional(),
});

export const ruleActionTypeEnum = z.enum([
  "assign_category",
  "add_tags",
  "set_merchant",
]);

export const ruleActionSchema = z.object({
  type: ruleActionTypeEnum,
  value: z.union([z.string().min(1), z.array(z.string().min(1))]),
});

export const rulePriorityEnum = z.enum(["low", "medium", "high"]);

const baseMappingRuleFields = {
  userId: uidSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  categoryType: categoryTypeEnum.optional(),
  conditions: z.array(ruleConditionSchema).min(1).max(10),
  actions: z.array(ruleActionSchema).min(1).max(5),
  priority: rulePriorityEnum,
  enabled: z.boolean(),
  usageCount: z.number().int().nonnegative().optional(),
  lastUsedAt: tsSchema.optional(),
};

export const createMappingRuleSchema = z.object(baseMappingRuleFields);

export const updateMappingRuleSchema = z.object({
  id: idSchema,
  userId: uidSchema,
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  categoryType: categoryTypeEnum.optional(),
  conditions: z.array(ruleConditionSchema).min(1).max(10).optional(),
  actions: z.array(ruleActionSchema).min(1).max(5).optional(),
  priority: rulePriorityEnum.optional(),
  enabled: z.boolean().optional(),
});

export const mappingRuleSchema = createMappingRuleSchema.extend({
  id: idSchema,
  createdAt: tsSchema,
  updatedAt: tsSchema,
});
