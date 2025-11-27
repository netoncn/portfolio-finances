import type { Goal, GoalProgress } from "../types/goal";

/**
 * Calculate the progress of a goal
 * This is a pure utility function that can be used in both client and server components
 */
export function calculateProgress(goal: Goal): GoalProgress {
  const remainingAmount = goal.targetAmount - goal.currentAmount;
  const percentageComplete = (goal.currentAmount / goal.targetAmount) * 100;

  let daysRemaining: number | undefined;
  let isOverdue = false;
  let monthlyRequiredSaving: number | undefined;

  if (goal.targetDate) {
    const now = Date.now();
    const timeRemaining = goal.targetDate - now;
    daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
    isOverdue = daysRemaining < 0;

    if (daysRemaining > 0) {
      const monthsRemaining = daysRemaining / 30;
      monthlyRequiredSaving = Math.ceil(remainingAmount / monthsRemaining);
    }
  }

  return {
    goalId: goal.id,
    goalName: goal.name,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    remainingAmount,
    percentageComplete: Math.min(percentageComplete, 100),
    daysRemaining,
    isOverdue,
    monthlyRequiredSaving,
  };
}
