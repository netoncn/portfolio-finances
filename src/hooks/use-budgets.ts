"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateBudgetDTO,
  UpdateBudgetDTO,
} from "@/domain/budgets/dto/budget.dto";
import type { Budget, BudgetPeriod } from "@/domain/budgets/types/budget";

interface BudgetsResponse {
  data: Budget[];
}

interface BudgetResponse {
  data: Budget;
}

async function fetchBudgets(
  period?: BudgetPeriod,
  activeOnly?: boolean,
): Promise<Budget[]> {
  const params = new URLSearchParams();
  if (period) {
    params.set("period", period);
  }
  if (activeOnly) {
    params.set("activeOnly", "true");
  }

  const response = await fetch(`/api/budgets?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch budgets");
  }

  const json: BudgetsResponse = await response.json();
  return json.data;
}

async function fetchBudget(id: string): Promise<Budget> {
  const response = await fetch(`/api/budgets/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch budget");
  }

  const json: BudgetResponse = await response.json();
  return json.data;
}

async function createBudget(
  dto: Omit<CreateBudgetDTO, "userId">,
): Promise<Budget> {
  console.log("[useBudgets] createBudget called with:", dto);

  const response = await fetch("/api/budgets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  console.log("[useBudgets] Response status:", response.status);

  if (!response.ok) {
    const error = await response.json();
    console.error("[useBudgets] Error response:", error);
    throw new Error(error.error || "Failed to create budget");
  }

  const json: BudgetResponse = await response.json();
  console.log("[useBudgets] Budget created:", json.data);
  return json.data;
}

async function updateBudget(
  dto: Omit<UpdateBudgetDTO, "userId">,
): Promise<Budget> {
  const { id, ...data } = dto;
  const response = await fetch(`/api/budgets/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update budget");
  }

  const json: BudgetResponse = await response.json();
  return json.data;
}

async function deleteBudget(id: string): Promise<void> {
  const response = await fetch(`/api/budgets/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete budget");
  }
}

export function useBudgets(period?: BudgetPeriod, activeOnly?: boolean) {
  return useQuery({
    queryKey: ["budgets", period, activeOnly],
    queryFn: () => fetchBudgets(period, activeOnly),
  });
}

export function useBudget(id: string) {
  return useQuery({
    queryKey: ["budgets", id],
    queryFn: () => fetchBudget(id),
    enabled: !!id,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBudget,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budgets", data.id] });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}
