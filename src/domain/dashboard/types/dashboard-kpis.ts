export interface BudgetOverview {
  totalBudgets: number;
  activeBudgets: number;
  totalBudgeted: number; // in cents
  totalSpent: number; // in cents
  percentageUsed: number; // 0-100
  overBudgetCount: number;
  nearLimitCount: number; // budgets over 80%
}

export interface UpcomingInstallment {
  transactionId: string;
  description: string;
  amount: number; // in cents
  dueDate: number; // timestamp
  installmentNumber: number;
  totalInstallments: number;
  categoryId?: string;
  categoryName?: string;
  categoryIcon?: string;
  accountId?: string;
  accountName?: string;
  isPaid: boolean;
  isOverdue: boolean;
}

export interface CategoryChartData {
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  amount: number; // in cents
  percentage: number; // 0-100
  color: string;
}

export interface TrendDataPoint {
  month: string; // "Jan", "Feb", etc.
  monthYear: string; // "2025-01" for sorting
  income: number; // in cents
  expense: number; // in cents
  balance: number; // in cents
}

export interface DashboardKPIs {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  budgetOverview: BudgetOverview;
  upcomingInstallments: UpcomingInstallment[];
  categoryChart: CategoryChartData[];
  trendChart: TrendDataPoint[];
  periodStart: number;
  periodEnd: number;
}
