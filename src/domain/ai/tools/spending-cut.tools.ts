import type {
  InsightToolName,
  MoneyAmount,
  ToolDefinition,
} from "./base.types";

export interface GetSpendingCutPlanInput {
  targetSavingsPercent?: number;
  targetSavingsAmount?: number;
  analysisMonths?: number;
  excludeCategoryIds?: string[];
  focusCategoryIds?: string[];
  includeTimeline?: boolean;
}

export type CutPriority = "high" | "medium" | "low";
export type CutRisk = "safe" | "moderate" | "aggressive";
export type TimelinePhase = "immediate" | "30_days" | "60_days" | "90_days";

export interface CategoryCutRecommendation {
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  currentSpending: MoneyAmount;
  recommendedSpending: MoneyAmount;
  potentialSavings: MoneyAmount;
  reductionPercent: number;
  priority: CutPriority;
  risk: CutRisk;
  rationale: string;
  actionItems: string[];
  riskWarning?: string;
  trend: "up" | "down" | "stable";
  isEssential: boolean;
}

export interface TimelineAction {
  phase: TimelinePhase;
  phaseLabel: string;
  actions: Array<{
    description: string;
    categoryName?: string;
    expectedSavings: MoneyAmount;
  }>;
  cumulativeSavings: MoneyAmount;
}

export interface SpendingCutPlanSummary {
  currentTotalSpending: MoneyAmount;
  recommendedTargetSpending: MoneyAmount;
  totalPotentialSavings: MoneyAmount;
  savingsPercent: number;
  categoriesAffected: number;
  overallRisk: CutRisk;
  confidenceScore: number;
}

export interface SpendingCutPlanMetrics {
  monthlyImpact: MoneyAmount;
  quarterlyImpact: MoneyAmount;
  yearlyImpact: MoneyAmount;
  avgSavingsPerCategory: MoneyAmount;
  highestCategorySavings: MoneyAmount;
}

export interface SpendingCutPattern {
  highSpendingCategories: string[];
  increasingCategories: string[];
  reducibleCategories: string[];
  recurringExpenses: Array<{
    description: string;
    amount: MoneyAmount;
    frequency: "monthly" | "weekly" | "yearly";
  }>;
}

export interface GetSpendingCutPlanOutput {
  summary: SpendingCutPlanSummary;
  recommendations: CategoryCutRecommendation[];
  timeline?: TimelineAction[];
  metrics: SpendingCutPlanMetrics;
  patterns: SpendingCutPattern;
  analysisPeriod: {
    startMonth: string;
    endMonth: string;
    monthsAnalyzed: number;
  };
  generalTips: string[];
}

export const SPENDING_CUT_TOOLS_SCHEMAS: ToolDefinition[] = [
  {
    name: "get_spending_cut_plan",
    description:
      "Generate a strategic spending cut plan with prioritized recommendations. Analyzes spending patterns across categories, identifies reduction opportunities, and creates a phased action plan to achieve savings goals. Returns detailed recommendations with risk assessment and expected impact.",
    parameters: {
      type: "object",
      properties: {
        targetSavingsPercent: {
          type: "number",
          description:
            "Target savings as percentage of current spending (5-50%, default: 15%)",
          minimum: 5,
          maximum: 50,
          default: 15,
        },
        targetSavingsAmount: {
          type: "number",
          description:
            "Specific target amount to save in cents (overrides percentage if provided)",
          minimum: 0,
        },
        analysisMonths: {
          type: "number",
          description:
            "Number of months to analyze for spending patterns (1-12, default: 3)",
          minimum: 1,
          maximum: 12,
          default: 3,
        },
        excludeCategoryIds: {
          type: "array",
          description:
            "Category IDs to exclude from cut recommendations (essential expenses)",
          items: {
            type: "string",
            description: "Category ID to exclude",
          },
        },
        focusCategoryIds: {
          type: "array",
          description: "Focus analysis only on these specific category IDs",
          items: {
            type: "string",
            description: "Category ID to focus on",
          },
        },
        includeTimeline: {
          type: "boolean",
          description:
            "Include phased timeline with action items (default: true)",
          default: true,
        },
      },
    },
  },
];

export function isInsightToolName(name: string): name is InsightToolName {
  return ["get_spending_cut_plan"].includes(name);
}
