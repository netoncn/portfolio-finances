"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateInvestmentAccountDTO,
  UpdateInvestmentAccountDTO,
} from "@/domain/investments/dto/investment.dto";
import type { InvestmentAccount } from "@/domain/investments/types";

interface InvestmentAccountsResponse {
  data: InvestmentAccount[];
}

interface InvestmentAccountResponse {
  data: InvestmentAccount;
}

async function fetchInvestmentAccounts(
  includeArchived = false,
): Promise<InvestmentAccount[]> {
  const params = new URLSearchParams();
  if (includeArchived) {
    params.set("includeArchived", "true");
  }

  const response = await fetch(`/api/investment-accounts?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch investment accounts");
  }

  const json: InvestmentAccountsResponse = await response.json();
  return json.data;
}

async function fetchInvestmentAccount(id: string): Promise<InvestmentAccount> {
  const response = await fetch(`/api/investment-accounts/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch investment account");
  }

  const json: InvestmentAccountResponse = await response.json();
  return json.data;
}

async function createInvestmentAccount(
  dto: Omit<CreateInvestmentAccountDTO, "userId">,
): Promise<InvestmentAccount> {
  const response = await fetch("/api/investment-accounts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create investment account");
  }

  const json: InvestmentAccountResponse = await response.json();
  return json.data;
}

async function updateInvestmentAccount(
  dto: Omit<UpdateInvestmentAccountDTO, "userId">,
): Promise<InvestmentAccount> {
  const { id, ...data } = dto;
  const response = await fetch(`/api/investment-accounts/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update investment account");
  }

  const json: InvestmentAccountResponse = await response.json();
  return json.data;
}

async function archiveInvestmentAccount(id: string): Promise<void> {
  const response = await fetch(`/api/investment-accounts/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to archive investment account");
  }
}

async function unarchiveInvestmentAccount(id: string): Promise<void> {
  const response = await fetch(`/api/investment-accounts/${id}/unarchive`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to unarchive investment account");
  }
}

export function useInvestmentAccounts(includeArchived = false) {
  return useQuery({
    queryKey: ["investmentAccounts", includeArchived],
    queryFn: () => fetchInvestmentAccounts(includeArchived),
  });
}

export function useInvestmentAccount(id: string) {
  return useQuery({
    queryKey: ["investmentAccounts", id],
    queryFn: () => fetchInvestmentAccount(id),
    enabled: !!id,
  });
}

export function useCreateInvestmentAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInvestmentAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investmentAccounts"] });
    },
  });
}

export function useUpdateInvestmentAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateInvestmentAccount,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["investmentAccounts"] });
      queryClient.invalidateQueries({
        queryKey: ["investmentAccounts", data.id],
      });
    },
  });
}

export function useArchiveInvestmentAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveInvestmentAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investmentAccounts"] });
    },
  });
}

export function useUnarchiveInvestmentAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unarchiveInvestmentAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investmentAccounts"] });
    },
  });
}
