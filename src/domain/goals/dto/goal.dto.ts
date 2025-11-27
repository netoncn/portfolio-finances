import type { GoalCategory, GoalPriority, GoalStatus } from "../types/goal";

export interface CreateGoalDTO {
  userId: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount?: number;
  category: GoalCategory;
  priority: GoalPriority;
  targetDate?: number;
  icon?: string;
  color?: string;
  notes?: string;
}

export interface UpdateGoalDTO {
  id: string;
  userId: string;
  name?: string;
  description?: string;
  targetAmount?: number;
  currentAmount?: number;
  category?: GoalCategory;
  priority?: GoalPriority;
  status?: GoalStatus;
  targetDate?: number;
  icon?: string;
  color?: string;
  notes?: string;
}

export interface UpdateGoalProgressDTO {
  id: string;
  userId: string;
  currentAmount: number;
  notes?: string;
}
