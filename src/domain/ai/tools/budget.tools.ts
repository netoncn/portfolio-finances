import type { BudgetToolName, MoneyAmount, ToolDefinition } from "./base.types";

export interface GetBudgetStatusInput {
  budgetId?: string;
  /** Period to analyze (YYYY-MM format, defaults to current month) */
  month?: string;
  includeHistory?: boolean;
}

export interface GetBudgetAlertsInput {
  /** Minimum threshold percentage to include (default: 80) */
  thresholdPercent?: number;
  includeOnTrack?: boolean;
}

export interface GetBudgetRecommendationsInput {
  categoryId?: string;
  limit?: number;
}

export type BudgetAlertLevel =
  | "exceeded"
  | "warning"
  | "on_track"
  | "under_budget";

export interface BudgetStatusItem {
  budgetId: string;
  name: string;
  period: "monthly" | "yearly" | "custom";
  categories: Array<{
    categoryId: string;
    categoryName: string;
  }>;
  limit: MoneyAmount;
  spent: MoneyAmount;
  remaining: MoneyAmount;
  percentUsed: number;
  alertLevel: BudgetAlertLevel;
  daysRemaining: number;
  projectedTotal?: MoneyAmount;
  projectedAlertLevel?: BudgetAlertLevel;
  history?: Array<{
    month: string;
    spent: MoneyAmount;
    limit: MoneyAmount;
    percentUsed: number;
  }>;
}

export interface GetBudgetStatusOutput {
  month: string;
  budgets: BudgetStatusItem[];
  summary: {
    totalBudgets: number;
    exceededCount: number;
    warningCount: number;
    onTrackCount: number;
    totalLimit: MoneyAmount;
    totalSpent: MoneyAmount;
    overallPercentUsed: number;
  };
}

export interface BudgetAlert {
  budgetId: string;
  budgetName: string;
  alertLevel: BudgetAlertLevel;
  message: string;
  spent: MoneyAmount;
  limit: MoneyAmount;
  percentUsed: number;
  amountOver?: MoneyAmount;
  projectedOver?: MoneyAmount;
  suggestedAction?: string;
}

export interface GetBudgetAlertsOutput {
  alerts: BudgetAlert[];
  summary: {
    criticalCount: number;
    warningCount: number;
    totalAlerts: number;
  };
}

export interface BudgetRecommendation {
  type:
    | "increase_budget"
    | "decrease_spending"
    | "create_budget"
    | "adjust_categories";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  impact?: {
    currentSpending: MoneyAmount;
    suggestedLimit: MoneyAmount;
    potentialSavings: MoneyAmount;
  };
  affectedCategories?: string[];
}

export interface GetBudgetRecommendationsOutput {
  recommendations: BudgetRecommendation[];
  insights: {
    topOverspendingCategories: Array<{
      categoryName: string;
      overspentBy: MoneyAmount;
      percentOver: number;
    }>;
    savingsOpportunities: MoneyAmount;
  };
}

export const BUDGET_TOOLS_SCHEMAS: ToolDefinition[] = [
  {
    name: "get_budget_status",
    description:
      "Get the current status of all budgets or a specific budget. Shows spending vs limits, percentage used, and projections.",
    parameters: {
      type: "object",
      properties: {
        budgetId: {
          type: "string",
          description: "Filter by specific budget ID",
        },
        month: {
          type: "string",
          description:
            "Period to analyze (YYYY-MM format, defaults to current month)",
        },
        includeHistory: {
          type: "boolean",
          description: "Include spending history for the past 3 months",
        },
      },
    },
  },
  {
    name: "get_budget_alerts",
    description:
      "Get alerts for budgets that are exceeded, close to limit, or have concerning spending patterns. Prioritized by severity.",
    parameters: {
      type: "object",
      properties: {
        thresholdPercent: {
          type: "number",
          description:
            "Minimum percentage threshold to trigger alert (default: 80)",
          minimum: 0,
          maximum: 100,
        },
        includeOnTrack: {
          type: "boolean",
          description: "Include budgets that are on track (under threshold)",
        },
      },
    },
  },
  {
    name: "get_budget_recommendations",
    description:
      "Get personalized recommendations for budget adjustments based on spending patterns. Suggests new budgets, limit changes, or category adjustments.",
    parameters: {
      type: "object",
      properties: {
        categoryId: {
          type: "string",
          description: "Focus recommendations on a specific category",
        },
        limit: {
          type: "number",
          description: "Number of recommendations to return (default: 5)",
          minimum: 1,
          maximum: 10,
        },
      },
    },
  },
];

export function isBudgetToolName(name: string): name is BudgetToolName {
  return [
    "get_budget_status",
    "get_budget_alerts",
    "get_budget_recommendations",
  ].includes(name);
}
