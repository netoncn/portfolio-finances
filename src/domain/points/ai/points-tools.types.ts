import type { PointsProgramName } from "../types/points";

export type PointsToolName =
  | "get_points_summary"
  | "get_points_by_program"
  | "get_expiring_points"
  | "calculate_points_value"
  | "compare_points_vs_cash"
  | "get_best_offers"
  | "get_points_history";

export type GetPointsSummaryInput = Record<string, never>;

export interface GetPointsByProgramInput {
  program?: PointsProgramName;
  status?: "active" | "redeemed" | "expired";
}

export interface GetExpiringPointsInput {
  daysAhead?: number;
  program?: PointsProgramName;
}

export interface CalculatePointsValueInput {
  program: PointsProgramName;
  points: number;
  method?: "min" | "avg" | "max";
}

export interface ComparePointsVsCashInput {
  program: PointsProgramName;
  pointsRequired: number;
  cashPrice: number;
}

export interface GetBestOffersInput {
  program?: PointsProgramName;
  minBonus?: number;
  limit?: number;
}

export interface GetPointsHistoryInput {
  program?: PointsProgramName;
  type?: "earn" | "redeem" | "transfer_in" | "transfer_out" | "adjust";
  daysBack?: number;
  limit?: number;
}

export interface PointsSummaryOutput {
  totalPrograms: number;
  totalActivePoints: number;
  totalEstimatedValue: number;
  expiringIn30Days: number;
  expiringIn30DaysValue: number;
  programBreakdown: Array<{
    program: PointsProgramName;
    programName: string;
    points: number;
    estimatedValue: number;
    expiringPoints: number;
  }>;
}

export interface PointsByProgramOutput {
  program: PointsProgramName;
  programName: string;
  memberId?: string;
  totalPoints: number;
  activePoints: number;
  redeemedPoints: number;
  expiredPoints: number;
  estimatedValue: number;
  balances: Array<{
    id: string;
    points: number;
    earnedAt: string;
    expiresAt: string;
    status: "active" | "redeemed" | "expired";
    source?: string;
  }>;
}

export interface ExpiringPointsOutput {
  totalExpiring: number;
  totalEstimatedValue: number;
  urgencyBreakdown: {
    critical: number; // < 7 days
    high: number; // 7-30 days
    medium: number; // 30-60 days
  };
  expiringBalances: Array<{
    id: string;
    program: PointsProgramName;
    programName: string;
    points: number;
    estimatedValue: number;
    expiresAt: string;
    daysUntilExpiration: number;
    urgency: "critical" | "high" | "medium";
  }>;
}

export interface PointsValueOutput {
  program: PointsProgramName;
  programName: string;
  points: number;
  method: "min" | "avg" | "max";
  valuePerPoint: number;
  totalValue: number;
  currency: string;
  disclaimer: string;
}

export interface PointsVsCashOutput {
  recommendation: "use_points" | "pay_cash";
  confidence: "high" | "medium" | "low";
  reason: string;
  analysis: {
    program: PointsProgramName;
    programName: string;
    pointsRequired: number;
    cashPrice: number;
    pointsValue: {
      min: number;
      avg: number;
      max: number;
    };
    effectiveValuePerPoint: number;
    avgValuePerPoint: number;
    savingsOrLoss: number;
    percentageGainLoss: number;
    isGoodValue: boolean;
  };
}

export interface BestOffersOutput {
  offers: Array<{
    id: string;
    program: PointsProgramName;
    programName: string;
    title: string;
    description: string;
    bonus: number;
    validUntil: string;
    daysRemaining: number;
    termsUrl?: string;
  }>;
  totalOffers: number;
}

export interface PointsHistoryOutput {
  operations: Array<{
    id: string;
    program: PointsProgramName;
    programName: string;
    date: string;
    type: "earn" | "redeem" | "transfer_in" | "transfer_out" | "adjust";
    typeLabel: string;
    pointsDelta: number;
    partner?: string;
    notes?: string;
  }>;
  summary: {
    totalEarned: number;
    totalSpent: number;
    netChange: number;
    operationCount: number;
  };
}

