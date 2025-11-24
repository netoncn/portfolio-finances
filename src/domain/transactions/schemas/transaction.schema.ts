import {
  centsSchema,
  tsSchema,
  uidSchema,
} from "@lib/validation/common.schema";
import {
  accountTypeEnum,
  cardBrandEnum,
  installmentStatusEnum,
  transactionTypeEnum,
} from "@lib/validation/enums";
import { z } from "zod";

export const createTransactionSchema = z.object({
  userId: uidSchema,
  accountId: z.string().min(1),
  accountType: accountTypeEnum,
  cardBrand: cardBrandEnum.optional(),

  date: tsSchema,
  description: z.string().min(1),
  merchant: z.string().optional(),
  amount: centsSchema,
  type: transactionTypeEnum,
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),

  installmentGroupId: z.string().optional(),
  installmentNumber: z.number().int().min(1).optional(),
  installmentCount: z.number().int().min(1).optional(),
  purchaseDate: tsSchema.optional(),
  dueDate: tsSchema.optional(),
  statementMonth: z
    .string()
    .regex(/^\d{6}$/, "Use yyyymm")
    .optional(),
  interestAmount: z.number().int().optional(),
  feesAmount: z.number().int().optional(),
  status: installmentStatusEnum.optional(),
});

export const updateTransactionSchema = z.object({
  id: z.string().min(1),
  userId: uidSchema,
  accountId: z.string().min(1).optional(),
  accountType: accountTypeEnum.optional(),
  cardBrand: cardBrandEnum.optional(),

  date: tsSchema.optional(),
  description: z.string().min(1).optional(),
  merchant: z.string().optional(),
  amount: centsSchema.optional(),
  type: transactionTypeEnum.optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),

  installmentGroupId: z.string().optional(),
  installmentNumber: z.number().int().min(1).optional(),
  installmentCount: z.number().int().min(1).optional(),
  purchaseDate: tsSchema.optional(),
  dueDate: tsSchema.optional(),
  statementMonth: z
    .string()
    .regex(/^\d{6}$/, "Use yyyymm")
    .optional(),
  interestAmount: z.number().int().optional(),
  feesAmount: z.number().int().optional(),
  status: installmentStatusEnum.optional(),
});
