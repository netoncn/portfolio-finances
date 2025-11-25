import { idSchema, tsSchema, uidSchema } from "@lib/validation/common.schema";
import { z } from "zod";

export const categoryTypeEnum = z.enum(["expense", "income", "transfer"]);

const baseCategoryFields = {
  userId: uidSchema,
  name: z.string().min(1).max(100),
  type: categoryTypeEnum,
  icon: z.string().max(10).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  parentId: idSchema.optional(),
  keywords: z.array(z.string().min(1).max(50)).max(50).optional(),
  budgetLimit: z.number().int().nonnegative().optional(),
  isSystem: z.boolean().optional(),
  order: z.number().int().nonnegative().optional(),
};

export const createCategorySchema = z.object(baseCategoryFields);

export const updateCategorySchema = z.object({
  id: idSchema,
  userId: uidSchema,
  name: z.string().min(1).max(100).optional(),
  icon: z.string().max(10).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  keywords: z.array(z.string().min(1).max(50)).max(50).optional(),
  budgetLimit: z.number().int().nonnegative().optional(),
  order: z.number().int().nonnegative().optional(),
});

export const categorySchema = createCategorySchema.extend({
  id: idSchema,
  createdAt: tsSchema,
  updatedAt: tsSchema,
});
