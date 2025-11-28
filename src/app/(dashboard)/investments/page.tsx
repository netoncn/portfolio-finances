"use client";

import { Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ExportButton } from "@/components/export/ExportButton";
import { InvestmentAccountsList } from "@/components/investments/InvestmentAccountsList";
import { InvestmentsDashboard } from "@/components/investments/InvestmentsDashboard";
import { InvestmentTransactionsList } from "@/components/investments/InvestmentTransactionsList";
import { useInvestmentAccounts } from "@/hooks/use-investment-accounts";
import { useInvestmentTransactions } from "@/hooks/use-investment-transactions";
import { usePositions } from "@/hooks/use-positions";
import { investmentAccountColumns } from "@/lib/export/columns";

export default function InvestmentsPage() {
  const t = useTranslations("investments");
  const tCommon = useTranslations("common");
  const [includeArchived, _setIncludeArchived] = useState(false);
  const {
    data: accounts = [],
    isLoading,
    error,
  } = useInvestmentAccounts(includeArchived);

  const { data: transactions = [], isLoading: transactionsLoading } =
    useInvestmentTransactions({ limit: 50 });

  const { data: positions = [], isLoading: positionsLoading } = usePositions();

  const isDataLoading = isLoading || transactionsLoading || positionsLoading;

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
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Building2 className="h-8 w-8" />
              {tCommon("investments")}
            </h1>
            <p className="text-muted-foreground">
              {t("accounts.list.description")}
            </p>
          </div>
          <ExportButton
            data={accounts}
            columns={investmentAccountColumns}
            filename="investimentos"
            module="investments"
            disabled={isDataLoading}
          />
        </div>

        <InvestmentsDashboard
          positions={positions}
          accounts={accounts}
          transactions={transactions}
          isLoading={isDataLoading}
        />

        <div className="mt-8">
          <InvestmentAccountsList accounts={accounts} isLoading={isLoading} />
        </div>

        <div className="mt-8">
          <InvestmentTransactionsList
            transactions={transactions}
            accounts={accounts}
            isLoading={transactionsLoading}
          />
        </div>
      </div>
    </div>
  );
}
