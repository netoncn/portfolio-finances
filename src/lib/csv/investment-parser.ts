import type { InvestmentTransactionType } from "@/domain/investments/types";
import type { Currency } from "@/types/common";
import type {
  InvestmentCSVFieldMapping,
  ParsedInvestmentTransaction,
} from "./investment-types";
import { TRANSACTION_TYPE_MAPPING } from "./investment-types";
import { parseAmount, parseDate } from "./parser";
import type { CSVRow } from "./types";

export function parseInvestmentTransactionType(
  typeStr: string,
): InvestmentTransactionType | null {
  if (!typeStr) return null;

  const normalized = typeStr.toLowerCase().trim();
  return TRANSACTION_TYPE_MAPPING[normalized] || null;
}

export function parseQuantity(quantityStr: string): number | null {
  if (!quantityStr) return null;

  let cleaned = quantityStr.trim().replace(/\s/g, "");

  // Handle Brazilian format (1.000,5) vs US format (1,000.5)
  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");

  if (lastComma > lastDot) {
    // Brazilian format: comma is decimal
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    // US format: dot is decimal
    cleaned = cleaned.replace(/,/g, "");
  }

  const quantity = parseFloat(cleaned);
  return Number.isNaN(quantity) ? null : quantity;
}

export function parsePrice(priceStr: string): number | null {
  // Returns price in cents
  const amount = parseAmount(priceStr);
  if (amount === null) return null;
  return Math.round(amount * 100);
}

export function parseInvestmentAmount(amountStr: string): number | null {
  // Returns amount in cents, preserving sign
  if (!amountStr) return null;

  let cleaned = amountStr
    .replace(/[R$€£¥\s]/g, "")
    .replace(/\(/g, "-")
    .replace(/\)/g, "");

  const isNegative = cleaned.startsWith("-");
  cleaned = cleaned.replace("-", "");

  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");

  if (lastDot > lastComma) {
    cleaned = cleaned.replace(/,/g, "");
  } else if (lastComma > lastDot) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }

  const amount = parseFloat(cleaned);
  if (Number.isNaN(amount)) return null;

  const cents = Math.round(amount * 100);
  return isNegative ? -cents : cents;
}

export function autoDetectInvestmentMapping(
  headers: string[],
): InvestmentCSVFieldMapping {
  const mapping: InvestmentCSVFieldMapping = {};

  for (const header of headers) {
    const lower = header.toLowerCase();

    if (
      lower.includes("data") ||
      lower.includes("date") ||
      lower === "dt" ||
      lower === "dt."
    ) {
      if (!mapping.date) mapping.date = header;
    }

    if (
      lower.includes("ticker") ||
      lower.includes("código") ||
      lower.includes("codigo") ||
      lower.includes("ativo") ||
      lower.includes("symbol") ||
      lower.includes("papel")
    ) {
      if (!mapping.ticker) mapping.ticker = header;
    }

    if (
      lower.includes("tipo") ||
      lower.includes("type") ||
      lower.includes("operação") ||
      lower.includes("operacao") ||
      lower.includes("movimentação") ||
      lower.includes("movimentacao")
    ) {
      if (!mapping.transactionType) mapping.transactionType = header;
    }

    if (
      lower.includes("quantidade") ||
      lower.includes("quantity") ||
      lower.includes("qtd") ||
      lower.includes("qty") ||
      lower.includes("cotas") ||
      lower.includes("ações") ||
      lower.includes("acoes")
    ) {
      if (!mapping.quantity) mapping.quantity = header;
    }

    if (
      lower.includes("preço") ||
      lower.includes("preco") ||
      lower.includes("price") ||
      lower.includes("cotação") ||
      lower.includes("cotacao") ||
      lower.includes("unitário") ||
      lower.includes("unitario")
    ) {
      if (!mapping.price) mapping.price = header;
    }

    if (
      lower.includes("valor") ||
      lower.includes("amount") ||
      lower.includes("total") ||
      lower.includes("montante") ||
      lower.includes("financeiro")
    ) {
      if (!mapping.amount) mapping.amount = header;
    }

    if (
      lower.includes("taxa") ||
      lower.includes("fee") ||
      lower.includes("corretagem") ||
      lower.includes("emolumentos") ||
      lower.includes("custos")
    ) {
      if (!mapping.fees) mapping.fees = header;
    }

    if (
      lower.includes("observação") ||
      lower.includes("observacao") ||
      lower.includes("notes") ||
      lower.includes("obs") ||
      lower.includes("descrição") ||
      lower.includes("descricao")
    ) {
      if (!mapping.notes) mapping.notes = header;
    }
  }

  return mapping;
}

