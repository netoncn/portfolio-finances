import { useQuery } from "@tanstack/react-query";
import type { BudgetAlert, BudgetAlertLevel } from "@/domain/budgets";

interface BudgetAlertsResponse {
  alerts: BudgetAlert[];
  counts: Record<BudgetAlertLevel, number>;
  hasCritical: boolean;
  total: number;
}

async function fetchBudgetAlerts(): Promise<BudgetAlertsResponse> {
  const response = await fetch("/api/budgets/alerts");

  if (!response.ok) {
    throw new Error("Failed to fetch budget alerts");
  }

  const json = await response.json();
  return json.data;
}

export function useBudgetAlerts() {
  return useQuery({
    queryKey: ["budget-alerts"],
    queryFn: fetchBudgetAlerts,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // Refetch every 10 minutes
  });
}
