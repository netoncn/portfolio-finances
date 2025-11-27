"use client";

import { CheckCircle2, Circle, Pause, Target, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Goal } from "@/domain/goals";
import { calculateProgress } from "@/domain/goals/helpers/goal.helper";
import { cn, formatCurrency } from "@/lib/utils";

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  compact?: boolean;
}

export function GoalCard({
  goal,
  onEdit,
  onDelete,
  compact = false,
}: GoalCardProps) {
  const t = useTranslations("goals");

  const progress = calculateProgress(goal);

  const getStatusIcon = () => {
    switch (goal.status) {
      case "completed":
        return <CheckCircle2 className="size-5 text-green-600" />;
      case "canceled":
        return <XCircle className="size-5 text-red-600" />;
      case "paused":
        return <Pause className="size-5 text-yellow-600" />;
      default:
        return <Circle className="size-5 text-blue-600" />;
    }
  };

  const getStatusColor = () => {
    switch (goal.status) {
      case "completed":
        return "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900";
      case "canceled":
        return "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-900";
      case "paused":
        return "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-900";
      default:
        return "bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800";
    }
  };

  const getPriorityColor = () => {
    switch (goal.priority) {
      case "high":
        return "text-red-600 dark:text-red-400";
      case "medium":
        return "text-orange-600 dark:text-orange-400";
      case "low":
        return "text-blue-600 dark:text-blue-400";
    }
  };

  if (compact) {
    return (
      <Card className={cn("border", getStatusColor())}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{goal.icon || "🎯"}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-sm truncate">{goal.name}</h4>
                {getStatusIcon()}
              </div>
              <Progress
                value={progress.percentageComplete}
                className="h-2 mb-1"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {formatCurrency(goal.currentAmount)} /{" "}
                  {formatCurrency(goal.targetAmount)}
                </span>
                <span className="font-semibold">
                  {Math.round(progress.percentageComplete)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-2", getStatusColor())}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{goal.icon || "🎯"}</div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {goal.name}
                {getStatusIcon()}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={cn("text-xs font-semibold", getPriorityColor())}
                >
                  {t(`priority.${goal.priority}`)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t(`category.${goal.category}`)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(goal)}>
                {t("actions.edit")}
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" onClick={() => onDelete(goal)}>
                {t("actions.delete")}
              </Button>
            )}
          </div>
        </div>
        {goal.description && (
          <p className="text-sm text-muted-foreground mt-2">
            {goal.description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t("progress")}</span>
              <span className="text-2xl font-bold text-primary">
                {Math.round(progress.percentageComplete)}%
              </span>
            </div>
            <Progress value={progress.percentageComplete} className="h-3" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">{t("current")}</p>
              <p className="text-lg font-semibold">
                {formatCurrency(goal.currentAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("target")}</p>
              <p className="text-lg font-semibold">
                {formatCurrency(goal.targetAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("remaining")}</p>
              <p className="text-lg font-semibold">
                {formatCurrency(progress.remainingAmount)}
              </p>
            </div>
          </div>

          {(progress.daysRemaining !== undefined ||
            progress.monthlyRequiredSaving !== undefined) && (
            <div className="flex items-center gap-4 pt-4 border-t">
              {progress.daysRemaining !== undefined && (
                <div className="flex items-center gap-2">
                  <Target className="size-4 text-muted-foreground" />
                  <span
                    className={cn(
                      "text-sm",
                      progress.isOverdue
                        ? "text-red-600 dark:text-red-400 font-semibold"
                        : "text-muted-foreground",
                    )}
                  >
                    {progress.isOverdue
                      ? t("overdue", { days: Math.abs(progress.daysRemaining) })
                      : t("daysRemaining", { days: progress.daysRemaining })}
                  </span>
                </div>
              )}
              {progress.monthlyRequiredSaving !== undefined &&
                progress.monthlyRequiredSaving > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {t("monthlyRequired")}:{" "}
                      <span className="font-semibold text-foreground">
                        {formatCurrency(progress.monthlyRequiredSaving)}
                      </span>
                    </span>
                  </div>
                )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
