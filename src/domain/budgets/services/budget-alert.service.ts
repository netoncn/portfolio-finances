import "server-only";
import type { Budget } from "../types/budget";
import type { BudgetAlert, BudgetAlertLevel } from "../types/budget-alert";
import { getBudgetAlertLevel } from "../types/budget-alert";
import { BudgetService } from "./budget.service";

export class BudgetAlertService {
  static async getActiveAlerts(userId: string): Promise<BudgetAlert[]> {
    const budgets = await BudgetService.listActiveByUser(userId);
    const alerts: BudgetAlert[] = [];

    for (const budget of budgets) {
      const alert = BudgetAlertService.checkBudgetAlert(budget);
      if (alert) {
        alerts.push(alert);
      }
    }

    return alerts.sort((a, b) => {
      const severityOrder: Record<BudgetAlertLevel, number> = {
        critical: 3,
        danger: 2,
        warning: 1,
      };

      const severityDiff = severityOrder[b.level] - severityOrder[a.level];
      if (severityDiff !== 0) return severityDiff;

      return b.percentage - a.percentage;
    });
  }

  static checkBudgetAlert(budget: Budget): BudgetAlert | null {
    if (budget.amount === 0) return null;

    const percentage = (budget.spent / budget.amount) * 100;
    const level = getBudgetAlertLevel(percentage, budget.alertThreshold);

    if (!level) return null;

    const message = BudgetAlertService.getAlertMessage(
      level,
      percentage,
      budget.name,
    );

    return {
      budgetId: budget.id,
      budgetName: budget.name,
      budgetAmount: budget.amount,
      spent: budget.spent,
      percentage,
      level,
      threshold: BudgetAlertService.getThresholdForLevel(
        level,
        budget.alertThreshold,
      ),
      message,
      categoryIds: budget.categoryIds,
      createdAt: Date.now(),
    };
  }

  private static getAlertMessage(
    level: BudgetAlertLevel,
    percentage: number,
    budgetName: string,
  ): string {
    const roundedPercentage = Math.round(percentage);

    switch (level) {
      case "critical":
        if (percentage > 100) {
          return `Budget "${budgetName}" exceeded by ${roundedPercentage - 100}%`;
        }
        return `Budget "${budgetName}" fully used (${roundedPercentage}%)`;
      case "danger":
        return `Budget "${budgetName}" almost exhausted (${roundedPercentage}%)`;
      case "warning":
        return `Budget "${budgetName}" is at ${roundedPercentage}% usage`;
    }
  }

  private static getThresholdForLevel(
    level: BudgetAlertLevel,
    customThreshold?: number,
  ): number {
    switch (level) {
      case "critical":
        return 100;
      case "danger":
        return customThreshold ? customThreshold * 100 : 80;
      case "warning":
        return 50;
    }
  }

  static getAlertCounts(
    alerts: BudgetAlert[],
  ): Record<BudgetAlertLevel, number> {
    return {
      warning: alerts.filter((a) => a.level === "warning").length,
      danger: alerts.filter((a) => a.level === "danger").length,
      critical: alerts.filter((a) => a.level === "critical").length,
    };
  }

  static hasCriticalAlerts(alerts: BudgetAlert[]): boolean {
    return alerts.some((a) => a.level === "critical");
  }

  static async getAlertsForBudget(
    budgetId: string,
    userId: string,
  ): Promise<BudgetAlert | null> {
    const budget = await BudgetService.getById(budgetId, userId);
    if (!budget) return null;

    return BudgetAlertService.checkBudgetAlert(budget);
  }
}
