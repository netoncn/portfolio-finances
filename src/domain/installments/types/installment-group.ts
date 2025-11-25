import type { BaseEntity } from "@/types/common";

export type InstallmentPlan = "no_interest" | "interest" | "revolving";

export interface InstallmentGroup extends BaseEntity {
  userId: string;
  merchant?: string;
  purchaseDate: number; // timestamp in milliseconds
  installmentCount: number;
  originalAmount: number; // in cents
  interestTotal?: number; // in cents
  feesTotal?: number; // in cents
  cardAccountId: string;
  firstDueDate: number; // timestamp in milliseconds
  statementStartMonth?: string; // yyyymm format
  plan?: InstallmentPlan;
  notes?: string;
}
