import type { BaseEntity } from "@/types/common";

export type StatementStatus = "open" | "closed" | "paid";

export interface Statement extends BaseEntity {
  userId: string;
  accountId: string;
  statementMonth: string; // yyyymm format
  closingDate: number; // timestamp
  dueDate: number; // timestamp
  status: StatementStatus;
  totalAmount: number; // in cents
  paidAmount: number; // in cents
  minimumPayment: number; // in cents
  paidDate?: number; // timestamp
  transactionIds: string[];
  transactionCount: number;
  previousBalance?: number; // in cents
  interestAmount?: number; // in cents
  feesAmount?: number; // in cents
  notes?: string;
}

export interface StatementSummary {
  accountId: string;
  accountName: string;
  statementMonth: string;
  closingDate: number; // timestamp
  dueDate: number; // timestamp
  totalAmount: number; // in cents
  status: StatementStatus;
  transactionCount: number;
}