export interface PointsToolDefinition {
  name: PointsToolName;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const POINTS_TOOLS_SCHEMAS: PointsToolDefinition[] = [
  {
    name: "get_points_summary",
    description:
      "Get an overall summary of the user's points across all loyalty programs. Returns total points, estimated value, and breakdown by program.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_points_by_program",
    description:
      "Get detailed information about points in a specific loyalty program, including balances, status, and expiration dates.",
    parameters: {
      type: "object",
      properties: {
        program: {
          type: "string",
          enum: [
            "livelo",
            "esfera",
            "iupp",
            "smiles",
            "latam_pass",
            "tudoazul",
            "ame",
            "meli",
            "outro",
          ],
          description: "The loyalty program to query",
        },
        status: {
          type: "string",
          enum: ["active", "redeemed", "expired"],
          description: "Filter balances by status",
        },
      },
    },
  },
  {
    name: "get_expiring_points",
    description:
      "Get points that are expiring soon, with urgency levels. Helps identify points that should be used before expiration.",
    parameters: {
      type: "object",
      properties: {
        daysAhead: {
          type: "number",
          description: "Number of days to look ahead (default: 30)",
          minimum: 1,
          maximum: 365,
        },
        program: {
          type: "string",
          enum: [
            "livelo",
            "esfera",
            "iupp",
            "smiles",
            "latam_pass",
            "tudoazul",
            "ame",
            "meli",
            "outro",
          ],
          description: "Filter by specific program",
        },
      },
    },
  },
  {
    name: "calculate_points_value",
    description:
      "Calculate the estimated monetary value of a given number of points in a specific program.",
    parameters: {
      type: "object",
      properties: {
        program: {
          type: "string",
          enum: [
            "livelo",
            "esfera",
            "iupp",
            "smiles",
            "latam_pass",
            "tudoazul",
            "ame",
            "meli",
            "outro",
          ],
          description: "The loyalty program",
        },
        points: {
          type: "number",
          description: "Number of points to calculate value for",
          minimum: 1,
        },
        method: {
          type: "string",
          enum: ["min", "avg", "max"],
          description:
            "Valuation method: min (worst redemption), avg (typical), max (best redemption)",
        },
      },
      required: ["program", "points"],
    },
  },
  {
    name: "compare_points_vs_cash",
    description:
      "Compare whether it's better to use points or pay cash for a specific redemption. Provides a recommendation with confidence level.",
    parameters: {
      type: "object",
      properties: {
        program: {
          type: "string",
          enum: [
            "livelo",
            "esfera",
            "iupp",
            "smiles",
            "latam_pass",
            "tudoazul",
            "ame",
            "meli",
            "outro",
          ],
          description: "The loyalty program",
        },
        pointsRequired: {
          type: "number",
          description: "Number of points required for the redemption",
          minimum: 1,
        },
        cashPrice: {
          type: "number",
          description: "Cash price in BRL (centavos) for the same item",
          minimum: 1,
        },
      },
      required: ["program", "pointsRequired", "cashPrice"],
    },
  },
  {
    name: "get_best_offers",
    description:
      "Get the best current bonus offers and promotions from loyalty programs.",
    parameters: {
      type: "object",
      properties: {
        program: {
          type: "string",
          enum: [
            "livelo",
            "esfera",
            "iupp",
            "smiles",
            "latam_pass",
            "tudoazul",
            "ame",
            "meli",
            "outro",
          ],
          description: "Filter by specific program",
        },
        minBonus: {
          type: "number",
          description: "Minimum bonus percentage to include",
          minimum: 0,
        },
        limit: {
          type: "number",
          description: "Maximum number of offers to return",
          minimum: 1,
          maximum: 20,
        },
      },
    },
  },
  {
    name: "get_points_history",
    description:
      "Get the history of points operations (earn, redeem, transfer, etc.) with summary statistics.",
    parameters: {
      type: "object",
      properties: {
        program: {
          type: "string",
          enum: [
            "livelo",
            "esfera",
            "iupp",
            "smiles",
            "latam_pass",
            "tudoazul",
            "ame",
            "meli",
            "outro",
          ],
          description: "Filter by specific program",
        },
        type: {
          type: "string",
          enum: ["earn", "redeem", "transfer_in", "transfer_out", "adjust"],
          description: "Filter by operation type",
        },
        daysBack: {
          type: "number",
          description: "Number of days to look back (default: 30)",
          minimum: 1,
          maximum: 365,
        },
        limit: {
          type: "number",
          description: "Maximum number of operations to return",
          minimum: 1,
          maximum: 100,
        },
      },
    },
  },
];

export function isValidPointsToolName(name: string): name is PointsToolName {
  return [
    "get_points_summary",
    "get_points_by_program",
    "get_expiring_points",
    "calculate_points_value",
    "compare_points_vs_cash",
    "get_best_offers",
    "get_points_history",
  ].includes(name);
}
