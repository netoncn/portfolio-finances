import type { Account } from "@/domain/accounts/types/account";
import type { Transaction } from "@/domain/transactions/types/transaction";
import type { Statement } from "../types/statement";

export function calculateStatementMonth(
  date: Date,
  closingDay: number,
): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();

  const statementMonth = day > closingDay ? month + 1 : month;
  const statementYear = statementMonth > 11 ? year + 1 : year;
  const adjustedMonth = statementMonth > 11 ? 0 : statementMonth;

  const monthStr = String(adjustedMonth + 1).padStart(2, "0");
  return `${statementYear}${monthStr}`;
}

export function calculateClosingDate(
  statementMonth: string,
  closingDay: number,
): number {
  const year = parseInt(statementMonth.substring(0, 4), 10);
  const month = parseInt(statementMonth.substring(4, 6), 10) - 1;

  const closingDate = new Date(year, month, closingDay, 23, 59, 59);
  return closingDate.getTime();
}

export function calculateDueDate(
  statementMonth: string,
  closingDay: number,
  dueDay: number,
): number {
  const year = parseInt(statementMonth.substring(0, 4), 10);
  const month = parseInt(statementMonth.substring(4, 6), 10) - 1;

  const dueMonth = dueDay < closingDay ? month + 1 : month;
  const dueYear = dueMonth > 11 ? year + 1 : year;
  const adjustedDueMonth = dueMonth > 11 ? 0 : dueMonth;

  const dueDate = new Date(dueYear, adjustedDueMonth, dueDay, 23, 59, 59);
  return dueDate.getTime();
}

export function calculateMinimumPayment(
  totalAmount: number,
  rate = 0.15,
): number {
  return Math.round(totalAmount * rate);
}

export function groupTransactionsByStatement(
  transactions: Transaction[],
  closingDay: number,
): Map<string, Transaction[]> {
  const grouped = new Map<string, Transaction[]>();

  for (const transaction of transactions) {
    const date = new Date(transaction.date);
    const statementMonth = calculateStatementMonth(date, closingDay);

    if (!grouped.has(statementMonth)) {
      grouped.set(statementMonth, []);
    }
    grouped.get(statementMonth)!.push(transaction);
  }

  return grouped;
}

export function calculateStatementTotals(transactions: Transaction[]): {
  totalAmount: number;
  transactionCount: number;
  expenseAmount: number;
  incomeAmount: number;
} {
  let totalAmount = 0;
  let expenseAmount = 0;
  let incomeAmount = 0;

  for (const transaction of transactions) {
    if (transaction.type === "expense") {
      totalAmount += transaction.amount;
      expenseAmount += transaction.amount;
    } else if (transaction.type === "income") {
      totalAmount -= transaction.amount;
      incomeAmount += transaction.amount;
    }
  }

  return {
    totalAmount: Math.max(0, totalAmount),
    transactionCount: transactions.length,
    expenseAmount,
    incomeAmount,
  };
}

export function generateStatement(
  account: Account,
  statementMonth: string,
  transactions: Transaction[],
  previousBalance = 0,
): Omit<Statement, "id" | "createdAt" | "updatedAt"> {
  if (!account.billing?.closingDay || !account.billing?.dueDay) {
    throw new Error("Account must have billing information");
  }

  const closingDate = calculateClosingDate(
    statementMonth,
    account.billing.closingDay,
  );
  const dueDate = calculateDueDate(
    statementMonth,
    account.billing.closingDay,
    account.billing.dueDay,
  );

  const { totalAmount, transactionCount } =
    calculateStatementTotals(transactions);

  const finalTotal = totalAmount + previousBalance;
  const minimumPayment = calculateMinimumPayment(finalTotal);

  return {
    userId: account.userId,
    accountId: account.id!,
    statementMonth,
    closingDate,
    dueDate,
    status: "open",
    totalAmount: finalTotal,
    paidAmount: 0,
    minimumPayment,
    transactionIds: transactions.map((t) => t.id),
    transactionCount,
    previousBalance: previousBalance > 0 ? previousBalance : undefined,
  };
}

export function isStatementOverdue(statement: Statement): boolean {
  return (
    statement.status !== "paid" &&
    statement.dueDate < Date.now() &&
    statement.totalAmount > statement.paidAmount
  );
}

export function getCurrentStatementMonth(closingDay: number): string {
  const now = new Date();
  return calculateStatementMonth(now, closingDay);
}

export function getPreviousStatementMonth(statementMonth: string): string {
  const year = parseInt(statementMonth.substring(0, 4), 10);
  const month = parseInt(statementMonth.substring(4, 6), 10) - 1;

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;

  const monthStr = String(prevMonth + 1).padStart(2, "0");
  return `${prevYear}${monthStr}`;
}

export function formatStatementMonth(
  statementMonth: string,
  locale = "pt-BR",
): string {
  const year = parseInt(statementMonth.substring(0, 4), 10);
  const month = parseInt(statementMonth.substring(4, 6), 10) - 1;

  const date = new Date(year, month, 1);
  return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
}
