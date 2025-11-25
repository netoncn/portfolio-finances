import {
  centsSchema,
  idSchema,
  tsSchema,
  uidSchema,
} from "@lib/validation/common.schema";
import { z } from "zod";

export const statementStatusEnum = z.enum(["open", "closed", "paid"]);

const baseStatementFields = {
  userId: uidSchema,
  accountId: idSchema,
  statementMonth: z
    .string()
    .regex(/^\d{6}$/, "Use yyyymm format (e.g., 202501)"),
  closingDate: tsSchema,
  dueDate: tsSchema,
  status: statementStatusEnum,
  totalAmount: centsSchema,
  paidAmount: centsSchema.default(0),
  minimumPayment: centsSchema,
  paidDate: tsSchema.optional(),
  transactionIds: z.array(idSchema),
  transactionCount: z.number().int().nonnegative(),
  previousBalance: centsSchema.optional(),
  interestAmount: centsSchema.optional(),
  feesAmount: centsSchema.optional(),
  notes: z.string().max(500).optional(),
};

export const createStatementSchema = z.object(baseStatementFields);

export const updateStatementSchema = z.object({
  id: idSchema,
  userId: uidSchema,
  status: statementStatusEnum.optional(),
  paidAmount: centsSchema.optional(),
  paidDate: tsSchema.optional(),
  notes: z.string().max(500).optional(),
});

export const statementSchema = createStatementSchema.extend({
  id: idSchema,
  createdAt: tsSchema,
  updatedAt: tsSchema,
});
