export type BudgetAlertLevel = "warning" | "danger" | "critical";

export interface BudgetAlert {
  budgetId: string;
  budgetName: string;
  budgetAmount: number; // in cents
  spent: number; // in cents
  percentage: number; // 0-100
  level: BudgetAlertLevel;
  threshold: number; // 50, 80, or 100
  message: string;
  categoryIds: string[];
  createdAt: number;
}

export interface BudgetAlertThresholds {
  warning: number; // default 50%
  danger: number; // default 80%
  critical: number; // default 100%
}

export const DEFAULT_ALERT_THRESHOLDS: BudgetAlertThresholds = {
  warning: 50,
  danger: 80,
  critical: 100,
};

export function getBudgetAlertLevel(
  percentage: number,
  customThreshold?: number,
): BudgetAlertLevel | null {
  const thresholds = DEFAULT_ALERT_THRESHOLDS;

  const dangerThreshold = customThreshold
    ? customThreshold * 100
    : thresholds.danger;

  if (percentage >= thresholds.critical) {
    return "critical";
  }

  if (percentage >= dangerThreshold) {
    return "danger";
  }

  if (percentage >= thresholds.warning) {
    return "warning";
  }

  return null;
}

export function getAlertColor(level: BudgetAlertLevel): string {
  switch (level) {
    case "warning":
      return "yellow";
    case "danger":
      return "orange";
    case "critical":
      return "red";
  }
}
