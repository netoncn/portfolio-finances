import type {
  CategoryToolName,
  DateRangeInput,
  MoneyAmount,
  ToolDefinition,
} from "./base.types";

export interface ListCategoriesInput {
  parentId?: string;
  includeSpending?: boolean;
  onlyWithTransactions?: boolean;
}

export interface GetCategorySpendingInput extends DateRangeInput {
  categoryId: string;
  includeSubcategories?: boolean;
  compareWithPrevious?: boolean;
}

export interface CompareCategoryPeriodsInput {
  categoryId?: string;
  /** First period (YYYY-MM) */
  period1: string;
  /** Second period (YYYY-MM) */
  period2: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  parentId?: string;
  parentName?: string;
  isSystem: boolean;
  spending?: MoneyAmount;
  transactionCount?: number;
  subcategories?: CategoryItem[];
}

export interface ListCategoriesOutput {
  categories: CategoryItem[];
  totalCategories: number;
  withSubcategories: number;
}

export interface CategorySpendingOutput {
  category: {
    id: string;
    name: string;
    icon?: string;
  };
  period: {
    start: string;
    end: string;
    label: string;
  };
  totalSpent: MoneyAmount;
  transactionCount: number;
  avgTransaction: MoneyAmount;
  largestTransaction: {
    id: string;
    description: string;
    amount: MoneyAmount;
    date: string;
  };
  frequentMerchants: Array<{
    name: string;
    count: number;
    totalSpent: MoneyAmount;
  }>;
  subcategoryBreakdown?: Array<{
    categoryId: string;
    categoryName: string;
    spent: MoneyAmount;
    percentage: number;
  }>;
  comparison?: {
    previousPeriod: {
      spent: MoneyAmount;
      transactionCount: number;
    };
    spendingChange: number;
    transactionCountChange: number;
    trend: "up" | "down" | "stable";
  };
}

export interface CompareCategoryPeriodsOutput {
  category?: {
    id: string;
    name: string;
  };
  period1: {
    month: string;
    label: string;
    spent: MoneyAmount;
    transactionCount: number;
    topCategories?: Array<{
      name: string;
      spent: MoneyAmount;
    }>;
  };
  period2: {
    month: string;
    label: string;
    spent: MoneyAmount;
    transactionCount: number;
    topCategories?: Array<{
      name: string;
      spent: MoneyAmount;
    }>;
  };
  comparison: {
    spendingDifference: MoneyAmount;
    percentageChange: number;
    transactionDifference: number;
    insights: string[];
  };
}

export const CATEGORY_TOOLS_SCHEMAS: ToolDefinition[] = [
  {
    name: "list_categories",
    description:
      "List all expense/income categories available. Can include current month spending totals and filter by hierarchy.",
    parameters: {
      type: "object",
      properties: {
        parentId: {
          type: "string",
          description: "Filter to show only subcategories of a parent category",
        },
        includeSpending: {
          type: "boolean",
          description: "Include current month spending totals per category",
        },
        onlyWithTransactions: {
          type: "boolean",
          description: "Only show categories that have transactions",
        },
      },
    },
  },
  {
    name: "get_category_spending",
    description:
      "Get detailed spending analysis for a specific category, including totals, frequent merchants, and optional comparison with previous period.",
    parameters: {
      type: "object",
      properties: {
        categoryId: {
          type: "string",
          description: "Category ID to analyze",
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
        includeSubcategories: {
          type: "boolean",
          description: "Include breakdown by subcategories",
        },
        compareWithPrevious: {
          type: "boolean",
          description: "Compare with the previous equivalent period",
        },
      },
      required: ["categoryId"],
    },
  },
  {
    name: "compare_category_periods",
    description:
      "Compare spending between two months for a specific category or all expenses. Shows differences and trends.",
    parameters: {
      type: "object",
      properties: {
        categoryId: {
          type: "string",
          description: "Category ID to compare (all expenses if not specified)",
        },
        period1: {
          type: "string",
          description: "First period to compare (YYYY-MM format)",
        },
        period2: {
          type: "string",
          description: "Second period to compare (YYYY-MM format)",
        },
      },
      required: ["period1", "period2"],
    },
  },
];

export function isCategoryToolName(name: string): name is CategoryToolName {
  return [
    "list_categories",
    "get_category_spending",
    "compare_category_periods",
  ].includes(name);
}
