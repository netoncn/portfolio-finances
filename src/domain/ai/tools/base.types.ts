export interface ToolParameter {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  enum?: string[];
  items?: ToolParameter;
  properties?: Record<string, ToolParameter>;
  minimum?: number;
  maximum?: number;
  default?: unknown;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, ToolParameter>;
    required?: string[];
  };
}

export type ToolResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface ToolExecutionContext {
  userId: string;
  locale?: string;
  month?: string; // YYYY-MM format for time-scoped queries
}

export type ToolCategory =
  | "transactions"
  | "categories"
  | "budgets"
  | "accounts"
  | "investments"
  | "points"
  | "goals"
  | "insights";

export type TransactionToolName =
  | "get_transactions_summary"
  | "search_transactions"
  | "get_spending_by_category"
  | "get_spending_trend"
  | "get_largest_expenses";

export type BudgetToolName =
  | "get_budget_status"
  | "get_budget_alerts"
  | "get_budget_recommendations";

export type CategoryToolName =
  | "list_categories"
  | "get_category_spending"
  | "compare_category_periods";

export type AccountToolName =
  | "get_accounts_summary"
  | "get_account_balance"
  | "get_credit_card_info";

export type InvestmentToolName =
  | "get_investment_summary"
  | "get_positions"
  | "get_earnings"
  | "get_investment_performance";

export type GoalToolName = "get_goals_progress" | "get_goal_details";

export type PointsToolName =
  | "get_points_summary"
  | "get_points_by_program"
  | "get_expiring_points"
  | "calculate_points_value"
  | "compare_points_vs_cash"
  | "get_best_offers"
  | "get_points_history";

export type InsightToolName = "get_spending_cut_plan";

export type AllToolName =
  | TransactionToolName
  | BudgetToolName
  | CategoryToolName
  | AccountToolName
  | InvestmentToolName
  | GoalToolName
  | PointsToolName
  | InsightToolName;

export const TRANSACTION_TYPES = ["income", "expense", "transfer"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const PERIOD_OPTIONS = ["daily", "weekly", "monthly", "yearly"] as const;
export type PeriodOption = (typeof PERIOD_OPTIONS)[number];

export const ACCOUNT_TYPES = [
  "checking",
  "savings",
  "credit_card",
  "investment",
  "cash",
  "other",
] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export interface DateRangeInput {
  /** Start date in ISO format or relative (e.g., "30d" for 30 days ago) */
  startDate?: string;
  /** End date in ISO format (defaults to today) */
  endDate?: string;
  period?:
    | "this_month"
    | "last_month"
    | "last_30_days"
    | "last_90_days"
    | "this_year";
}

export interface PaginationInput {
  limit?: number;
  offset?: number;
}

export interface MoneyAmount {
  value: number;
  currency: string;
  formatted: string;
}

export function formatMoney(
  centavos: number,
  currency = "BRL",
  locale = "pt-BR",
): MoneyAmount {
  const value = centavos / 100;
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value);

  return { value: centavos, currency, formatted };
}
