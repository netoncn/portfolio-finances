import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { PeriodType } from "@/components/dashboard/PeriodFilter";
import type { Transaction } from "@/domain/transactions";

interface DashboardMetrics {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  trends: {
    income: number;
    expense: number;
    balance: number;
  };
}

function getPeriodRange(period: PeriodType): { start: number; end: number } {
  const now = new Date();
  const end = now.getTime();
  let start: number;

  switch (period) {
    case "current_month": {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      start = startOfMonth.getTime();
      break;
    }
    case "last_30_days": {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      start = thirtyDaysAgo.getTime();
      break;
    }
    case "last_90_days": {
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(now.getDate() - 90);
      start = ninetyDaysAgo.getTime();
      break;
    }
    case "current_year": {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      start = startOfYear.getTime();
      break;
    }
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  }

  return { start, end };
}

function getPreviousPeriodRange(period: PeriodType): {
  start: number;
  end: number;
} {
  const currentRange = getPeriodRange(period);
  const duration = currentRange.end - currentRange.start;

  return {
    start: currentRange.start - duration,
    end: currentRange.start,
  };
}

function calculateMetrics(
  transactions: Transaction[],
): Omit<DashboardMetrics, "trends"> {
  const income = transactions
    .filter((t) => t.type === "income" && t.status !== "canceled")
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter((t) => t.type === "expense" && t.status !== "canceled")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    totalIncome: income,
    totalExpense: expense,
    balance: income - expense,
    transactionCount: transactions.filter((t) => t.status !== "canceled")
      .length,
  };
}

async function fetchTransactions(
  startDate: number,
  endDate: number,
): Promise<Transaction[]> {
  const response = await fetch(
    `/api/transactions?startDate=${startDate}&endDate=${endDate}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch transactions");
  }

  const json = await response.json();
  return json.data || [];
}

export function useDashboardMetrics(period: PeriodType = "current_month") {
  const currentRange = useMemo(() => getPeriodRange(period), [period]);
  const previousRange = useMemo(() => getPreviousPeriodRange(period), [period]);

  const {
    data: currentTransactions = [],
    isLoading: isLoadingCurrent,
    error: errorCurrent,
  } = useQuery({
    queryKey: [
      "dashboard-metrics",
      "current",
      currentRange.start,
      currentRange.end,
    ],
    queryFn: () => fetchTransactions(currentRange.start, currentRange.end),
  });

  const { data: previousTransactions = [], isLoading: isLoadingPrevious } =
    useQuery({
      queryKey: [
        "dashboard-metrics",
        "previous",
        previousRange.start,
        previousRange.end,
      ],
      queryFn: () => fetchTransactions(previousRange.start, previousRange.end),
    });

  const metrics = useMemo<DashboardMetrics>(() => {
    const current = calculateMetrics(currentTransactions);
    const previous = calculateMetrics(previousTransactions);

    const trends = {
      income:
        previous.totalIncome > 0
          ? ((current.totalIncome - previous.totalIncome) /
              previous.totalIncome) *
            100
          : 0,
      expense:
        previous.totalExpense > 0
          ? ((current.totalExpense - previous.totalExpense) /
              previous.totalExpense) *
            100
          : 0,
      balance:
        previous.balance !== 0
          ? ((current.balance - previous.balance) /
              Math.abs(previous.balance)) *
            100
          : 0,
    };

    return {
      ...current,
      trends,
    };
  }, [currentTransactions, previousTransactions]);

  return {
    metrics,
    isLoading: isLoadingCurrent || isLoadingPrevious,
    error: errorCurrent,
  };
}
