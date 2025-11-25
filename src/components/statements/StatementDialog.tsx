"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle,
  CreditCard,
  FileText,
  Lock,
  Package,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { InstallmentGroupDialog } from "@/components/installments/InstallmentGroupDialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InstallmentGroup } from "@/domain/installments";
import type { Statement } from "@/domain/statements";
import { formatStatementMonth, isStatementOverdue } from "@/domain/statements";
import { useInstallmentGroups } from "@/hooks/use-installments";
import {
  useCloseStatement,
  useMarkStatementPaid,
  useStatementTransactions,
} from "@/hooks/use-statements";
import { formatCurrency } from "@/lib/utils";

interface StatementDialogProps {
  statement: Statement;
  accountName?: string;
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

export function StatementDialog({
  statement,
  accountName,
  open,
  onOpenChange,
}: StatementDialogProps) {
  const t = useTranslations("statements");
  const tTrans = useTranslations("transactions");
  const tInstallments = useTranslations("installments");
  const [paymentAmount, setPaymentAmount] = useState(
    statement.totalAmount / 100,
  );
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedInstallmentGroup, setSelectedInstallmentGroup] =
    useState<InstallmentGroup | null>(null);
  const [installmentDialogOpen, setInstallmentDialogOpen] = useState(false);

  const { data: transactions = [], isLoading } = useStatementTransactions(
    statement.id!,
  );
  const { data: installmentGroups = [] } = useInstallmentGroups(
    statement.accountId,
  );
  const closeMutation = useCloseStatement();
  const payMutation = useMarkStatementPaid();

  const relatedInstallmentGroups = useMemo(() => {
    const groupIds = new Set(
      transactions
        .filter((t) => t.installmentGroupId)
        .map((t) => t.installmentGroupId),
    );

    return installmentGroups.filter((g) => groupIds.has(g.id));
  }, [transactions, installmentGroups]);

  const isOverdue = isStatementOverdue(statement);
  const remainingAmount = statement.totalAmount - statement.paidAmount;
  const canClose = statement.status === "open";
  const canPay = statement.status !== "paid" && remainingAmount > 0;

  const handleClose = async () => {
    try {
      await closeMutation.mutateAsync(statement.id!);
      toast.success(t("dialog.closeSuccess"));
    } catch (_error) {
      toast.error(t("dialog.closeError"));
    }
  };

