"use client";

import { ArrowDown, ArrowUp, DollarSign, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonthlyInsights } from "@/domain/insights/types/insight";
import { formatCurrency } from "@/lib/utils";

interface SpendingSummaryCardProps {
  insights: MonthlyInsights;
}

export function SpendingSummaryCard({ insights }: SpendingSummaryCardProps) {
  const t = useTranslations("insights.spendingSummary");
  const { summary, variations } = insights;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("totalIncome")}
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(summary.totalIncome)}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.transactionCount} {t("transactions")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("totalExpenses")}
          </CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(summary.totalExpenses)}
          </div>
          {variations.vsLastMonth && (
            <div className="flex items-center gap-1 text-xs">
              {variations.vsLastMonth.percentage > 0 ? (
                <>
                  <ArrowUp className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">
                    +{variations.vsLastMonth.percentage.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <ArrowDown className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">
                    {variations.vsLastMonth.percentage.toFixed(1)}%
                  </span>
                </>
              )}
              <span className="text-muted-foreground">{t("vsLastMonth")}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("netBalance")}
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${summary.netBalance >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {formatCurrency(summary.netBalance)}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("incomeMinusExpenses")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("savingsRate")}
          </CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${summary.savingsRate >= 20 ? "text-green-600" : summary.savingsRate >= 0 ? "text-yellow-600" : "text-red-600"}`}
          >
            {summary.savingsRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.savingsRate >= 20
              ? t("ratings.excellent")
              : summary.savingsRate >= 10
                ? t("ratings.good")
                : summary.savingsRate >= 0
                  ? t("ratings.fair")
                  : t("ratings.negative")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
