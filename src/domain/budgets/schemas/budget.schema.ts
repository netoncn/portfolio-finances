import { idSchema, tsSchema, uidSchema } from "@lib/validation/common.schema";
import { z } from "zod";

export const budgetPeriodEnum = z.enum([
  "monthly",
  "yearly",
  "quarterly",
  "custom",
]);

export const budgetStatusEnum = z.enum(["active", "inactive", "completed"]);

const baseBudgetFields = {
  userId: uidSchema,
  name: z.string().min(1).max(100),
  amount: z.number().int().nonnegative(),
  period: budgetPeriodEnum,
  categoryIds: z.array(idSchema).default([]),
  startDate: tsSchema,
  endDate: tsSchema.optional(),
  alertThreshold: z.number().min(0).max(1).optional(),
  status: budgetStatusEnum.optional().default("active"),
  icon: z.string().max(10).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  notes: z.string().max(500).optional(),
  rollover: z.boolean().optional().default(false),
};

export const createBudgetSchema = z
  .object(baseBudgetFields)
  .refine(
    (data) => {
      if (data.period === "custom") {
        return !!data.endDate;
      }
      return true;
    },
    {
      message: "End date is required for custom period budgets",
      path: ["endDate"],
    },
  )
  .refine(
    (data) => {
      if (data.endDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  );

export const updateBudgetSchema = z
  .object({
    id: idSchema,
    userId: uidSchema,
    name: z.string().min(1).max(100).optional(),
    amount: z.number().int().nonnegative().optional(),
    period: budgetPeriodEnum.optional(),
    categoryIds: z.array(idSchema).optional(),
    startDate: tsSchema.optional(),
    endDate: tsSchema.optional(),
    alertThreshold: z.number().min(0).max(1).optional(),
    status: budgetStatusEnum.optional(),
    icon: z.string().max(10).optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
    notes: z.string().max(500).optional(),
    rollover: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  );

export const updateBudgetSpentSchema = z.object({
  id: idSchema,
  userId: uidSchema,
  spent: z.number().int().nonnegative(),
  lastCalculatedAt: tsSchema,
});

export const budgetSchema = createBudgetSchema.merge(
  z.object({
    id: idSchema,
    spent: z.number().int().nonnegative().default(0),
    lastCalculatedAt: tsSchema.optional(),
    createdAt: tsSchema,
    updatedAt: tsSchema,
  }),
);
