"use client";

import { AlertCircle } from "lucide-react";
import { useBudgetAlerts } from "@/hooks/use-budget-alerts";
import { cn } from "@/lib/utils";

interface BudgetAlertBadgeProps {
  className?: string;
  showIcon?: boolean;
}

export function BudgetAlertBadge({
  className,
  showIcon = false,
}: BudgetAlertBadgeProps) {
  const { data, isLoading } = useBudgetAlerts();

  if (isLoading || !data || data.total === 0) {
    return null;
  }

  const { total, hasCritical } = data;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold",
        hasCritical
          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
        className,
      )}
    >
      {showIcon && <AlertCircle className="size-3" />}
      <span>{total}</span>
    </div>
  );
}
