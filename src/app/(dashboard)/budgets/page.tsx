"use client";

import { Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { BudgetsTable } from "@/components/budgets/BudgetsTable";
import { ExportButton } from "@/components/export/ExportButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Budget } from "@/domain/budgets/types/budget";
import { useBudgets, useDeleteBudget } from "@/hooks/use-budgets";
import { budgetColumns } from "@/lib/export/columns";
import { formatCurrency } from "@/lib/utils";

const BudgetFormDialog = dynamic(
  () =>
    import("@/components/budgets/BudgetFormDialog").then(
      (mod) => mod.BudgetFormDialog,
    ),
  { ssr: false },
);

export default function BudgetsPage() {
  const t = useTranslations("budgets");
  const tCommon = useTranslations("common");
  const { data: budgets = [], isLoading, error } = useBudgets();
  const deleteMutation = useDeleteBudget();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | undefined>();
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | undefined>();
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");

  const handleCreateBudget = () => {
    setSelectedBudget(undefined);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleBudgetClick = (budget: Budget) => {
    setSelectedBudget(budget);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDeleteClick = (budget: Budget) => {
    setBudgetToDelete(budget);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!budgetToDelete) return;

    try {
      await deleteMutation.mutateAsync(budgetToDelete.id);
      toast.success(t("form.messages.deleteSuccess"));
      setDeleteDialogOpen(false);
      setBudgetToDelete(undefined);
    } catch (_error) {
      toast.error(t("form.messages.deleteError"));
    }
  };

  const activeBudgets = budgets.filter((b) => b.status === "active");
  const totalBudgeted = activeBudgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = activeBudgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;
  const overBudgetCount = activeBudgets.filter(
    (b) => b.spent > b.amount,
  ).length;

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-destructive mb-2">
              {tCommon("error")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : tCommon("error")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t("title")}
            </h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>
          <div className="flex gap-2">
            <ExportButton
              data={budgets}
              columns={budgetColumns}
              filename="orcamentos"
              module="budgets"
              disabled={isLoading}
            />
            <Button size="lg" onClick={handleCreateBudget}>
              <Plus className="size-4" />
              {t("actions.new")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-border rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t("stats.totalBudgeted")}
                </p>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(totalBudgeted)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t("stats.totalSpent")}
                </p>
                <p className="text-3xl font-bold text-finance-loss">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t("stats.remaining")}
                </p>
                <p
                  className={`text-3xl font-bold ${
                    totalRemaining < 0
                      ? "text-finance-loss"
                      : "text-finance-gain"
                  }`}
                >
                  {formatCurrency(totalRemaining)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t("stats.overBudget")}
                </p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {overBudgetCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        <BudgetsTable
          budgets={budgets}
          isLoading={isLoading}
          onBudgetClick={handleBudgetClick}
          onDeleteClick={handleDeleteClick}
        />

        <BudgetFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          budget={selectedBudget}
          mode={dialogMode}
        />

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("deleteDialog.title")}</DialogTitle>
              <DialogDescription>
                {t("deleteDialog.description")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                {t("deleteDialog.cancel")}
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                {t("deleteDialog.confirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
