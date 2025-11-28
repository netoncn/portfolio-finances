import type {
  DateRangeInput,
  InvestmentToolName,
  MoneyAmount,
  ToolDefinition,
} from "./base.types";

export type AssetClass =
  | "stocks"
  | "bonds"
  | "funds"
  | "etf"
  | "reits"
  | "crypto"
  | "cash"
  | "other";

export type EarningType = "dividend" | "interest" | "jcp" | "rental" | "other";

export interface GetInvestmentSummaryInput {
  accountId?: string;
  includePerformance?: boolean;
}

export interface GetPositionsInput {
  accountId?: string;
  assetClass?: AssetClass;
  sortBy?: "value" | "performance" | "weight";
  sortOrder?: "asc" | "desc";
  limit?: number;
}

export interface GetEarningsInput extends DateRangeInput {
  accountId?: string;
  type?: EarningType;
  ticker?: string;
}

export interface GetInvestmentPerformanceInput {
  accountId?: string;
  period?: "1m" | "3m" | "6m" | "1y" | "ytd" | "all";
  benchmark?: "ibov" | "cdi" | "ipca" | "sp500";
}

export interface InvestmentAccountSummary {
  id: string;
  name: string;
  broker?: string;
  totalValue: MoneyAmount;
  totalCost: MoneyAmount;
  totalGainLoss: MoneyAmount;
  percentGainLoss: number;
  positionCount: number;
}

export interface AllocationItem {
  assetClass: AssetClass;
  assetClassLabel: string;
  value: MoneyAmount;
  percentage: number;
  positionCount: number;
}

export interface GetInvestmentSummaryOutput {
  accounts: InvestmentAccountSummary[];
  totals: {
    totalValue: MoneyAmount;
    totalCost: MoneyAmount;
    totalGainLoss: MoneyAmount;
    percentGainLoss: number;
    totalPositions: number;
  };
  allocation: AllocationItem[];
  topPerformers: Array<{
    ticker: string;
    name: string;
    gainLoss: MoneyAmount;
    percentGainLoss: number;
  }>;
  worstPerformers: Array<{
    ticker: string;
    name: string;
    gainLoss: MoneyAmount;
    percentGainLoss: number;
  }>;
  performance?: {
    period: string;
    returnPercent: number;
    benchmarkReturn?: number;
    alpha?: number;
  };
}

export interface PositionItem {
  id: string;
  ticker: string;
  name: string;
  assetClass: AssetClass;
  assetClassLabel: string;
  accountId: string;
  accountName: string;
  quantity: number;
  avgCost: MoneyAmount;
  currentPrice: MoneyAmount;
  totalCost: MoneyAmount;
  currentValue: MoneyAmount;
  gainLoss: MoneyAmount;
  percentGainLoss: number;
  weight: number;
  lastUpdate?: string;
}

export interface GetPositionsOutput {
  positions: PositionItem[];
  summary: {
    totalPositions: number;
    totalValue: MoneyAmount;
    gainersCount: number;
    losersCount: number;
  };
}

export interface EarningItem {
  id: string;
  date: string;
  ticker: string;
  assetName: string;
  type: EarningType;
  typeLabel: string;
  grossAmount: MoneyAmount;
  netAmount: MoneyAmount;
  taxWithheld: MoneyAmount;
  accountName: string;
}

export interface GetEarningsOutput {
  earnings: EarningItem[];
  summary: {
    totalGross: MoneyAmount;
    totalNet: MoneyAmount;
    totalTaxWithheld: MoneyAmount;
    earningsCount: number;
    byType: Array<{
      type: EarningType;
      typeLabel: string;
      totalNet: MoneyAmount;
      count: number;
    }>;
  };
  monthlyBreakdown?: Array<{
    month: string;
    monthLabel: string;
    totalNet: MoneyAmount;
  }>;
}

export interface PerformanceDataPoint {
  date: string;
  portfolioValue: MoneyAmount;
  returnPercent: number;
  benchmarkReturn?: number;
}

export interface GetInvestmentPerformanceOutput {
  period: {
    start: string;
    end: string;
    label: string;
  };
  portfolio: {
    startValue: MoneyAmount;
    endValue: MoneyAmount;
    contributions: MoneyAmount;
    withdrawals: MoneyAmount;
    earnings: MoneyAmount;
    returnPercent: number;
    absoluteReturn: MoneyAmount;
  };
  benchmark?: {
    name: string;
    returnPercent: number;
    alpha: number;
  };
  dataPoints: PerformanceDataPoint[];
  insights: string[];
}

export const INVESTMENT_TOOLS_SCHEMAS: ToolDefinition[] = [
  {
    name: "get_investment_summary",
    description:
      "Get an overview of the investment portfolio including total value, allocation by asset class, and top/worst performers.",
    parameters: {
      type: "object",
      properties: {
        accountId: {
          type: "string",
          description: "Filter by specific investment account",
        },
        includePerformance: {
          type: "boolean",
          description: "Include performance metrics and benchmark comparison",
        },
      },
    },
  },
  {
    name: "get_positions",
    description:
      "Get detailed list of investment positions with current values, cost basis, and performance per asset.",
    parameters: {
      type: "object",
      properties: {
        accountId: {
          type: "string",
          description: "Filter by investment account",
        },
        assetClass: {
          type: "string",
          enum: [
            "stocks",
            "bonds",
            "funds",
            "etf",
            "reits",
            "crypto",
            "cash",
            "other",
          ],
          description: "Filter by asset class",
        },
        sortBy: {
          type: "string",
          enum: ["value", "performance", "weight"],
          description: "Sort positions by field",
        },
        sortOrder: {
          type: "string",
          enum: ["asc", "desc"],
          description: "Sort direction",
        },
        limit: {
          type: "number",
          description: "Maximum positions to return",
          minimum: 1,
          maximum: 100,
        },
      },
    },
  },
  {
    name: "get_earnings",
    description:
      "Get investment earnings (dividends, interest, JCP) for a given period with breakdown by type and asset.",
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
        accountId: {
          type: "string",
          description: "Filter by investment account",
        },
        type: {
          type: "string",
          enum: ["dividend", "interest", "jcp", "rental", "other"],
          description: "Filter by earning type",
        },
        ticker: {
          type: "string",
          description: "Filter by specific ticker/asset",
        },
      },
    },
  },
  {
    name: "get_investment_performance",
    description:
      "Get portfolio performance over time with optional benchmark comparison. Shows returns, contributions, and growth chart data.",
    parameters: {
      type: "object",
      properties: {
        accountId: {
          type: "string",
          description: "Filter by investment account",
        },
        period: {
          type: "string",
          enum: ["1m", "3m", "6m", "1y", "ytd", "all"],
          description: "Performance analysis period",
        },
        benchmark: {
          type: "string",
          enum: ["ibov", "cdi", "ipca", "sp500"],
          description: "Benchmark index to compare against",
        },
      },
    },
  },
];

export function isInvestmentToolName(name: string): name is InvestmentToolName {
  return [
    "get_investment_summary",
    "get_positions",
    "get_earnings",
    "get_investment_performance",
  ].includes(name);
}
