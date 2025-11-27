export interface CategorySpending {
  categoryId: string;
  categoryName?: string;
  spent: number;
  transactionCount: number;
}

export interface BudgetVsActual {
  budgetId: string;
  budgetName: string;
  budgetAmount: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
  categoryIds: string[];
  categoryBreakdown: CategorySpending[];
  alertTriggered: boolean;
  alertThreshold?: number;
}

export interface CalculationPeriod {
  startDate: number;
  endDate: number;
  period: "monthly" | "yearly" | "quarterly" | "custom";
  year?: number;
  month?: number;
  quarter?: number;
}

export interface BudgetCalculationSummary {
  period: CalculationPeriod;
  budgets: BudgetVsActual[];
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentageUsed: number;
  budgetsNeedingAttention: number;
  calculatedAt: number;
}

export interface BudgetCalculationOptions {
  includeInactive?: boolean;
  includeCategoryBreakdown?: boolean;
  updateBudgets?: boolean;
  checkAlerts?: boolean;
}