export function parseInvestmentCSVRow(
  row: CSVRow,
  mapping: InvestmentCSVFieldMapping,
  defaultCurrency: Currency,
): ParsedInvestmentTransaction {
  try {
    const dateStr = mapping.date ? row[mapping.date] : "";
    const tickerStr = mapping.ticker ? row[mapping.ticker] : "";
    const typeStr = mapping.transactionType ? row[mapping.transactionType] : "";
    const quantityStr = mapping.quantity ? row[mapping.quantity] : "";
    const priceStr = mapping.price ? row[mapping.price] : "";
    const amountStr = mapping.amount ? row[mapping.amount] : "";
    const feesStr = mapping.fees ? row[mapping.fees] : "";
    const notesStr = mapping.notes ? row[mapping.notes] : "";

    const date = parseDate(dateStr);
    if (!date) {
      return {
        transactionType: "other",
        amount: 0,
        currency: defaultCurrency,
        rawRow: row,
        error: "Invalid date",
      };
    }

    const transactionType = parseInvestmentTransactionType(typeStr);
    if (!transactionType) {
      return {
        date,
        transactionType: "other",
        amount: 0,
        currency: defaultCurrency,
        rawRow: row,
        error: `Unknown transaction type: ${typeStr}`,
      };
    }

    const amount = parseInvestmentAmount(amountStr);
    if (amount === null) {
      return {
        date,
        transactionType,
        amount: 0,
        currency: defaultCurrency,
        rawRow: row,
        error: "Invalid amount",
      };
    }

    const ticker = tickerStr ? tickerStr.trim().toUpperCase() : undefined;
    const quantity = quantityStr ? parseQuantity(quantityStr) : undefined;
    const price = priceStr ? parsePrice(priceStr) : undefined;
    const fees = feesStr ? parsePrice(feesStr) : undefined;
    const notes = notesStr ? notesStr.trim() : undefined;

    const requiresTicker = [
      "buy",
      "sell",
      "dividend",
      "jcp",
      "interest",
      "split",
      "reverse_split",
      "bonus",
    ].includes(transactionType);
    const requiresQuantity = [
      "buy",
      "sell",
      "split",
      "reverse_split",
      "bonus",
    ].includes(transactionType);

    if (requiresTicker && !ticker) {
      return {
        date,
        transactionType,
        amount,
        currency: defaultCurrency,
        rawRow: row,
        error: "Ticker required for this transaction type",
      };
    }

    if (requiresQuantity && (quantity === null || quantity === undefined)) {
      return {
        date,
        ticker,
        transactionType,
        amount,
        currency: defaultCurrency,
        rawRow: row,
        error: "Quantity required for this transaction type",
      };
    }

    return {
      date,
      ticker,
      transactionType,
      quantity: quantity ?? undefined,
      price: price ?? undefined,
      amount,
      fees: fees ?? undefined,
      notes,
      currency: defaultCurrency,
      rawRow: row,
    };
  } catch {
    return {
      transactionType: "other",
      amount: 0,
      currency: defaultCurrency,
      rawRow: row,
      error: "Failed to parse row",
    };
  }
}

export function findInvestmentDuplicates(
  transactions: ParsedInvestmentTransaction[],
  existingTransactions: Array<{
    date: number;
    amount: number;
    ticker?: string;
    transactionType: string;
  }>,
): ParsedInvestmentTransaction[] {
  return transactions.map((transaction) => {
    if (!transaction.date || transaction.error) {
      return transaction;
    }

    const transactionDate = transaction.date.getTime();

    // Check for duplicates: same date (±1 day), same amount, same ticker, same type
    const isDuplicate = existingTransactions.some((existing) => {
      const dateDiff = Math.abs(existing.date - transactionDate);
      const oneDayMs = 24 * 60 * 60 * 1000;

      const dateMatch = dateDiff <= oneDayMs;
      const amountMatch = existing.amount === transaction.amount;
      const tickerMatch =
        (!existing.ticker && !transaction.ticker) ||
        existing.ticker === transaction.ticker;
      const typeMatch =
        existing.transactionType === transaction.transactionType;

      return dateMatch && amountMatch && tickerMatch && typeMatch;
    });

    return {
      ...transaction,
      isDuplicate,
    };
  });
}
