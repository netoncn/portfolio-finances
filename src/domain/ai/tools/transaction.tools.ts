import type {
  DateRangeInput,
  MoneyAmount,
  PaginationInput,
  ToolDefinition,
  TransactionToolName,
  TransactionType,
} from "./base.types";

export interface GetTransactionsSummaryInput extends DateRangeInput {
  type?: TransactionType;
  accountId?: string;
}

export interface SearchTransactionsInput
  extends DateRangeInput,
    PaginationInput {
  query?: string;
  type?: TransactionType;
  categoryId?: string;
  accountId?: string;
  minAmount?: number; // in cents
  maxAmount?: number; // in cents
  sortBy?: "date" | "amount";
  sortOrder?: "asc" | "desc";
}

export interface GetSpendingByCategoryInput extends DateRangeInput {
  limit?: number;
  includeSubcategories?: boolean;
}

export interface GetSpendingTrendInput {
  categoryId?: string;
  periods?: number;
  granularity?: "daily" | "weekly" | "monthly";
}

export interface GetLargestExpensesInput
  extends DateRangeInput,
    PaginationInput {
  categoryId?: string;
  minAmount?: number; // in cents
}

export interface TransactionsSummaryOutput {
  period: {
    start: string;
    end: string;
    label: string;
  };
  income: MoneyAmount;
  expenses: MoneyAmount;
  netBalance: MoneyAmount;
  transactionCount: number;
  avgTransactionSize: MoneyAmount;
  savingsRate: number;
  comparison?: {
    previousPeriod: {
      income: MoneyAmount;
      expenses: MoneyAmount;
      netBalance: MoneyAmount;
    };
    incomeChange: number;
    expensesChange: number;
    balanceChange: number;
  };
}

export interface TransactionSearchResult {
  id: string;
  date: string;
  description: string;
  merchant?: string;
  amount: MoneyAmount;
  type: TransactionType;
  categoryName?: string;
  accountName?: string;
  tags?: string[];
}

export interface SearchTransactionsOutput {
  transactions: TransactionSearchResult[];
  totalCount: number;
  hasMore: boolean;
  summary: {
    totalAmount: MoneyAmount;
    avgAmount: MoneyAmount;
  };
}

export interface CategorySpendingItem {
  categoryId: string;
  categoryName: string;
  amount: MoneyAmount;
  percentage: number;
  transactionCount: number;
  avgTransaction: MoneyAmount;
  subcategories?: Array<{
    categoryId: string;
    categoryName: string;
    amount: MoneyAmount;
    percentage: number;
  }>;
}

export interface GetSpendingByCategoryOutput {
  period: {
    start: string;
    end: string;
    label: string;
  };
  totalExpenses: MoneyAmount;
  categories: CategorySpendingItem[];
  uncategorized: MoneyAmount;
}

export interface TrendDataPoint {
  period: string;
  periodLabel: string;
  amount: MoneyAmount;
  transactionCount: number;
}

export interface GetSpendingTrendOutput {
  categoryId?: string;
  categoryName?: string;
  granularity: "daily" | "weekly" | "monthly";
  dataPoints: TrendDataPoint[];
  trend: {
    direction: "up" | "down" | "stable";
    percentageChange: number;
    avgAmount: MoneyAmount;
  };
}

export interface LargeExpenseItem {
  id: string;
  date: string;
  description: string;
  merchant?: string;
  amount: MoneyAmount;
  categoryName?: string;
  accountName?: string;
}

export interface GetLargestExpensesOutput {
  expenses: LargeExpenseItem[];
  totalAmount: MoneyAmount;
  percentageOfTotal: number;
}

