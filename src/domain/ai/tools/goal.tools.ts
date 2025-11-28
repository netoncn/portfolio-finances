import type { GoalToolName, MoneyAmount, ToolDefinition } from "./base.types";

export interface GetGoalsProgressInput {
  status?: "active" | "completed" | "cancelled";
  sortBy?: "progress" | "deadline" | "amount";
}

export interface GetGoalDetailsInput {
  goalId: string;
  includeHistory?: boolean;
}

export type GoalStatus =
  | "on_track"
  | "behind"
  | "ahead"
  | "completed"
  | "at_risk";

export interface GoalProgressItem {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  targetAmount: MoneyAmount;
  currentAmount: MoneyAmount;
  remainingAmount: MoneyAmount;
  progressPercent: number;
  status: GoalStatus;
  deadline?: string;
  daysRemaining?: number;
  monthlyTarget?: MoneyAmount;
  isOnTrack: boolean;
  createdAt: string;
}

export interface GetGoalsProgressOutput {
  goals: GoalProgressItem[];
  summary: {
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    totalTargetAmount: MoneyAmount;
    totalSavedAmount: MoneyAmount;
    overallProgress: number;
    onTrackCount: number;
    behindCount: number;
  };
  nextMilestones: Array<{
    goalName: string;
    milestone: string;
    amountNeeded: MoneyAmount;
    estimatedDate?: string;
  }>;
}

export interface GoalContribution {
  id: string;
  date: string;
  amount: MoneyAmount;
  source?: string;
  notes?: string;
}

export interface GetGoalDetailsOutput {
  goal: {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    targetAmount: MoneyAmount;
    currentAmount: MoneyAmount;
    remainingAmount: MoneyAmount;
    progressPercent: number;
    status: GoalStatus;
    deadline?: string;
    daysRemaining?: number;
    createdAt: string;
  };
  projections: {
    monthlyTarget: MoneyAmount;
    currentMonthlyAvg: MoneyAmount;
    estimatedCompletionDate?: string;
    isOnTrackForDeadline: boolean;
    monthsToComplete?: number;
  };
  recentContributions?: GoalContribution[];
  monthlyBreakdown?: Array<{
    month: string;
    monthLabel: string;
    contributed: MoneyAmount;
  }>;
  recommendations: string[];
}

export const GOAL_TOOLS_SCHEMAS: ToolDefinition[] = [
  {
    name: "get_goals_progress",
    description:
      "Get progress on all financial goals with status indicators and upcoming milestones.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["active", "completed", "cancelled"],
          description: "Filter by goal status",
        },
        sortBy: {
          type: "string",
          enum: ["progress", "deadline", "amount"],
          description: "Sort goals by field",
        },
      },
    },
  },
  {
    name: "get_goal_details",
    description:
      "Get detailed information about a specific goal including projections, contribution history, and recommendations.",
    parameters: {
      type: "object",
      properties: {
        goalId: {
          type: "string",
          description: "The goal ID to query",
        },
        includeHistory: {
          type: "boolean",
          description: "Include contribution history",
        },
      },
      required: ["goalId"],
    },
  },
];

export function isGoalToolName(name: string): name is GoalToolName {
  return ["get_goals_progress", "get_goal_details"].includes(name);
}
