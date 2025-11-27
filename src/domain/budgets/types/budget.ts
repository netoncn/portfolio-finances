import type { BaseEntity } from "@/types/common";

export type BudgetPeriod = "monthly" | "yearly" | "quarterly" | "custom";

export type BudgetStatus = "active" | "inactive" | "completed";

export interface Budget extends BaseEntity {
  name: string;
  amount: number;
  period: BudgetPeriod;
  categoryIds: string[];
  startDate: number; // timestamp
  endDate?: number; // timestamp
  spent: number; // in cents
  alertThreshold?: number; // 0-1
  status: BudgetStatus;
  icon?: string;
  color?: string;
  notes?: string;
  rollover?: boolean;
  lastCalculatedAt?: number;
}

export interface BudgetSummary {
  budgetId: string;
  budgetName: string;
  amount: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
  daysRemaining?: number;
  categoryIds: string[];
}
