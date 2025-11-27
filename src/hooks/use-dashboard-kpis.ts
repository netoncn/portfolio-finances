import { useQuery } from "@tanstack/react-query";
import type { DashboardKPIs } from "@/domain/dashboard";

async function fetchDashboardKPIs(
  startDate: number,
  endDate: number,
): Promise<DashboardKPIs> {
  const response = await fetch(
    `/api/dashboard/kpis?startDate=${startDate}&endDate=${endDate}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard KPIs");
  }

  const json = await response.json();
  return json.data;
}

export function useDashboardKPIs(startDate: number, endDate: number) {
  return useQuery({
    queryKey: ["dashboard-kpis", startDate, endDate],
    queryFn: () => fetchDashboardKPIs(startDate, endDate),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (previously cacheTime)
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
  });
}
