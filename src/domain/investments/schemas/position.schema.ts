import { z } from "zod";
import { uidSchema } from "@/lib/validation/common.schema";
import { currencyEnum, investmentAssetTypeEnum } from "@/lib/validation/enums";

export const createPositionSchema = z.object({
  userId: uidSchema,
  investmentAccountId: z.string().min(1, "Conta de investimento é obrigatória"),
  ticker: z
    .string()
    .min(1, "Ticker é obrigatório")
    .max(20, "Ticker deve ter no máximo 20 caracteres")
    .toUpperCase(),
  assetType: investmentAssetTypeEnum,
  assetName: z.string().min(1, "Nome do ativo é obrigatório"),
  quantity: z
    .number()
    .positive("Quantidade deve ser positiva")
    .finite("Quantidade deve ser um número finito"),
  averagePrice: z
    .number()
    .int("Preço médio deve ser em centavos (número inteiro)")
    .nonnegative("Preço médio não pode ser negativo"),
  currency: currencyEnum.default("BRL"),
  notes: z.string().optional(),
});

export const updatePositionSchema = z.object({
  id: z.string().min(1),
  userId: uidSchema,
  investmentAccountId: z
    .string()
    .min(1, "Conta de investimento é obrigatória")
    .optional(),
  ticker: z
    .string()
    .min(1, "Ticker é obrigatório")
    .max(20, "Ticker deve ter no máximo 20 caracteres")
    .toUpperCase()
    .optional(),
  assetType: investmentAssetTypeEnum.optional(),
  assetName: z.string().min(1, "Nome do ativo é obrigatório").optional(),
  quantity: z
    .number()
    .positive("Quantidade deve ser positiva")
    .finite("Quantidade deve ser um número finito")
    .optional(),
  averagePrice: z
    .number()
    .int("Preço médio deve ser em centavos (número inteiro)")
    .nonnegative("Preço médio não pode ser negativo")
    .optional(),
  currency: currencyEnum.optional(),
  notes: z.string().optional(),
});
