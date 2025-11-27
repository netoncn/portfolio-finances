import type { BudgetPeriod, BudgetStatus } from "../types/budget";

export interface CreateBudgetDTO {
  userId: string;
  name: string;
  amount: number;
  period: BudgetPeriod;
  categoryIds: string[];
  startDate: number;
  endDate?: number;
  alertThreshold?: number;
  status?: BudgetStatus;
  icon?: string;
  color?: string;
  notes?: string;
  rollover?: boolean;
}

export interface UpdateBudgetDTO {
  id: string;
  userId: string;
  name?: string;
  amount?: number;
  period?: BudgetPeriod;
  categoryIds?: string[];
  startDate?: number;
  endDate?: number;
  alertThreshold?: number;
  status?: BudgetStatus;
  icon?: string;
  color?: string;
  notes?: string;
  rollover?: boolean;
}

export interface UpdateBudgetSpentDTO {
  id: string;
  userId: string;
  spent: number;
  lastCalculatedAt: number;
}
