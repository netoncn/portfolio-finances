import type { BaseEntity } from "@/types/common";

export type GoalStatus = "active" | "completed" | "canceled" | "paused";

export type GoalPriority = "low" | "medium" | "high";

export type GoalCategory =
  | "emergency_fund" // Fundo de emergência
  | "vacation" // Viagem/Férias
  | "house" // Casa/Imóvel
  | "car" // Carro/Veículo
  | "education" // Educação
  | "retirement" // Aposentadoria
  | "investment" // Investimento
  | "debt_payoff" // Pagamento de dívida
  | "wedding" // Casamento
  | "business" // Negócio
  | "other"; // Outro

export interface Goal extends BaseEntity {
  userId: string;
  name: string;
  description?: string;
  targetAmount: number; // Target amount in cents
  currentAmount: number; // Current saved amount in cents
  category: GoalCategory;
  priority: GoalPriority;
  status: GoalStatus;
  targetDate?: number; // Target completion date timestamp
  startDate: number; // When the goal was started
  completedDate?: number; // When the goal was completed
  icon?: string; // Emoji icon
  color?: string; // Hex color for UI
  notes?: string;
}

export interface GoalProgress {
  goalId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  percentageComplete: number;
  daysRemaining?: number;
  isOverdue?: boolean;
  estimatedCompletionDate?: number;
  monthlyRequiredSaving?: number; // How much needs to be saved per month to reach goal
}

export interface GoalSummary {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  totalTargetAmount: number;
  totalCurrentAmount: number;
  totalRemainingAmount: number;
  overallProgress: number;
}
