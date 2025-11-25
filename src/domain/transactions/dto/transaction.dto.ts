import type { z } from "zod";
import type {
  createTransactionSchema,
  installmentTransactionSchema,
  simpleTransactionSchema,
  transactionSchema,
  updateTransactionSchema,
} from "../schemas/transaction.schema";

export type CreateTransactionDTO = z.infer<typeof createTransactionSchema>;

export type UpdateTransactionDTO = z.infer<typeof updateTransactionSchema>;

export type TransactionDTO = z.infer<typeof transactionSchema>;

export type CreateSimpleTransactionDTO = z.infer<
  typeof simpleTransactionSchema
>;

export type CreateInstallmentTransactionDTO = z.infer<
  typeof installmentTransactionSchema
>;
