"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Statement } from "@/domain/statements";
import { formatStatementMonth, isStatementOverdue } from "@/domain/statements";
import { formatCurrency } from "@/lib/utils";
import { StatementDialog } from "./StatementDialog";

interface StatementCardProps {
  statement: Statement;
  accountName?: string;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function getStatusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "paid":
      return "default";
    case "closed":
      return "secondary";
    case "open":
      return "outline";
    default:
      return "secondary";
  }
}

function getStatusIcon(statement: Statement) {
  if (statement.status === "paid") {
    return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  }
  if (isStatementOverdue(statement)) {
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  }
  return <Clock className="h-4 w-4 text-muted-foreground" />;
}

export function StatementCard({ statement, accountName }: StatementCardProps) {
  const t = useTranslations("statements");
  const [dialogOpen, setDialogOpen] = useState(false);

  const isOverdue = isStatementOverdue(statement);
  const remainingAmount = statement.totalAmount - statement.paidAmount;

  return (
    <>
      <Card
        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
          isOverdue ? "border-red-200 bg-red-50/50" : ""
        }`}
      >
        <CardHeader
          className="pb-3"
          onClick={() => setDialogOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setDialogOpen(true);
            }
          }}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-medium">
                {formatStatementMonth(statement.statementMonth)}
              </CardTitle>
              {accountName && (
                <div className="text-sm text-muted-foreground">
                  {accountName}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(statement)}
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>

        <CardContent onClick={() => setDialogOpen(true)}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("card.total")}
              </span>
              <span className="text-lg font-semibold">
                {formatCurrency(statement.totalAmount)}
              </span>
            </div>

            {statement.paidAmount > 0 && remainingAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("card.remaining")}
                </span>
                <span className="text-sm font-medium text-orange-600">
                  {formatCurrency(remainingAmount)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{t("card.dueDate")}</span>
              </div>
              <span
                className={`font-medium ${isOverdue ? "text-red-600" : ""}`}
              >
                {formatDate(statement.dueDate)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <Badge variant={getStatusVariant(statement.status)}>
                {t(`status.${statement.status}`)}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  {t("card.overdue")}
                </Badge>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              {t("card.transactions", { count: statement.transactionCount })}
            </div>
          </div>
        </CardContent>
      </Card>

      <StatementDialog
        statement={statement}
        accountName={accountName}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
