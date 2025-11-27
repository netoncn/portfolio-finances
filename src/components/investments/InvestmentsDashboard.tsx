"use client";

import { useTranslations } from "next-intl";
import type {
  InvestmentAccount,
  InvestmentTransaction,
  Position,
} from "@/domain/investments/types";
import { usePortfolioSummary } from "@/hooks/use-portfolio-summary";
import { AccountAllocationChart } from "./AccountAllocationChart";
import { AssetAllocationChart } from "./AssetAllocationChart";
import { PortfolioSummaryCards } from "./PortfolioSummaryCards";

interface InvestmentsDashboardProps {
  positions: Position[];
  accounts: InvestmentAccount[];
  transactions: InvestmentTransaction[];
  isLoading?: boolean;
}

export function InvestmentsDashboard({
  positions,
  accounts,
  transactions,
  isLoading = false,
}: InvestmentsDashboardProps) {
  const t = useTranslations("investments.dashboard");

  const portfolioSummary = usePortfolioSummary(
    positions,
    accounts,
    transactions,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">{t("title")}</h2>
        <PortfolioSummaryCards
          summary={portfolioSummary}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AssetAllocationChart
          data={portfolioSummary.assetAllocation}
          isLoading={isLoading}
        />
        <AccountAllocationChart
          data={portfolioSummary.accountAllocation}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
