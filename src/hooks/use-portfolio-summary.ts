"use client";

import { useMemo } from "react";
import type {
  InvestmentAccount,
  InvestmentTransaction,
  Position,
} from "@/domain/investments/types";

export interface AssetAllocationItem {
  assetType: string;
  assetTypeName: string;
  value: number;
  percentage: number;
  color: string;
  positions: number;
}

export interface AccountAllocationItem {
  accountId: string;
  accountName: string;
  broker: string;
  value: number;
  percentage: number;
  color: string;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalEarnings: number;
  simpleReturn: number;
  simpleReturnPercentage: number;
  assetAllocation: AssetAllocationItem[];
  accountAllocation: AccountAllocationItem[];
  positionsCount: number;
  accountsCount: number;
}

const ASSET_TYPE_COLORS: Record<string, string> = {
  stock: "#3b82f6", // blue
  fii: "#22c55e", // green
  reit: "#14b8a6", // teal
  etf: "#8b5cf6", // violet
  mutual_fund: "#f59e0b", // amber
  bond: "#6366f1", // indigo
  crypto: "#f97316", // orange
  commodity: "#eab308", // yellow
  option: "#ec4899", // pink
  other: "#64748b", // slate
};

const ASSET_TYPE_NAMES: Record<string, string> = {
  stock: "Ações",
  fii: "FIIs",
  reit: "REITs",
  etf: "ETFs",
  mutual_fund: "Fundos",
  bond: "Renda Fixa",
  crypto: "Cripto",
  commodity: "Commodities",
  option: "Opções",
  other: "Outros",
};

const ACCOUNT_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#6366f1", // indigo
  "#eab308", // yellow
  "#64748b", // slate
];

export function usePortfolioSummary(
  positions: Position[],
  accounts: InvestmentAccount[],
  transactions: InvestmentTransaction[],
): PortfolioSummary {
  return useMemo(() => {
    const totalCurrentValue = positions.reduce((sum, pos) => {
      return sum + pos.quantity * pos.averagePrice;
    }, 0);

    const totalInvested = transactions
      .filter((t) => t.transactionType === "buy")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSold = transactions
      .filter((t) => t.transactionType === "sell")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalEarnings = transactions
      .filter((t) =>
        ["dividend", "jcp", "interest"].includes(t.transactionType),
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const simpleReturn =
      totalCurrentValue + totalEarnings + totalSold - totalInvested;
    const simpleReturnPercentage =
      totalInvested > 0 ? (simpleReturn / totalInvested) * 100 : 0;

    const assetTypeMap = new Map<
      string,
      { value: number; positions: number }
    >();
    positions.forEach((pos) => {
      const value = pos.quantity * pos.averagePrice;
      const existing = assetTypeMap.get(pos.assetType) || {
        value: 0,
        positions: 0,
      };
      assetTypeMap.set(pos.assetType, {
        value: existing.value + value,
        positions: existing.positions + 1,
      });
    });

    const assetAllocation: AssetAllocationItem[] = Array.from(
      assetTypeMap.entries(),
    )
      .map(([assetType, data]) => ({
        assetType,
        assetTypeName: ASSET_TYPE_NAMES[assetType] || assetType,
        value: data.value,
        percentage:
          totalCurrentValue > 0 ? (data.value / totalCurrentValue) * 100 : 0,
        color: ASSET_TYPE_COLORS[assetType] || ASSET_TYPE_COLORS.other,
        positions: data.positions,
      }))
      .sort((a, b) => b.value - a.value);

    const accountMap = new Map<string, number>();
    positions.forEach((pos) => {
      const value = pos.quantity * pos.averagePrice;
      const existing = accountMap.get(pos.investmentAccountId) || 0;
      accountMap.set(pos.investmentAccountId, existing + value);
    });

    const accountAllocation: AccountAllocationItem[] = Array.from(
      accountMap.entries(),
    )
      .map(([accountId, value], index) => {
        const account = accounts.find((a) => a.id === accountId);
        return {
          accountId,
          accountName: account?.name || "Conta desconhecida",
          broker: account?.broker || "",
          value,
          percentage:
            totalCurrentValue > 0 ? (value / totalCurrentValue) * 100 : 0,
          color: ACCOUNT_COLORS[index % ACCOUNT_COLORS.length],
        };
      })
      .sort((a, b) => b.value - a.value);

    return {
      totalInvested,
      totalCurrentValue,
      totalEarnings,
      simpleReturn,
      simpleReturnPercentage,
      assetAllocation,
      accountAllocation,
      positionsCount: positions.length,
      accountsCount: accounts.filter((a) => !a.archived).length,
    };
  }, [positions, accounts, transactions]);
}
