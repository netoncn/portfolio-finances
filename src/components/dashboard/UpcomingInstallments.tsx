"use client";

import { AlertCircle, ArrowUpRight, Calendar, CreditCard } from "lucide-react";
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
import type { UpcomingInstallment } from "@/domain/dashboard";
import { cn, formatCurrency } from "@/lib/utils";

interface UpcomingInstallmentsProps {
  installments: UpcomingInstallment[];
  isLoading?: boolean;
}

export function UpcomingInstallments({
  installments,
  isLoading = false,
}: UpcomingInstallmentsProps) {
  const t = useTranslations("dashboard.upcomingInstallments");
  const tCommon = useTranslations("common");

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
    }).format(date);
  };

  const getDaysUntil = (timestamp: number) => {
    const now = Date.now();
    const diff = timestamp - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <Card className="border-none shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              {t("title")}
            </CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>
          <Link href="/transactions">
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
        ) : installments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="size-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t("noInstallments.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("noInstallments.description")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {installments.slice(0, 5).map((installment) => {
              const daysUntil = getDaysUntil(installment.dueDate);
              const isOverdue = installment.isOverdue;
              const isDueSoon = daysUntil <= 3 && !isOverdue;

              return (
                <div
                  key={`${installment.transactionId}-${installment.installmentNumber}`}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                    isOverdue &&
                      "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950",
                    isDueSoon &&
                      "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950",
                    !isOverdue &&
                      !isDueSoon &&
                      "border-border hover:bg-muted/50",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      isOverdue && "bg-red-200 dark:bg-red-900",
                      isDueSoon && "bg-yellow-200 dark:bg-yellow-900",
                      !isOverdue && !isDueSoon && "bg-primary/10",
                    )}
                  >
                    {installment.categoryIcon ? (
                      <span className="text-lg">
                        {installment.categoryIcon}
                      </span>
                    ) : (
                      <CreditCard
                        className={cn(
                          "size-5",
                          isOverdue && "text-red-600",
                          isDueSoon && "text-yellow-600",
                          !isOverdue && !isDueSoon && "text-primary",
                        )}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {installment.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {installment.categoryName && (
                        <span className="text-xs text-muted-foreground">
                          {installment.categoryName}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {installment.installmentNumber}/
                        {installment.totalInstallments}
                      </span>
                    </div>
                    {installment.accountName && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {installment.accountName}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">
                      {formatCurrency(installment.amount)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {isOverdue && (
                        <AlertCircle className="size-3 text-red-600" />
                      )}
                      <p
                        className={cn(
                          "text-xs",
                          isOverdue &&
                            "text-red-600 dark:text-red-400 font-medium",
                          isDueSoon &&
                            "text-yellow-600 dark:text-yellow-400 font-medium",
                          !isOverdue && !isDueSoon && "text-muted-foreground",
                        )}
                      >
                        {isOverdue
                          ? t("overdue")
                          : daysUntil === 0
                            ? t("today")
                            : daysUntil === 1
                              ? t("tomorrow")
                              : formatDate(installment.dueDate)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {installments.length > 5 && (
              <Link href="/transactions">
                <Button
                  variant="ghost"
                  className="w-full mt-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                >
                  {t("viewMore", { count: installments.length - 5 })}
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
