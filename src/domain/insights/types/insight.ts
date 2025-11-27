import type { BaseEntity } from "@/types/common";

export type InsightType =
  | "spending_spike" // Gasto anormalmente alto
  | "spending_decrease" // Redução de gastos
  | "category_trend" // Tendência em categoria específica
  | "budget_warning" // Alerta de orçamento
  | "savings_opportunity" // Oportunidade de economia
  | "recurring_pattern" // Padrão recorrente identificado
  | "anomaly" // Anomalia detectada
  | "achievement"; // Meta atingida

export type InsightSeverity = "info" | "warning" | "alert" | "success";

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  currentMonth: number;
  previousMonth: number;
  variation: number; // Percentage
  variationAmount: number;
  transactionCount: number;
  averageTransaction: number;
}

export interface SpendingVariation {
  month: string;
  total: number;
  byCategory: Record<string, number>;
}

export interface TopSpending {
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  amount: number;
  percentage: number; // Percentage of total spending
  transactionCount: number;
  trend: "up" | "down" | "stable";
}

export interface MonthlyInsights {
  userId: string;
  month: string; // YYYY-MM format
  period: {
    start: number;
    end: number;
  };

  summary: {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    transactionCount: number;
    savingsRate: number; // Percentage
  };

  topSpending: TopSpending[];

  categoryBreakdown: CategorySpending[];

  variations: {
    vsLastMonth: {
      total: number;
      percentage: number;
      byCategory: Record<string, number>;
    };
    vsAverage: {
      total: number;
      percentage: number;
    };
  };

  insights: Insight[];

  alerts: Alert[];

  generatedAt: number;
}

export interface Insight extends BaseEntity {
  userId: string;
  month: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  data?: Record<string, unknown>; // Additional data for the insight
  actionable: boolean;
  actionText?: string;
  dismissed: boolean;
  dismissedAt?: number;
}

export interface Alert extends BaseEntity {
  userId: string;
  month: string;
  type:
    | "budget_exceeded"
    | "unusual_spending"
    | "large_transaction"
    | "goal_risk";
  severity: InsightSeverity;
  title: string;
  message: string;
  categoryId?: string;
  budgetId?: string;
  transactionId?: string;
  threshold?: number;
  currentValue?: number;
  acknowledged: boolean;
  acknowledgedAt?: number;
}

export interface InsightGenerationRequest {
  userId: string;
  month: string;
  includeAI?: boolean;
  forceRegenerate?: boolean;
}

export interface AIInsightContext {
  currentMonth: {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    savingsRate: number;
  };
  previousMonth?: {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
  };
  topCategories: Array<{
    name: string;
    amount: number;
    percentage: number;
  }>;
  significantChanges: Array<{
    category: string;
    change: number;
    changePercentage: number;
  }>;
  budgets?: Array<{
    category: string;
    spent: number;
    limit: number;
    percentage: number;
  }>;
}
