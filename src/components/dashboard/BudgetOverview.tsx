"use client";

import {
  ArrowUpRight,
  PiggyBank,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { BudgetOverview as BudgetOverviewType } from "@/domain/dashboard";
import { cn, formatCurrency } from "@/lib/utils";

interface BudgetOverviewProps {
  budgetOverview: BudgetOverviewType;
  isLoading?: boolean;
}

export function BudgetOverview({
  budgetOverview,
  isLoading = false,
}: BudgetOverviewProps) {
  const t = useTranslations("dashboard.budgetOverview");
  const tCommon = useTranslations("common");

  const isOverBudget = budgetOverview.percentageUsed > 100;
  const isNearLimit =
    budgetOverview.percentageUsed >= 80 && budgetOverview.percentageUsed < 100;

  return (
    <Card className="border-none shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="size-5 text-primary" />
              {t("title")}
            </CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>
          <Link href="/budgets">
            <Button
              variant="ghost"
              size="sm"
              className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
            >
              {t("viewAll")}
              <ArrowUpRight className="size-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {tCommon("loading")}
          </div>
        ) : budgetOverview.activeBudgets === 0 ? (
          <div className="text-center py-8">
            <PiggyBank className="size-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t("noBudgets.title")}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("noBudgets.description")}
            </p>
            <Link href="/budgets">
              <Button>{t("noBudgets.action")}</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {t("overallProgress")}
                </span>
                <span
                  className={cn(
                    "text-sm font-bold",
                    isOverBudget && "text-finance-loss",
                    isNearLimit && "text-finance-neutral",
                    !isOverBudget && !isNearLimit && "text-finance-gain",
                  )}
                >
                  {budgetOverview.percentageUsed.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={Math.min(budgetOverview.percentageUsed, 100)}
                className={cn(
                  isOverBudget &&
                    "bg-red-100 dark:bg-red-900 [&>div]:bg-red-600",
                  isNearLimit &&
                    "bg-yellow-100 dark:bg-yellow-900 [&>div]:bg-yellow-600",
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  {t("totalBudgeted")}
                </p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(budgetOverview.totalBudgeted)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  {t("totalSpent")}
                </p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(budgetOverview.totalSpent)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  {t("remaining")}
                </p>
                <p
                  className={cn(
                    "text-lg font-bold",
                    budgetOverview.totalBudgeted - budgetOverview.totalSpent < 0
                      ? "text-finance-loss"
                      : "text-finance-gain",
                  )}
                >
                  {formatCurrency(
                    budgetOverview.totalBudgeted - budgetOverview.totalSpent,
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  {t("activeBudgets")}
                </p>
                <p className="text-lg font-bold text-foreground">
                  {budgetOverview.activeBudgets}
                </p>
              </div>
            </div>

            {(budgetOverview.overBudgetCount > 0 ||
              budgetOverview.nearLimitCount > 0) && (
              <div className="space-y-2 pt-4 border-t">
                {budgetOverview.overBudgetCount > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingDown className="size-4 text-finance-loss" />
                    <span className="text-finance-loss">
                      {budgetOverview.overBudgetCount} {t("overBudget")}
                    </span>
                  </div>
                )}
                {budgetOverview.nearLimitCount > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="size-4 text-finance-neutral" />
                    <span className="text-finance-neutral">
                      {budgetOverview.nearLimitCount} {t("nearLimit")}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
