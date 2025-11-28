"use client";

import { Pencil, PiggyBank, Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  Budget,
  BudgetPeriod,
  BudgetStatus,
} from "@/domain/budgets/types/budget";
import { formatCurrency } from "@/lib/utils";

interface BudgetsTableProps {
  budgets: Budget[];
  isLoading?: boolean;
  onBudgetClick?: (budget: Budget) => void;
  onDeleteClick?: (budget: Budget) => void;
}

const BUDGET_PERIOD_BADGE_COLORS: Record<BudgetPeriod, string> = {
  monthly: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  yearly:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  quarterly: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  custom: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const BUDGET_STATUS_BADGE_COLORS: Record<BudgetStatus, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  completed:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

export function BudgetsTable({
  budgets,
  isLoading,
  onBudgetClick,
  onDeleteClick,
}: BudgetsTableProps) {
  const t = useTranslations("budgets");
  const tCommon = useTranslations("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");

  const filteredBudgets = useMemo(() => {
    return budgets.filter((budget) => {
      const matchesSearch =
        searchQuery === "" ||
        budget.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPeriod =
        periodFilter === "all" || budget.period === periodFilter;

      const matchesStatus =
        statusFilter === "all" || budget.status === statusFilter;

      return matchesSearch && matchesPeriod && matchesStatus;
    });
  }, [budgets, searchQuery, periodFilter, statusFilter]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">{tCommon("loading")}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("filters.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("filters.period")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allPeriods")}</SelectItem>
                <SelectItem value="monthly">{t("periods.monthly")}</SelectItem>
                <SelectItem value="yearly">{t("periods.yearly")}</SelectItem>
                <SelectItem value="quarterly">
                  {t("periods.quarterly")}
                </SelectItem>
                <SelectItem value="custom">{t("periods.custom")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t("filters.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.all")}</SelectItem>
                <SelectItem value="active">{t("status.active")}</SelectItem>
                <SelectItem value="inactive">{t("status.inactive")}</SelectItem>
                <SelectItem value="completed">
                  {t("status.completed")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredBudgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <PiggyBank className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              {t("table.noResults")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery ||
              periodFilter !== "all" ||
              statusFilter !== "active"
                ? t("table.adjustFilters")
                : t("emptyState.description")}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.name")}</TableHead>
                  <TableHead>{t("table.period")}</TableHead>
                  <TableHead className="text-right">
                    {t("table.amount")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("table.spent")}
                  </TableHead>
                  <TableHead>{t("table.progress")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                  <TableHead className="text-right">
                    {t("table.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBudgets.map((budget) => {
                  const percentageUsed = (budget.spent / budget.amount) * 100;
                  const isOverBudget = budget.spent > budget.amount;
                  const isNearLimit =
                    percentageUsed >= 80 && percentageUsed < 100;

                  return (
                    <TableRow key={budget.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {budget.icon && (
                            <span className="text-lg">{budget.icon}</span>
                          )}
                          <span className="truncate">{budget.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={BUDGET_PERIOD_BADGE_COLORS[budget.period]}
                        >
                          {t(`periods.${budget.period}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(budget.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            isOverBudget
                              ? "text-finance-loss font-semibold"
                              : ""
                          }
                        >
                          {formatCurrency(budget.spent)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress
                            value={Math.min(percentageUsed, 100)}
                            className={
                              isOverBudget
                                ? "bg-red-100 dark:bg-red-900 [&>div]:bg-red-600"
                                : isNearLimit
                                  ? "bg-yellow-100 dark:bg-yellow-900 [&>div]:bg-yellow-600"
                                  : ""
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            {percentageUsed.toFixed(1)}%
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={BUDGET_STATUS_BADGE_COLORS[budget.status]}
                        >
                          {t(`status.${budget.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              onBudgetClick?.(budget);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteClick?.(budget);
                            }}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredBudgets.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div>
              {t("table.showing")} {filteredBudgets.length} {t("table.of")}{" "}
              {budgets.length} {t("table.budgets")}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
