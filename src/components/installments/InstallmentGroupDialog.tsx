"use client";

import { AlertTriangle, Calendar, DollarSign, Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { InstallmentGroup } from "@/domain/installments";
import {
  useCancelAllInstallments,
  useInstallmentTransactions,
} from "@/hooks/use-installments";
import { formatCurrency } from "@/lib/utils";
import { InstallmentList } from "./InstallmentList";

interface InstallmentGroupDialogProps {
  group: InstallmentGroup;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function InstallmentGroupDialog({
  group,
  open,
  onOpenChange,
}: InstallmentGroupDialogProps) {
  const t = useTranslations("installments");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const { data: transactions = [], isLoading } = useInstallmentTransactions(
    group.id!,
  );
  const cancelAllMutation = useCancelAllInstallments();

  const totalAmount =
    group.originalAmount + (group.interestTotal || 0) + (group.feesTotal || 0);
  const installmentAmount = totalAmount / group.installmentCount;

  const paidCount = transactions.filter((t) => t.status === "paid").length;
  const canceledCount = transactions.filter(
    (t) => t.status === "canceled",
  ).length;
  const pendingCount = transactions.filter(
    (t) => t.status === "posted" || t.status === "scheduled",
  ).length;

  const paidAmount = transactions
    .filter((t) => t.status === "paid")
    .reduce((sum, t) => sum + t.amount, 0);
  const pendingAmount = transactions
    .filter((t) => t.status === "posted" || t.status === "scheduled")
    .reduce((sum, t) => sum + t.amount, 0);

  const handleCancelAll = async () => {
    try {
      await cancelAllMutation.mutateAsync(group.id!);
      toast.success(t("dialog.cancelAllSuccess"));
      setCancelDialogOpen(false);
      onOpenChange(false);
    } catch {
      toast.error(t("dialog.cancelAllError"));
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {group.merchant || t("dialog.unknownMerchant")}
            </DialogTitle>
            <DialogDescription>
              {t("dialog.description", { count: group.installmentCount })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">
                  {t("dialog.total")}
                </div>
                <div className="text-lg font-semibold">
                  {formatCurrency(totalAmount)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {group.installmentCount}x {formatCurrency(installmentAmount)}
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">
                  {t("dialog.paid")}
                </div>
                <div className="text-lg font-semibold text-green-600">
                  {formatCurrency(paidAmount)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {paidCount} {t("dialog.installments")}
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">
                  {t("dialog.pending")}
                </div>
                <div className="text-lg font-semibold">
                  {formatCurrency(pendingAmount)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {pendingCount} {t("dialog.installments")}
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{t("dialog.purchaseDate")}</span>
                </div>
                <span className="font-medium">
                  {formatDate(group.purchaseDate)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{t("dialog.firstDueDate")}</span>
                </div>
                <span className="font-medium">
                  {formatDate(group.firstDueDate)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>{t("dialog.originalAmount")}</span>
                </div>
                <span className="font-medium">
                  {formatCurrency(group.originalAmount)}
                </span>
              </div>

              {(group.interestTotal || 0) > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>{t("dialog.interest")}</span>
                  </div>
                  <span className="font-medium text-orange-600">
                    +{formatCurrency(group.interestTotal || 0)}
                  </span>
                </div>
              )}

              {(group.feesTotal || 0) > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>{t("dialog.fees")}</span>
                  </div>
                  <span className="font-medium text-orange-600">
                    +{formatCurrency(group.feesTotal || 0)}
                  </span>
                </div>
              )}

              {group.plan && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("dialog.plan")}
                  </span>
                  <Badge variant="outline">{t(`plans.${group.plan}`)}</Badge>
                </div>
              )}
            </div>

            {group.notes && (
              <Alert>
                <AlertDescription>{group.notes}</AlertDescription>
              </Alert>
            )}

            <div className="border-t" />

            <div>
              <h3 className="mb-3 text-sm font-medium">
                {t("dialog.installmentsList")}
              </h3>
              {isLoading ? (
                <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                  {t("dialog.loading")}
                </div>
              ) : (
                <InstallmentList transactions={transactions} />
              )}
            </div>

            {canceledCount > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {t("dialog.canceledWarning", { count: canceledCount })}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            {pendingCount > 0 && (
              <Button
                variant="destructive"
                onClick={() => setCancelDialogOpen(true)}
                className="w-full sm:w-auto"
              >
                {t("dialog.cancelAll")}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              {t("dialog.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialog.cancelAllTitle")}</DialogTitle>
            <DialogDescription>
              {t("dialog.cancelAllDescription", { count: pendingCount })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              {t("dialog.cancelAllCancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelAll}
              disabled={cancelAllMutation.isPending}
            >
              {t("dialog.cancelAllConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
