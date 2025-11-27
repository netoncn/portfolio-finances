import { z } from "zod";
import { uidSchema } from "@/lib/validation/common.schema";
import {
  currencyEnum,
  investmentAccountTypeEnum,
} from "@/lib/validation/enums";

export const createInvestmentAccountSchema = z.object({
  userId: uidSchema,
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  broker: z.string().min(2, "Corretora deve ter no mínimo 2 caracteres"),
  accountNumber: z.string().optional().or(z.literal("")),
  accountType: investmentAccountTypeEnum.default("broker"),
  currency: currencyEnum.default("BRL"),
});

export const updateInvestmentAccountSchema = z.object({
  id: z.string().min(1),
  userId: uidSchema,
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").optional(),
  broker: z
    .string()
    .min(2, "Corretora deve ter no mínimo 2 caracteres")
    .optional(),
  accountNumber: z.string().optional().or(z.literal("")),
  accountType: investmentAccountTypeEnum.optional(),
  currency: currencyEnum.optional(),
});
