"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateInvestmentTransactionDTO,
  UpdateInvestmentTransactionDTO,
} from "@/domain/investments/dto/investment.dto";
import type { InvestmentTransaction } from "@/domain/investments/types";

interface InvestmentTransactionsResponse {
  data: InvestmentTransaction[];
}

interface InvestmentTransactionResponse {
  data: InvestmentTransaction;
}

interface UseInvestmentTransactionsOptions {
  accountId?: string;
  positionId?: string;
  ticker?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
}

async function fetchInvestmentTransactions(
  options: UseInvestmentTransactionsOptions = {},
): Promise<InvestmentTransaction[]> {
  const params = new URLSearchParams();

  if (options.accountId) params.set("accountId", options.accountId);
  if (options.positionId) params.set("positionId", options.positionId);
  if (options.ticker) params.set("ticker", options.ticker);
  if (options.startDate) params.set("startDate", options.startDate.toString());
  if (options.endDate) params.set("endDate", options.endDate.toString());
  if (options.limit) params.set("limit", options.limit.toString());

  const response = await fetch(
    `/api/investment-transactions?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch investment transactions");
  }

  const json: InvestmentTransactionsResponse = await response.json();
  return json.data;
}

async function fetchInvestmentTransaction(
  id: string,
): Promise<InvestmentTransaction> {
  const response = await fetch(`/api/investment-transactions/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch investment transaction");
  }

  const json: InvestmentTransactionResponse = await response.json();
  return json.data;
}

async function createInvestmentTransaction(
  dto: Omit<CreateInvestmentTransactionDTO, "userId">,
): Promise<InvestmentTransaction> {
  const response = await fetch("/api/investment-transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create investment transaction");
  }

  const json: InvestmentTransactionResponse = await response.json();
  return json.data;
}

async function updateInvestmentTransaction(
  dto: Omit<UpdateInvestmentTransactionDTO, "userId">,
): Promise<InvestmentTransaction> {
  const { id, ...data } = dto;
  const response = await fetch(`/api/investment-transactions/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update investment transaction");
  }

  const json: InvestmentTransactionResponse = await response.json();
  return json.data;
}

async function deleteInvestmentTransaction(id: string): Promise<void> {
  const response = await fetch(`/api/investment-transactions/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete investment transaction");
  }
}

export function useInvestmentTransactions(
  options: UseInvestmentTransactionsOptions = {},
) {
  return useQuery({
    queryKey: ["investmentTransactions", options],
    queryFn: () => fetchInvestmentTransactions(options),
  });
}

export function useInvestmentTransaction(id: string) {
  return useQuery({
    queryKey: ["investmentTransactions", id],
    queryFn: () => fetchInvestmentTransaction(id),
    enabled: !!id,
  });
}

export function useCreateInvestmentTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInvestmentTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investmentTransactions"] });
    },
  });
}

export function useUpdateInvestmentTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateInvestmentTransaction,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["investmentTransactions"] });
      queryClient.invalidateQueries({
        queryKey: ["investmentTransactions", data.id],
      });
    },
  });
}

export function useDeleteInvestmentTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteInvestmentTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investmentTransactions"] });
    },
  });
}
