"use client";

import {
  Banknote,
  Briefcase,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PortfolioSummary } from "@/hooks/use-portfolio-summary";
import { cn, formatCurrency } from "@/lib/utils";

interface PortfolioSummaryCardsProps {
  summary: PortfolioSummary;
  isLoading?: boolean;
}

export function PortfolioSummaryCards({
  summary,
  isLoading = false,
}: PortfolioSummaryCardsProps) {
  const t = useTranslations("investments.dashboard");

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const isPositive = summary.simpleReturn >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/50 dark:border-blue-800/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("cards.totalValue")}
          </CardTitle>
          <Wallet className="size-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(summary.totalCurrentValue / 100)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {summary.positionsCount}{" "}
            {summary.positionsCount === 1
              ? t("cards.position")
              : t("cards.positions")}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border-violet-200/50 dark:border-violet-800/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("cards.totalInvested")}
          </CardTitle>
          <Briefcase className="size-4 text-violet-600 dark:text-violet-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
            {formatCurrency(summary.totalInvested / 100)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {summary.accountsCount}{" "}
            {summary.accountsCount === 1
              ? t("cards.account")
              : t("cards.accounts")}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-200/50 dark:border-amber-800/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("cards.earnings")}
          </CardTitle>
          <Banknote className="size-4 text-amber-600 dark:text-amber-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {formatCurrency(summary.totalEarnings / 100)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t("cards.dividendsAndInterest")}
          </p>
        </CardContent>
      </Card>

      <Card
        className={cn(
          "bg-gradient-to-br border-200/50 dark:border-800/50",
          isPositive
            ? "from-green-500/10 to-green-600/5 border-green-200/50 dark:border-green-800/50"
            : "from-red-500/10 to-red-600/5 border-red-200/50 dark:border-red-800/50",
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("cards.return")}
          </CardTitle>
          {isPositive ? (
            <TrendingUp className="size-4 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="size-4 text-red-600 dark:text-red-400" />
          )}
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "text-2xl font-bold",
              isPositive
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400",
            )}
          >
            {isPositive ? "+" : ""}
            {formatCurrency(summary.simpleReturn / 100)}
          </div>
          <p
            className={cn(
              "text-xs mt-1 font-medium",
              isPositive
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400",
            )}
          >
            {isPositive ? "+" : ""}
            {summary.simpleReturnPercentage.toFixed(2)}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
