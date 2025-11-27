"use client";

import { Brain, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AlertsCard } from "@/components/insights/AlertsCard";
import { InsightCard } from "@/components/insights/InsightCard";
import { SpendingSummaryCard } from "@/components/insights/SpendingSummaryCard";
import { TopSpendingCard } from "@/components/insights/TopSpendingCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatMonth,
  getCurrentMonth,
  getPreviousMonth,
  useInsights,
} from "@/hooks/use-insights";

export default function InsightsPage() {
  const t = useTranslations("insights");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const { data: insights, isLoading, error } = useInsights(selectedMonth);

  const handlePreviousMonth = () => {
    setSelectedMonth(getPreviousMonth(selectedMonth));
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const nextDate = new Date(year, month); // month is already 1-indexed for next month
    setSelectedMonth(
      `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`,
    );
  };

  const canGoNext = () => {
    return selectedMonth < getCurrentMonth();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t("emptyState.title")}</h2>
          <p className="text-muted-foreground">
            {error ? t("error") : t("emptyState.description")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {t("title")}
              </h1>
              <p className="text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 px-4">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">
                {formatMonth(selectedMonth)}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              disabled={!canGoNext()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <SpendingSummaryCard insights={insights} />

        {insights.alerts.length > 0 && <AlertsCard alerts={insights.alerts} />}

        {insights.insights.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">{t("aiInsights")}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {insights.insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </div>
        )}

        {insights.topSpending.length > 0 && (
          <TopSpendingCard topSpending={insights.topSpending} />
        )}
      </div>
    </div>
  );
}
