"use client";

import { FileUp, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ImportDialog } from "@/components/import/ImportDialog";
import { InstallmentGroupsSection } from "@/components/installments/InstallmentGroupsSection";
import { TransactionFilters as Filters } from "@/components/transactions/TransactionFilters";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { Button } from "@/components/ui/button";
import {
  type TransactionFilters,
  useTransactions,
} from "@/hooks/use-transactions";

export default function TransactionsPage() {
  const t = useTranslations("transactions");
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const {
    data: transactions = [],
    isLoading,
    error,
  } = useTransactions(filters);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <FileUp className="mr-2 h-4 w-4" />
            {t("actions.import")}
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("actions.new")}
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Filters filters={filters} onFiltersChange={setFilters} />
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
          {t("error")}
        </div>
      )}

      <TransactionsTable transactions={transactions} isLoading={isLoading} />

      {!isLoading && transactions.length > 0 && (
        <div className="mt-4 flex justify-between text-sm text-muted-foreground">
          <span>{t("summary.total", { count: transactions.length })}</span>
        </div>
      )}

      <div className="mt-12">
        <InstallmentGroupsSection />
      </div>

      <TransactionForm open={formOpen} onOpenChange={setFormOpen} />

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