export const TRANSACTION_TOOLS_SCHEMAS: ToolDefinition[] = [
  {
    name: "get_transactions_summary",
    description:
      "Get a summary of transactions for a given period, including total income, expenses, net balance, and savings rate. Optionally compare with the previous period.",
    parameters: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: [
            "this_month",
            "last_month",
            "last_30_days",
            "last_90_days",
            "this_year",
          ],
          description: "Quick period selection",
        },
        startDate: {
          type: "string",
          description: "Start date in ISO format (YYYY-MM-DD)",
        },
        endDate: {
          type: "string",
          description: "End date in ISO format (YYYY-MM-DD)",
        },
        type: {
          type: "string",
          enum: ["income", "expense", "transfer"],
          description: "Filter by transaction type",
        },
        accountId: {
          type: "string",
          description: "Filter by specific account",
        },
      },
    },
  },
  {
    name: "search_transactions",
    description:
      "Search for transactions by keyword, amount range, category, or account. Returns matching transactions with pagination support.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (matches description, merchant, notes)",
        },
        period: {
          type: "string",
          enum: [
            "this_month",
            "last_month",
            "last_30_days",
            "last_90_days",
            "this_year",
          ],
          description: "Quick period selection",
        },
        startDate: {
          type: "string",
          description: "Start date in ISO format",
        },
        endDate: {
          type: "string",
          description: "End date in ISO format",
        },
        type: {
          type: "string",
          enum: ["income", "expense", "transfer"],
          description: "Filter by transaction type",
        },
        categoryId: {
          type: "string",
          description: "Filter by category ID",
        },
        accountId: {
          type: "string",
          description: "Filter by account ID",
        },
        minAmount: {
          type: "number",
          description: "Minimum amount in centavos",
          minimum: 0,
        },
        maxAmount: {
          type: "number",
          description: "Maximum amount in centavos",
          minimum: 0,
        },
        sortBy: {
          type: "string",
          enum: ["date", "amount"],
          description: "Sort field",
        },
        sortOrder: {
          type: "string",
          enum: ["asc", "desc"],
          description: "Sort direction",
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default: 20)",
          minimum: 1,
          maximum: 100,
        },
        offset: {
          type: "number",
          description: "Number of results to skip",
          minimum: 0,
        },
      },
    },
  },
  {
    name: "get_spending_by_category",
    description:
      "Get a breakdown of expenses by category for a given period. Shows amount, percentage, and transaction count per category.",
    parameters: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: [
            "this_month",
            "last_month",
            "last_30_days",
            "last_90_days",
            "this_year",
          ],
          description: "Quick period selection",
        },
        startDate: {
          type: "string",
          description: "Start date in ISO format",
        },
        endDate: {
          type: "string",
          description: "End date in ISO format",
        },
        limit: {
          type: "number",
          description: "Maximum number of categories to return",
          minimum: 1,
          maximum: 50,
        },
        includeSubcategories: {
          type: "boolean",
          description: "Include subcategory breakdown within each category",
        },
      },
    },
  },
  {
    name: "get_spending_trend",
    description:
      "Analyze spending trends over time. Shows how spending has changed across multiple periods for a specific category or all expenses.",
    parameters: {
      type: "object",
      properties: {
        categoryId: {
          type: "string",
          description: "Category ID to track (all expenses if not specified)",
        },
        periods: {
          type: "number",
          description: "Number of periods to analyze (default: 6)",
          minimum: 2,
          maximum: 12,
        },
        granularity: {
          type: "string",
          enum: ["daily", "weekly", "monthly"],
          description: "Time granularity for the trend analysis",
        },
      },
    },
  },
  {
    name: "get_largest_expenses",
    description:
      "Get the largest individual expense transactions for a given period. Useful for identifying big purchases or unusual spending.",
    parameters: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: [
            "this_month",
            "last_month",
            "last_30_days",
            "last_90_days",
            "this_year",
          ],
          description: "Quick period selection",
        },
        startDate: {
          type: "string",
          description: "Start date in ISO format",
        },
        endDate: {
          type: "string",
          description: "End date in ISO format",
        },
        categoryId: {
          type: "string",
          description: "Filter by specific category",
        },
        minAmount: {
          type: "number",
          description: "Minimum amount threshold in centavos",
          minimum: 0,
        },
        limit: {
          type: "number",
          description: "Number of transactions to return (default: 10)",
          minimum: 1,
          maximum: 50,
        },
      },
    },
  },
];

export function isTransactionToolName(
  name: string,
): name is TransactionToolName {
  return [
    "get_transactions_summary",
    "search_transactions",
    "get_spending_by_category",
    "get_spending_trend",
    "get_largest_expenses",
  ].includes(name);
}
