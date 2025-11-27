import { z } from "zod";
import { uidSchema } from "@/lib/validation/common.schema";
import {
  currencyEnum,
  investmentTransactionTypeEnum,
} from "@/lib/validation/enums";

export const createInvestmentTransactionSchema = z
  .object({
    userId: uidSchema,
    investmentAccountId: z
      .string()
      .min(1, "Conta de investimento é obrigatória"),
    positionId: z.string().optional(),
    ticker: z
      .string()
      .max(20, "Ticker deve ter no máximo 20 caracteres")
      .optional(),
    transactionType: investmentTransactionTypeEnum,
    quantity: z
      .number()
      .positive("Quantidade deve ser positiva")
      .finite("Quantidade deve ser um número finito")
      .optional(),
    price: z
      .number()
      .int("Preço deve ser em centavos (número inteiro)")
      .nonnegative("Preço não pode ser negativo")
      .optional(),
    amount: z
      .number()
      .int("Valor deve ser em centavos (número inteiro)")
      .finite("Valor deve ser um número finito"),
    fees: z
      .number()
      .int("Taxa deve ser em centavos (número inteiro)")
      .nonnegative("Taxa não pode ser negativa")
      .optional(),
    currency: currencyEnum.default("BRL"),
    date: z.number().int().positive("Data é obrigatória"),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const requiresAsset = [
      "buy",
      "sell",
      "dividend",
      "jcp",
      "interest",
      "split",
      "reverse_split",
      "bonus",
    ];
    const requiresQuantity = ["buy", "sell", "split", "reverse_split", "bonus"];
    const requiresPrice = ["buy", "sell"];

    if (requiresAsset.includes(data.transactionType) && !data.ticker) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Ticker é obrigatório para transações do tipo ${data.transactionType}`,
        path: ["ticker"],
      });
    }

    if (requiresQuantity.includes(data.transactionType) && !data.quantity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Quantidade é obrigatória para transações do tipo ${data.transactionType}`,
        path: ["quantity"],
      });
    }

    if (requiresPrice.includes(data.transactionType) && !data.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Preço é obrigatório para transações do tipo ${data.transactionType}`,
        path: ["price"],
      });
    }
  });

export const updateInvestmentTransactionSchema = z.object({
  id: z.string().min(1),
  userId: uidSchema,
  investmentAccountId: z
    .string()
    .min(1, "Conta de investimento é obrigatória")
    .optional(),
  positionId: z.string().optional(),
  ticker: z
    .string()
    .max(20, "Ticker deve ter no máximo 20 caracteres")
    .optional(),
  transactionType: investmentTransactionTypeEnum.optional(),
  quantity: z
    .number()
    .positive("Quantidade deve ser positiva")
    .finite("Quantidade deve ser um número finito")
    .optional(),
  price: z
    .number()
    .int("Preço deve ser em centavos (número inteiro)")
    .nonnegative("Preço não pode ser negativo")
    .optional(),
  amount: z
    .number()
    .int("Valor deve ser em centavos (número inteiro)")
    .finite("Valor deve ser um número finito")
    .optional(),
  fees: z
    .number()
    .int("Taxa deve ser em centavos (número inteiro)")
    .nonnegative("Taxa não pode ser negativa")
    .optional(),
  currency: currencyEnum.optional(),
  date: z.number().int().positive("Data é obrigatória").optional(),
  notes: z.string().optional(),
});
