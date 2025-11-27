"use client";

import { useQuery } from "@tanstack/react-query";
import type { MonthlyInsights } from "@/domain/insights/types/insight";

interface InsightsResponse {
  success: boolean;
  data: MonthlyInsights;
}

async function fetchInsights(month: string): Promise<MonthlyInsights> {
  const response = await fetch(`/api/insights/${month}`);

  if (!response.ok) {
    throw new Error("Failed to fetch insights");
  }

  const json: InsightsResponse = await response.json();
  return json.data;
}

export function useInsights(month: string) {
  return useQuery({
    queryKey: ["insights", month],
    queryFn: () => fetchInsights(month),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!month && /^\d{4}-\d{2}$/.test(month),
  });
}

export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getPreviousMonth(month: string): string {
  const [year, monthNum] = month.split("-").map(Number);
  const date = new Date(year, monthNum - 1);
  date.setMonth(date.getMonth() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonth(month: string): string {
  const [year, monthNum] = month.split("-");
  const date = new Date(Number(year), Number(monthNum) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
