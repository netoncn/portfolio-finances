import { uidSchema } from "@lib/validation/common.schema";
import {
  accountTypeEnum,
  cardBrandEnum,
  currencyEnum,
} from "@lib/validation/enums";
import { z } from "zod";
import { isDueDayValid } from "../helpers/billing.helper";

export const accountBenefitsSchema = z.object({
  airline: z.string().optional(),
  lounge: z.boolean().optional(),
  cashback: z.number().min(0).max(1).optional(),
  fxFee: z.number().min(0).max(1).optional(),
  notes: z.string().optional(),
});

export const accountBillingInputSchema = z
  .object({
    closingDay: z.number().int().min(1).max(28),
    dueDay: z.number().int().min(1).max(28),
    creditLimit: z.number().int().nonnegative().optional(),
  })
  .refine((data) => data.closingDay !== data.dueDay, {
    message: "closingDay e dueDay devem ser diferentes",
    path: ["dueDay"],
  })
  .refine((data) => isDueDayValid(data.dueDay, data.closingDay), {
    message:
      "dueDay deve ser pelo menos 3 dias após closingDay (mesmo mês) ou em qualquer dia do mês seguinte",
    path: ["dueDay"],
  });

export const accountBillingSchema = z
  .object({
    closingDay: z.number().int().min(1).max(28),
    dueDay: z.number().int().min(1).max(28),
    creditLimit: z.number().int().nonnegative().optional(),
    availableCredit: z.number().int().nonnegative().optional(),
  })
  .refine((data) => data.closingDay !== data.dueDay, {
    message: "closingDay e dueDay devem ser diferentes",
    path: ["dueDay"],
  })
  .refine((data) => isDueDayValid(data.dueDay, data.closingDay), {
    message:
      "dueDay deve ser pelo menos 3 dias após closingDay (mesmo mês) ou em qualquer dia do mês seguinte",
    path: ["dueDay"],
  });

const cardTypes = ["card_credit", "card_debit", "prepaid"] as const;
const bankTypes = ["wallet_cash", "bank_checking", "bank_savings"] as const;

export const createAccountSchema = z
  .object({
    userId: uidSchema,
    name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
    accountType: accountTypeEnum,
    currency: currencyEnum.default("BRL"),
    icon: z.string().optional(),
    issuer: z.string().optional(),
    last4: z
      .string()
      .regex(/^\d{2,4}$/, "Use 2–4 dígitos finais")
      .optional()
      .or(z.literal("")),
    cardBrand: cardBrandEnum.optional(),
    benefits: accountBenefitsSchema.optional(),
    billing: accountBillingInputSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const isCard = cardTypes.includes(data.accountType as any);
    const isBank = bankTypes.includes(data.accountType as any);
    const isCreditCard = data.accountType === "card_credit";

    if (isCreditCard && !data.billing) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cartões de crédito devem ter informações de faturamento",
        path: ["billing"],
      });
    }

    if (isCard && !data.cardBrand) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cartões devem ter a bandeira especificada",
        path: ["cardBrand"],
      });
    }

    if (isBank && data.billing) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Contas bancárias e carteiras não devem ter faturamento",
        path: ["billing"],
      });
    }

    if (isBank && data.cardBrand) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Contas bancárias e carteiras não devem ter bandeira de cartão",
        path: ["cardBrand"],
      });
    }

    if (isBank && data.last4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Contas bancárias e carteiras não devem ter últimos dígitos",
        path: ["last4"],
      });
    }

    if (!isCreditCard && data.benefits) {
      if (data.benefits.airline || data.benefits.lounge !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Benefícios de milhas/lounge são exclusivos de cartões de crédito",
          path: ["benefits"],
        });
      }
    }
  });

export const updateAccountSchema = z
  .object({
    id: z.string().min(1),
    userId: uidSchema,
    name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").optional(),
    accountType: accountTypeEnum.optional(),
    currency: currencyEnum.optional(),
    icon: z.string().optional(),
    issuer: z.string().optional(),
    last4: z
      .string()
      .regex(/^\d{2,4}$/, "Use 2–4 dígitos finais")
      .optional()
      .or(z.literal("")),
    cardBrand: cardBrandEnum.optional(),
    benefits: accountBenefitsSchema.optional(),
    billing: accountBillingInputSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.accountType) return;

    const isCard = cardTypes.includes(data.accountType as any);
    const isBank = bankTypes.includes(data.accountType as any);
    const isCreditCard = data.accountType === "card_credit";

    if (isCreditCard && data.billing === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Não é possível remover faturamento de cartão de crédito",
        path: ["billing"],
      });
    }

    if (isCard && data.cardBrand === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Não é possível remover bandeira de cartão",
        path: ["cardBrand"],
      });
    }

    if (isBank && data.billing) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Contas bancárias e carteiras não devem ter faturamento",
        path: ["billing"],
      });
    }

    if (isBank && data.cardBrand) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Contas bancárias e carteiras não devem ter bandeira de cartão",
        path: ["cardBrand"],
      });
    }
  });
