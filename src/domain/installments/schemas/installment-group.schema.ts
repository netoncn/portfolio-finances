import {
  centsSchema,
  idSchema,
  tsSchema,
  uidSchema,
} from "@lib/validation/common.schema";
import { z } from "zod";

export const installmentPlanEnum = z.enum([
  "no_interest",
  "interest",
  "revolving",
]);

const baseInstallmentGroupFields = {
  userId: uidSchema,
  merchant: z.string().min(1).max(200).optional(),
  purchaseDate: tsSchema,
  installmentCount: z.number().int().min(1).max(360),
  originalAmount: centsSchema.refine((val) => val > 0, {
    message: "Original amount must be positive",
  }),
  interestTotal: z.number().int().nonnegative().optional(),
  feesTotal: z.number().int().nonnegative().optional(),
  cardAccountId: idSchema,
  firstDueDate: tsSchema,
  statementStartMonth: z
    .string()
    .regex(/^\d{6}$/, "Use yyyymm format")
    .optional(),
  plan: installmentPlanEnum.optional(),
  notes: z.string().max(1000).optional(),
};

export const createInstallmentGroupSchema = z
  .object(baseInstallmentGroupFields)
  .refine(
    (data) => {
      return data.firstDueDate >= data.purchaseDate;
    },
    {
      message: "First due date must be on or after purchase date",
      path: ["firstDueDate"],
    },
  )
  .refine(
    (data) => {
      if (data.plan === "no_interest" && data.interestTotal) {
        return data.interestTotal === 0;
      }
      return true;
    },
    {
      message: "No interest plan cannot have interest total",
      path: ["interestTotal"],
    },
  );

export const updateInstallmentGroupSchema = z
  .object({
    id: idSchema,
    userId: uidSchema,
    merchant: z.string().min(1).max(200).optional(),
    purchaseDate: tsSchema.optional(),
    installmentCount: z.number().int().min(1).max(360).optional(),
    originalAmount: centsSchema
      .refine((val) => val > 0, {
        message: "Original amount must be positive",
      })
      .optional(),
    interestTotal: z.number().int().nonnegative().optional(),
    feesTotal: z.number().int().nonnegative().optional(),
    cardAccountId: idSchema.optional(),
    firstDueDate: tsSchema.optional(),
    statementStartMonth: z
      .string()
      .regex(/^\d{6}$/, "Use yyyymm format")
      .optional(),
    plan: installmentPlanEnum.optional(),
    notes: z.string().max(1000).optional(),
  })
  .refine(
    (data) => {
      if (data.firstDueDate && data.purchaseDate) {
        return data.firstDueDate >= data.purchaseDate;
      }
      return true;
    },
    {
      message: "First due date must be on or after purchase date",
      path: ["firstDueDate"],
    },
  );

export const installmentGroupSchema = createInstallmentGroupSchema.extend({
  id: idSchema,
  createdAt: tsSchema,
  updatedAt: tsSchema,
});
