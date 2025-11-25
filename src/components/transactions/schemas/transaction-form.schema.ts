import { z } from "zod";

export const transactionFormSchema = z
  .object({
    accountId: z.string().min(1, "Account is required"),
    date: z.date(),
    description: z.string().min(1, "Description is required").max(500),
    merchant: z.string().max(200).optional().or(z.literal("")),
    amount: z
      .number()
      .positive("Amount must be greater than zero")
      .max(99999999.99, "Amount is too large"),
    type: z.enum(["expense", "income", "transfer"]),
    categoryId: z.string().optional().or(z.literal("")),
    tags: z.array(z.string()).max(10).optional(),

    hasInstallments: z.boolean(),
    installmentCount: z
      .number()
      .int()
      .min(2, "Minimum 2 installments")
      .max(360, "Maximum 360 installments")
      .optional(),

    status: z.enum(["scheduled", "posted", "paid", "canceled", "refunded"]),
  })
  .refine(
    (data) => {
      if (data.hasInstallments && !data.installmentCount) {
        return false;
      }
      return true;
    },
    {
      message: "Number of installments is required",
      path: ["installmentCount"],
    },
  );

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
