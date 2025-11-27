import { z } from "zod";
import { uidSchema } from "@/lib/validation/common.schema";
import { currencyEnum, earningTypeEnum } from "@/lib/validation/enums";

export const createEarningSchema = z.object({
  userId: uidSchema,
  investmentAccountId: z.string().min(1, "Conta de investimento é obrigatória"),
  positionId: z.string().min(1, "Posição é obrigatória"),
  ticker: z
    .string()
    .min(1, "Ticker é obrigatório")
    .max(20, "Ticker deve ter no máximo 20 caracteres")
    .toUpperCase(),
  earningType: earningTypeEnum,
  amount: z
    .number()
    .int("Valor deve ser em centavos (número inteiro)")
    .positive("Valor deve ser positivo"),
  amountPerShare: z
    .number()
    .int("Valor por ação deve ser em centavos (número inteiro)")
    .nonnegative("Valor por ação não pode ser negativo")
    .optional(),
  quantity: z
    .number()
    .positive("Quantidade deve ser positiva")
    .finite("Quantidade deve ser um número finito")
    .optional(),
  paymentDate: z.number().int().positive("Data de pagamento é obrigatória"),
  exDate: z.number().int().positive().optional(),
  recordDate: z.number().int().positive().optional(),
  currency: currencyEnum.default("BRL"),
  taxWithheld: z
    .number()
    .int("Imposto retido deve ser em centavos (número inteiro)")
    .nonnegative("Imposto retido não pode ser negativo")
    .optional(),
  notes: z.string().optional(),
});

export const updateEarningSchema = z.object({
  id: z.string().min(1),
  userId: uidSchema,
  investmentAccountId: z
    .string()
    .min(1, "Conta de investimento é obrigatória")
    .optional(),
  positionId: z.string().min(1, "Posição é obrigatória").optional(),
  ticker: z
    .string()
    .min(1, "Ticker é obrigatório")
    .max(20, "Ticker deve ter no máximo 20 caracteres")
    .toUpperCase()
    .optional(),
  earningType: earningTypeEnum.optional(),
  amount: z
    .number()
    .int("Valor deve ser em centavos (número inteiro)")
    .positive("Valor deve ser positivo")
    .optional(),
  amountPerShare: z
    .number()
    .int("Valor por ação deve ser em centavos (número inteiro)")
    .nonnegative("Valor por ação não pode ser negativo")
    .optional(),
  quantity: z
    .number()
    .positive("Quantidade deve ser positiva")
    .finite("Quantidade deve ser um número finito")
    .optional(),
  paymentDate: z
    .number()
    .int()
    .positive("Data de pagamento é obrigatória")
    .optional(),
  exDate: z.number().int().positive().optional(),
  recordDate: z.number().int().positive().optional(),
  currency: currencyEnum.optional(),
  taxWithheld: z
    .number()
    .int("Imposto retido deve ser em centavos (número inteiro)")
    .nonnegative("Imposto retido não pode ser negativo")
    .optional(),
  notes: z.string().optional(),
});
