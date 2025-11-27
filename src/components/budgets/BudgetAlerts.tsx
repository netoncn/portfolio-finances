"use client";

import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Info,
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
import type { BudgetAlert, BudgetAlertLevel } from "@/domain/budgets";
import { cn, formatCurrency } from "@/lib/utils";

interface BudgetAlertsProps {
  alerts: BudgetAlert[];
  counts: Record<BudgetAlertLevel, number>;
  isLoading?: boolean;
  compact?: boolean;
}

export function BudgetAlerts({
  alerts,
  counts,
  isLoading = false,
  compact = false,
}: BudgetAlertsProps) {
  const t = useTranslations("budgets.alerts");
  const tCommon = useTranslations("common");

  const getAlertIcon = (level: BudgetAlertLevel) => {
    switch (level) {
      case "critical":
        return AlertCircle;
      case "danger":
        return AlertTriangle;
      case "warning":
        return Info;
    }
  };

  const getAlertStyles = (level: BudgetAlertLevel) => {
    switch (level) {
      case "critical":
        return {
          bg: "bg-red-50 dark:bg-red-950",
          border: "border-red-200 dark:border-red-900",
          text: "text-red-700 dark:text-red-400",
          iconBg: "bg-red-100 dark:bg-red-900",
          iconColor: "text-red-600 dark:text-red-400",
        };
      case "danger":
        return {
          bg: "bg-orange-50 dark:bg-orange-950",
          border: "border-orange-200 dark:border-orange-900",
          text: "text-orange-700 dark:text-orange-400",
          iconBg: "bg-orange-100 dark:bg-orange-900",
          iconColor: "text-orange-600 dark:text-orange-400",
        };
      case "warning":
        return {
          bg: "bg-yellow-50 dark:bg-yellow-950",
          border: "border-yellow-200 dark:border-yellow-900",
          text: "text-yellow-700 dark:text-yellow-400",
          iconBg: "bg-yellow-100 dark:bg-yellow-900",
          iconColor: "text-yellow-600 dark:text-yellow-400",
        };
    }
  };

  if (compact) {
    return (
      <Card className="border-none shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="size-5 text-primary" />
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
          ) : alerts.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="size-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t("noAlerts.title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("noAlerts.description")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b">
                {counts.critical > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    <AlertCircle className="size-3" />
                    {counts.critical} {t("levels.critical")}
                  </span>
                )}
                {counts.danger > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    <AlertTriangle className="size-3" />
                    {counts.danger} {t("levels.danger")}
                  </span>
                )}
                {counts.warning > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    <Info className="size-3" />
                    {counts.warning} {t("levels.warning")}
                  </span>
                )}
              </div>

              {alerts.slice(0, 5).map((alert) => {
                const Icon = getAlertIcon(alert.level);
                const styles = getAlertStyles(alert.level);

                return (
                  <div
                    key={alert.budgetId}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border",
                      styles.bg,
                      styles.border,
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0",
                        styles.iconBg,
                      )}
                    >
                      <Icon className={cn("size-5", styles.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-semibold", styles.text)}>
                        {alert.budgetName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(alert.spent)} {t("of")}{" "}
                        {formatCurrency(alert.budgetAmount)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={cn("text-sm font-bold", styles.text)}>
                        {Math.round(alert.percentage)}%
                      </p>
                    </div>
                  </div>
                );
              })}

              {alerts.length > 5 && (
                <Link href="/budgets">
                  <Button
                    variant="ghost"
                    className="w-full mt-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                  >
                    {t("viewMore", { count: alerts.length - 5 })}
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          {tCommon("loading")}
        </div>
      ) : alerts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="text-center py-12">
            <Bell className="size-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t("noAlerts.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("noAlerts.description")}
            </p>
          </CardContent>
        </Card>
      ) : (
        alerts.map((alert) => {
          const Icon = getAlertIcon(alert.level);
          const styles = getAlertStyles(alert.level);

          return (
            <Card
              key={alert.budgetId}
              className={cn("border-none shadow-md", styles.bg, styles.border)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-lg flex-shrink-0",
                      styles.iconBg,
                    )}
                  >
                    <Icon className={cn("size-6", styles.iconColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <p className={cn("text-lg font-bold", styles.text)}>
                          {alert.budgetName}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t(`levels.${alert.level}`)} -{" "}
                          {Math.round(alert.percentage)}% {t("used")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-2xl font-bold", styles.text)}>
                          {Math.round(alert.percentage)}%
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t("spent")}:
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(alert.spent)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t("budget")}:
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(alert.budgetAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t("remaining")}:
                        </span>
                        <span
                          className={cn(
                            "font-semibold",
                            alert.budgetAmount - alert.spent < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-green-600 dark:text-green-400",
                          )}
                        >
                          {formatCurrency(alert.budgetAmount - alert.spent)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
