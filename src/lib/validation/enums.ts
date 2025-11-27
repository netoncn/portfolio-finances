import { z } from "zod";

export const currencyEnum = z.enum(["BRL"]);

export const accountTypeEnum = z.enum([
  "card_credit",
  "card_debit",
  "prepaid",
  "wallet_cash",
  "bank_checking",
  "bank_savings",
]);

export const cardBrandEnum = z.enum([
  "visa",
  "mastercard",
  "amex",
  "elo",
  "hipercard",
  "vr",
  "sodexo",
  "alelo",
  "other",
]);

export const transactionTypeEnum = z.enum(["expense", "income", "transfer"]);

export const installmentStatusEnum = z.enum([
  "scheduled",
  "posted",
  "paid",
  "canceled",
  "refunded",
]);

export const invAccountKindEnum = z.enum([
  "brokerage",
  "savings",
  "pension",
  "crypto_exchange",
]);

export const assetTypeEnum = z.enum([
  "savings",
  "cdb",
  "lci",
  "lca",
  "tesouro",
  "fundo",
  "fii",
  "acao",
  "etf",
  "cripto",
  "outro",
]);

export const pointsProgramNameEnum = z.enum([
  "livelo",
  "esfera",
  "iupp",
  "smiles",
  "latam_pass",
  "tudoazul",
  "ame",
  "meli",
  "outro",
]);

export const pointsBalanceStatusEnum = z.enum([
  "active",
  "redeemed",
  "expired",
]);

export const pointsOperationTypeEnum = z.enum([
  "earn",
  "redeem",
  "transfer_in",
  "transfer_out",
  "adjust",
]);

export const aiRoleEnum = z.enum(["user", "assistant", "tool"]);

export const investmentAccountTypeEnum = z.enum([
  "broker",
  "retirement_401k",
  "retirement_ira",
  "retirement_roth",
  "retirement_pension",
  "education_529",
]);

export const investmentAssetTypeEnum = z.enum([
  "stock",
  "fii",
  "reit",
  "etf",
  "mutual_fund",
  "bond",
  "crypto",
  "commodity",
  "option",
  "other",
]);

export const investmentTransactionTypeEnum = z.enum([
  "buy",
  "sell",
  "dividend",
  "jcp",
  "interest",
  "fee",
  "deposit",
  "withdrawal",
  "transfer_in",
  "transfer_out",
  "split",
  "reverse_split",
  "bonus",
  "other",
]);

export const earningTypeEnum = z.enum([
  "dividend",
  "jcp",
  "interest",
  "capital_gain",
  "return_of_capital",
  "rent",
  "amortization",
  "other",
]);
