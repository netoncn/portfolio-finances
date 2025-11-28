export type AggregationPeriod = "daily" | "weekly" | "monthly" | "quarterly";

export interface DateRange {
  start: number; // timestamp
  end: number; // timestamp
  label: string;
}

export interface MonthlyAggregate {
  month: string; // YYYY-MM
  income: number;
  expenses: number;
  netBalance: number;
  savingsRate: number;
  transactionCount: number;
}

export interface CategoryAggregate {
  categoryId: string;
  categoryName: string;
  totalSpent: number;
  transactionCount: number;
  avgTransaction: number;
  percentOfTotal: number;
  trend: "up" | "down" | "stable";
  trendPercent: number;
}

export interface MerchantAggregate {
  merchant: string;
  totalSpent: number;
  transactionCount: number;
  avgTransaction: number;
  categoryName?: string;
  lastTransaction: number; // timestamp
}

export interface SpendingPattern {
  dayOfWeek: Record<number, number>; // 0-6 -> amount
  timeOfMonth: {
    firstWeek: number;
    secondWeek: number;
    thirdWeek: number;
    fourthWeek: number;
  };
  recurringExpenses: Array<{
    description: string;
    amount: number;
    frequency: "weekly" | "monthly" | "yearly";
    nextExpected: number; // timestamp
  }>;
}

export interface BudgetContext {
  budgetId: string;
  name: string;
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: "on_track" | "warning" | "exceeded";
  daysRemaining: number;
  projectedTotal: number;
  categories: string[];
  historicalAvg: number; // avg spending in this budget category
}

export interface GoalContext {
  goalId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  progressPercent: number;
  status: "on_track" | "behind" | "ahead" | "completed";
  deadline?: string;
  daysRemaining?: number;
  monthlyTarget: number;
  currentMonthlyAvg: number;
}

export interface AccountContext {
  accountId: string;
  name: string;
  type: string;
  typeLabel: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  transactionCount: number;
  // Credit card specific
  creditLimit?: number;
  currentBalance?: number;
  availableCredit?: number;
  utilizationPercent?: number;
}

export interface FinancialInsight {
  type: "trend" | "anomaly" | "opportunity" | "warning" | "achievement";
  priority: "high" | "medium" | "low";
  category: string;
  title: string;
  description: string;
  data?: Record<string, unknown>;
}

export interface SpendingAlert {
  type:
    | "budget_exceeded"
    | "unusual_spending"
    | "large_transaction"
    | "recurring_due";
  severity: "critical" | "warning" | "info";
  message: string;
  amount?: number;
  categoryName?: string;
  date?: string;
}

export interface RAGFinancialContext {
  // Metadata
  userId: string;
  generatedAt: number;
  dataRange: DateRange;

  // Current period summary
  currentPeriod: {
    month: string;
    income: number;
    expenses: number;
    netBalance: number;
    savingsRate: number;
    transactionCount: number;
  };

  // Historical context (last 3 months)
  historicalSummary: {
    avgMonthlyIncome: number;
    avgMonthlyExpenses: number;
    avgSavingsRate: number;
    incomeStability: "stable" | "variable" | "growing" | "declining";
    expensesTrend: "increasing" | "decreasing" | "stable";
    monthlyData: MonthlyAggregate[];
  };

  // Category analysis
  topCategories: CategoryAggregate[];
  categoryTrends: Array<{
    categoryName: string;
    currentMonth: number;
    previousMonth: number;
    change: number;
    changePercent: number;
  }>;

  // Merchant patterns
  topMerchants: MerchantAggregate[];
  frequentTransactions: Array<{
    description: string;
    amount: number;
    frequency: number; // times in period
    categoryName?: string;
  }>;

  // Budgets
  budgets: BudgetContext[];
  budgetSummary: {
    totalBudgeted: number;
    totalSpent: number;
    overallStatus: "on_track" | "warning" | "exceeded";
    exceededCount: number;
    warningCount: number;
  };

  // Goals
  goals: GoalContext[];
  goalsSummary: {
    totalTargetAmount: number;
    totalSavedAmount: number;
    overallProgress: number;
    onTrackCount: number;
    behindCount: number;
  };

  // Accounts
  accounts: AccountContext[];
  accountsSummary: {
    totalAccounts: number;
    totalCreditLimit: number;
    totalCreditUsed: number;
    avgUtilization: number;
  };

  // Insights & Alerts
  insights: FinancialInsight[];
  alerts: SpendingAlert[];

  // Points/Miles (if available)
  pointsContext?: string;
}

export interface RAGQuery {
  userId: string;
  question: string;
  focusAreas?: Array<
    | "spending"
    | "income"
    | "budgets"
    | "goals"
    | "accounts"
    | "trends"
    | "points"
  >;
  timeRange?: "current_month" | "last_month" | "last_90_days" | "this_year";
}

export interface RAGSearchResult {
  relevantContext: Partial<RAGFinancialContext>;
  suggestions: string[];
  relatedQuestions: string[];
}

export const RAGCacheKeys = {
  fullContext: (userId: string): string => `rag:context:${userId}`,
  monthlyAggregate: (userId: string, month: string): string =>
    `rag:monthly:${userId}:${month}`,
  categoryAggregates: (userId: string): string => `rag:categories:${userId}`,
  merchantAggregates: (userId: string): string => `rag:merchants:${userId}`,
  insights: (userId: string): string => `rag:insights:${userId}`,
  userPattern: (userId: string): string => `rag:${userId}:`,
};

export const RAGCacheTTL = {
  fullContext: 10 * 60 * 1000, // 10 minutes
  monthlyAggregate: 30 * 60 * 1000, // 30 minutes
  categoryAggregates: 15 * 60 * 1000, // 15 minutes
  merchantAggregates: 15 * 60 * 1000, // 15 minutes
  insights: 5 * 60 * 1000, // 5 minutes
};
