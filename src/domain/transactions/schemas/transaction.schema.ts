import {
  centsSchema,
  idSchema,
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

const baseTransactionFields = {
  userId: uidSchema,
  accountId: idSchema,
  accountType: accountTypeEnum,
  cardBrand: cardBrandEnum.optional(),

  date: tsSchema,
  description: z.string().min(1).max(500),
  merchant: z.string().min(1).max(200).optional(),
  amount: centsSchema.refine((val) => val !== 0, {
    message: "Amount cannot be zero",
  }),
  type: transactionTypeEnum,
  categoryId: idSchema.optional(),
  tags: z.array(z.string().min(1).max(50)).max(10).optional(),

  installmentGroupId: idSchema.optional(),
  installmentNumber: z.number().int().min(1).optional(),
  installmentCount: z.number().int().min(1).max(360).optional(),
  purchaseDate: tsSchema.optional(),
  dueDate: tsSchema.optional(),
  statementMonth: z
    .string()
    .regex(/^\d{6}$/, "Use yyyymm format")
    .optional(),
  interestAmount: z.number().int().nonnegative().optional(),
  feesAmount: z.number().int().nonnegative().optional(),
  status: installmentStatusEnum.optional(),
};

export const createTransactionSchema = z
  .object(baseTransactionFields)
  .refine(
    (data) => {
      if (data.installmentNumber && !data.installmentCount) {
        return false;
      }
      return true;
    },
    {
      message:
        "installmentCount is required when installmentNumber is provided",
      path: ["installmentCount"],
    },
  )
  .refine(
    (data) => {
      if (
        data.installmentNumber &&
        data.installmentCount &&
        data.installmentNumber > data.installmentCount
      ) {
        return false;
      }
      return true;
    },
    {
      message: "installmentNumber cannot be greater than installmentCount",
      path: ["installmentNumber"],
    },
  )
  .refine(
    (data) => {
      if (data.installmentGroupId && !data.purchaseDate) {
        return false;
      }
      return true;
    },
    {
      message: "purchaseDate is required for installment transactions",
      path: ["purchaseDate"],
    },
  )
  .refine(
    (data) => {
      const isCard = ["card_credit", "card_debit", "prepaid"].includes(
        data.accountType,
      );
      if (isCard && !data.cardBrand) {
        return false;
      }
      return true;
    },
    {
      message: "cardBrand is required for card accounts",
      path: ["cardBrand"],
    },
  );

export const updateTransactionSchema = z
  .object({
    id: idSchema,
    userId: uidSchema,
    accountId: idSchema.optional(),
    accountType: accountTypeEnum.optional(),
    cardBrand: cardBrandEnum.optional(),

    date: tsSchema.optional(),
    description: z.string().min(1).max(500).optional(),
    merchant: z.string().min(1).max(200).optional(),
    amount: centsSchema
      .refine((val) => val !== 0, {
        message: "Amount cannot be zero",
      })
      .optional(),
    type: transactionTypeEnum.optional(),
    categoryId: idSchema.optional(),
    tags: z.array(z.string().min(1).max(50)).max(10).optional(),

    installmentGroupId: idSchema.optional(),
    installmentNumber: z.number().int().min(1).optional(),
    installmentCount: z.number().int().min(1).max(360).optional(),
    purchaseDate: tsSchema.optional(),
    dueDate: tsSchema.optional(),
    statementMonth: z
      .string()
      .regex(/^\d{6}$/, "Use yyyymm format")
      .optional(),
    interestAmount: z.number().int().nonnegative().optional(),
    feesAmount: z.number().int().nonnegative().optional(),
    status: installmentStatusEnum.optional(),
  })
  .refine(
    (data) => {
      if (data.installmentNumber && !data.installmentCount) {
        return false;
      }
      return true;
    },
    {
      message:
        "installmentCount is required when installmentNumber is provided",
      path: ["installmentCount"],
    },
  )
  .refine(
    (data) => {
      if (
        data.installmentNumber &&
        data.installmentCount &&
        data.installmentNumber > data.installmentCount
      ) {
        return false;
      }
      return true;
    },
    {
      message: "installmentNumber cannot be greater than installmentCount",
      path: ["installmentNumber"],
    },
  );

export const transactionSchema = createTransactionSchema.merge(
  z.object({
    id: idSchema,
    createdAt: tsSchema,
    updatedAt: tsSchema,
    llm: z
      .object({
        classified: z.boolean(),
        model: z.string().optional(),
        confidence: z.number().min(0).max(1).optional(),
        raw: z.string().optional(),
      })
      .optional(),
  }),
);

export const simpleTransactionSchema = createTransactionSchema.refine(
  (data) => {
    return !data.installmentGroupId && !data.installmentNumber;
  },
  {
    message: "This schema is for simple transactions only",
  },
);

export const installmentTransactionSchema = createTransactionSchema.refine(
  (data) => {
    return (
      data.installmentGroupId &&
      data.installmentNumber &&
      data.installmentCount &&
      data.purchaseDate
    );
  },
  {
    message:
      "Installment transactions require installmentGroupId, installmentNumber, installmentCount, and purchaseDate",
  },
);
