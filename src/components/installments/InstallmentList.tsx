"use client";

import { CheckCircle, Circle, MoreHorizontal, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Transaction } from "@/domain/transactions";
import {
  useCancelInstallment,
  useMarkInstallmentPaid,
} from "@/hooks/use-installments";
import { formatCurrency } from "@/lib/utils";

interface InstallmentListProps {
  transactions: Transaction[];
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusIcon(status?: string) {
  switch (status) {
    case "paid":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "canceled":
    case "refunded":
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
}

function getStatusVariant(
  status?: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "paid":
      return "default";
    case "posted":
      return "secondary";
    case "scheduled":
      return "outline";
    case "canceled":
    case "refunded":
      return "destructive";
    default:
      return "secondary";
  }
}

export function InstallmentList({ transactions }: InstallmentListProps) {
  const t = useTranslations("installments");
  const tStatus = useTranslations("transactions.status");
  const markPaidMutation = useMarkInstallmentPaid();
  const cancelMutation = useCancelInstallment();

  const sortedTransactions = [...transactions].sort((a, b) => {
    const aNum = a.installmentNumber || 0;
    const bNum = b.installmentNumber || 0;
    return aNum - bNum;
  });

  const handleMarkPaid = async (id: string) => {
    try {
      await markPaidMutation.mutateAsync(id);
      toast.success(t("actions.markPaidSuccess"));
    } catch {
      toast.error(t("actions.markPaidError"));
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelMutation.mutateAsync(id);
      toast.success(t("actions.cancelSuccess"));
    } catch {
      toast.error(t("actions.cancelError"));
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        {t("list.empty")}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sortedTransactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center gap-3">
            {getStatusIcon(transaction.status)}

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {transaction.installmentNumber}/{transaction.installmentCount}
                </span>
                <Badge variant={getStatusVariant(transaction.status)}>
                  {tStatus(transaction.status || "posted")}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDate(transaction.date)}
                {transaction.dueDate && (
                  <>
                    {" · "}
                    {t("list.due")} {formatDate(transaction.dueDate)}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {formatCurrency(transaction.amount)}
            </span>

            {transaction.status !== "paid" &&
              transaction.status !== "canceled" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">{t("list.actions")}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleMarkPaid(transaction.id)}
                      disabled={markPaidMutation.isPending}
                    >
                      {t("actions.markPaid")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleCancel(transaction.id)}
                      disabled={cancelMutation.isPending}
                      className="text-destructive"
                    >
                      {t("actions.cancel")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
          </div>
        </div>
      ))}
    </div>
  );
}
