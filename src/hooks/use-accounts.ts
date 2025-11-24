"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateAccountDTO,
  UpdateAccountDTO,
} from "@/domain/accounts/dto/account.dto";
import type { Account } from "@/domain/accounts/types/account";

interface AccountsResponse {
  data: Account[];
}

interface AccountResponse {
  data: Account;
}

async function fetchAccounts(includeArchived = false): Promise<Account[]> {
  const params = new URLSearchParams();
  if (includeArchived) {
    params.set("includeArchived", "true");
  }

  const response = await fetch(`/api/accounts?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch accounts");
  }

  const json: AccountsResponse = await response.json();
  return json.data;
}

async function fetchAccount(id: string): Promise<Account> {
  const response = await fetch(`/api/accounts/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch account");
  }

  const json: AccountResponse = await response.json();
  return json.data;
}

async function createAccount(
  dto: Omit<CreateAccountDTO, "userId">,
): Promise<Account> {
  const response = await fetch("/api/accounts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create account");
  }

  const json: AccountResponse = await response.json();
  return json.data;
}

async function updateAccount(
  dto: Omit<UpdateAccountDTO, "userId">,
): Promise<Account> {
  const { id, ...data } = dto;
  const response = await fetch(`/api/accounts/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update account");
  }

  const json: AccountResponse = await response.json();
  return json.data;
}

async function archiveAccount(id: string): Promise<void> {
  const response = await fetch(`/api/accounts/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to archive account");
  }
}

async function unarchiveAccount(id: string): Promise<void> {
  const response = await fetch(`/api/accounts/${id}/unarchive`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to unarchive account");
  }
}

export function useAccounts(includeArchived = false) {
  return useQuery({
    queryKey: ["accounts", includeArchived],
    queryFn: () => fetchAccounts(includeArchived),
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: ["accounts", id],
    queryFn: () => fetchAccount(id),
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAccount,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["accounts", data.id] });
    },
  });
}

export function useArchiveAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useUnarchiveAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unarchiveAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