  const handlePay = async () => {
    try {
      const amountInCents = Math.round(paymentAmount * 100);
      await payMutation.mutateAsync({
        id: statement.id!,
        amount: amountInCents,
      });
      toast.success(t("dialog.paySuccess"));
      setShowPaymentForm(false);
    } catch (_error) {
      toast.error(t("dialog.payError"));
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t("dialog.title")} -{" "}
              {formatStatementMonth(statement.statementMonth)}
            </DialogTitle>
            {accountName && (
              <DialogDescription>{accountName}</DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-6">
            {isOverdue && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{t("dialog.overdueAlert")}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4">
                <div className="mb-1 text-xs text-muted-foreground">
                  {t("dialog.total")}
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(statement.totalAmount)}
                </div>
                {statement.previousBalance && statement.previousBalance > 0 && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {t("dialog.includesPrevious")}{" "}
                    {formatCurrency(statement.previousBalance)}
                  </div>
                )}
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-1 text-xs text-muted-foreground">
                  {t("dialog.minimumPayment")}
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(statement.minimumPayment)}
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-1 text-xs text-muted-foreground">
                  {statement.paidAmount > 0
                    ? t("dialog.remaining")
                    : t("dialog.status")}
                </div>
                {statement.paidAmount > 0 ? (
                  <>
                    <div className="text-2xl font-bold">
                      {formatCurrency(remainingAmount)}
                    </div>
                    <div className="mt-1 text-xs text-green-600">
                      {t("dialog.paid")} {formatCurrency(statement.paidAmount)}
                    </div>
                  </>
                ) : (
                  <Badge
                    variant={getStatusVariant(statement.status)}
                    className="text-sm"
                  >
                    {t(`status.${statement.status}`)}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{t("dialog.closingDate")}</span>
                </div>
                <span className="font-medium">
                  {formatDate(statement.closingDate)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{t("dialog.dueDate")}</span>
                </div>
                <span
                  className={`font-medium ${isOverdue ? "text-red-600" : ""}`}
                >
                  {formatDate(statement.dueDate)}
                </span>
              </div>

              {statement.paidDate && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4" />
                    <span>{t("dialog.paidDate")}</span>
                  </div>
                  <span className="font-medium text-green-600">
                    {formatDate(statement.paidDate)}
                  </span>
                </div>
              )}

              {statement.interestAmount && statement.interestAmount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("dialog.interest")}
                  </span>
                  <span className="font-medium text-red-600">
                    +{formatCurrency(statement.interestAmount)}
                  </span>
                </div>
              )}

              {statement.feesAmount && statement.feesAmount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("dialog.fees")}
                  </span>
                  <span className="font-medium text-red-600">
                    +{formatCurrency(statement.feesAmount)}
                  </span>
                </div>
              )}
            </div>

            {statement.notes && (
              <Alert>
                <AlertDescription>{statement.notes}</AlertDescription>
              </Alert>
            )}

            <div className="border-t" />

            <div>
              <h3 className="mb-3 text-sm font-medium">
                {t("dialog.transactions")} ({statement.transactionCount})
              </h3>
              {isLoading ? (
                <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                  {t("dialog.loading")}
                </div>
              ) : transactions.length === 0 ? (
                <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                  {t("dialog.noTransactions")}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{tTrans("table.date")}</TableHead>
                        <TableHead>{tTrans("table.description")}</TableHead>
                        <TableHead className="text-right">
                          {tTrans("table.amount")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="text-sm">
                            {new Date(transaction.date).toLocaleDateString(
                              "pt-BR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                              },
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {transaction.description}
                              </span>
                              {transaction.merchant && (
                                <span className="text-xs text-muted-foreground">
                                  {transaction.merchant}
                                </span>
                              )}
                              {transaction.installmentNumber &&
                                transaction.installmentCount && (
                                  <span className="text-xs text-muted-foreground">
                                    {transaction.installmentNumber}/
                                    {transaction.installmentCount}
                                  </span>
                                )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={
                                transaction.type === "income"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {transaction.type === "income" ? "-" : "+"}
                              {formatCurrency(transaction.amount)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {relatedInstallmentGroups.length > 0 && (
              <>
                <div className="border-t" />
                <div>
                  <h3 className="mb-3 text-sm font-medium">
                    {tInstallments("section.title")} (
                    {relatedInstallmentGroups.length})
                  </h3>
                  <div className="space-y-2">
                    {relatedInstallmentGroups.map((group) => {
                      const groupTransactions = transactions.filter(
                        (t) => t.installmentGroupId === group.id,
                      );
                      const installmentAmount = groupTransactions.reduce(
                        (sum, t) => sum + t.amount,
                        0,
                      );
                      return (
                        <button
                          type="button"
                          key={group.id}
                          onClick={() => {
                            setSelectedInstallmentGroup(group);
                            setInstallmentDialogOpen(true);
                          }}
                          className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {group.merchant ||
                                  tInstallments("card.unknownMerchant")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {groupTransactions.length}{" "}
                                {tInstallments("dialog.of")}{" "}
                                {group.installmentCount}{" "}
                                {tInstallments("dialog.installments")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {formatCurrency(installmentAmount)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {tInstallments("card.progress")}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {showPaymentForm && canPay && (
              <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
                <div className="space-y-2">
                  <Label>{t("dialog.paymentAmount")}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={remainingAmount / 100}
                    value={paymentAmount}
                    onChange={(e) =>
                      setPaymentAmount(parseFloat(e.target.value))
                    }
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setPaymentAmount(statement.minimumPayment / 100)
                      }
                    >
                      {t("dialog.payMinimum")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPaymentAmount(remainingAmount / 100)}
                    >
                      {t("dialog.payFull")}
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentForm(false)}
                    className="flex-1"
                  >
                    {t("dialog.cancelPayment")}
                  </Button>
                  <Button
                    onClick={handlePay}
                    disabled={payMutation.isPending || paymentAmount <= 0}
                    className="flex-1"
                  >
                    {t("dialog.confirmPayment")}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            {canClose && (
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={closeMutation.isPending}
              >
                <Lock className="mr-2 h-4 w-4" />
                {t("dialog.closeStatement")}
              </Button>
            )}
            {canPay && !showPaymentForm && (
              <Button
                onClick={() => setShowPaymentForm(true)}
                className="w-full sm:w-auto"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {t("dialog.markAsPaid")}
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

      {selectedInstallmentGroup && (
        <InstallmentGroupDialog
          group={selectedInstallmentGroup}
          open={installmentDialogOpen}
          onOpenChange={setInstallmentDialogOpen}
        />
      )}
    </>
  );
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
