import type { InvestmentTransactionType } from "@/domain/investments/types";
import type { Currency } from "@/types/common";
import type { CSVRow } from "./types";

export interface InvestmentCSVFieldMapping {
  date?: string;
  ticker?: string;
  transactionType?: string;
  quantity?: string;
  price?: string;
  amount?: string;
  fees?: string;
  notes?: string;
}

export interface ParsedInvestmentTransaction {
  date?: Date;
  ticker?: string;
  transactionType: InvestmentTransactionType;
  quantity?: number;
  price?: number; // in cents
  amount: number; // in cents
  fees?: number; // in cents
  notes?: string;
  currency: Currency;
  rawRow: CSVRow;
  isDuplicate?: boolean;
  error?: string;
}

export interface InvestmentCSVImportOptions {
  delimiter?: "," | ";" | "\t" | "|";
  hasHeader?: boolean;
  investmentAccountId: string;
  skipDuplicates?: boolean;
  mapping: InvestmentCSVFieldMapping;
  defaultCurrency: Currency;
}

export interface InvestmentImportResult {
  success: number;
  skipped: number;
  errors: number;
  duplicates: number;
  messages: string[];
}

export const INVESTMENT_FIELD_OPTIONS = [
  { value: "none", labelKey: "ignore" },
  { value: "date", labelKey: "date", required: true },
  { value: "ticker", labelKey: "ticker" },
  { value: "transactionType", labelKey: "transactionType", required: true },
  { value: "quantity", labelKey: "quantity" },
  { value: "price", labelKey: "price" },
  { value: "amount", labelKey: "amount", required: true },
  { value: "fees", labelKey: "fees" },
  { value: "notes", labelKey: "notes" },
] as const;

export const TRANSACTION_TYPE_MAPPING: Record<
  string,
  InvestmentTransactionType
> = {
  // Portuguese
  compra: "buy",
  venda: "sell",
  dividendo: "dividend",
  dividendos: "dividend",
  jcp: "jcp",
  "juros sobre capital próprio": "jcp",
  juros: "interest",
  rendimento: "interest",
  taxa: "fee",
  tarifa: "fee",
  aporte: "deposit",
  depósito: "deposit",
  deposito: "deposit",
  resgate: "withdrawal",
  saque: "withdrawal",
  "transferência entrada": "transfer_in",
  "transferência saída": "transfer_out",
  desdobramento: "split",
  agrupamento: "reverse_split",
  bonificação: "bonus",
  bonificacao: "bonus",
  outro: "other",
  outros: "other",
  // English
  buy: "buy",
  purchase: "buy",
  sell: "sell",
  sale: "sell",
  dividend: "dividend",
  interest: "interest",
  fee: "fee",
  deposit: "deposit",
  withdrawal: "withdrawal",
  transfer_in: "transfer_in",
  transfer_out: "transfer_out",
  split: "split",
  reverse_split: "reverse_split",
  bonus: "bonus",
  other: "other",
};
