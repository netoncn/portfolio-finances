import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InstallmentGroup } from "@/domain/installments";
import type { Transaction } from "@/domain/transactions";

export const installmentKeys = {
  all: ["installments"] as const,
  groups: (accountId?: string) =>
    accountId
      ? ([...installmentKeys.all, "groups", accountId] as const)
      : ([...installmentKeys.all, "groups"] as const),
  group: (id: string) => [...installmentKeys.all, "group", id] as const,
  groupTransactions: (id: string) =>
    [...installmentKeys.group(id), "transactions"] as const,
};

async function fetchInstallmentGroups(
  accountId?: string,
): Promise<InstallmentGroup[]> {
  const url = accountId
    ? `/api/installments/groups?accountId=${accountId}`
    : "/api/installments/groups";
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch installment groups");
  }

  const json = await response.json();
  return json.data;
}

async function fetchInstallmentGroup(id: string): Promise<InstallmentGroup> {
  const response = await fetch(`/api/installments/groups/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch installment group");
  }

  const json = await response.json();
  return json.data;
}

async function fetchInstallmentTransactions(
  groupId: string,
): Promise<Transaction[]> {
  const response = await fetch(
    `/api/transactions?installmentGroupId=${groupId}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch installment transactions");
  }

  const json = await response.json();
  return json.data;
}

async function markInstallmentPaid(transactionId: string): Promise<void> {
  const response = await fetch(`/api/transactions/${transactionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "paid" }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to mark installment as paid");
  }
}

async function cancelInstallment(transactionId: string): Promise<void> {
  const response = await fetch(`/api/transactions/${transactionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "canceled" }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to cancel installment");
  }
}

async function cancelAllInstallments(groupId: string): Promise<void> {
  const response = await fetch(`/api/installments/groups/${groupId}/cancel`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to cancel installments");
  }
}

export function useInstallmentGroups(accountId?: string) {
  return useQuery({
    queryKey: installmentKeys.groups(accountId),
    queryFn: () => fetchInstallmentGroups(accountId),
  });
}

export function useInstallmentGroup(id: string) {
  return useQuery({
    queryKey: installmentKeys.group(id),
    queryFn: () => fetchInstallmentGroup(id),
    enabled: !!id,
  });
}

export function useInstallmentTransactions(groupId: string) {
  return useQuery({
    queryKey: installmentKeys.groupTransactions(groupId),
    queryFn: () => fetchInstallmentTransactions(groupId),
    enabled: !!groupId,
  });
}

export function useMarkInstallmentPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markInstallmentPaid,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: installmentKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: ["transactions"],
      });
    },
  });
}

export function useCancelInstallment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelInstallment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: installmentKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: ["transactions"],
      });
    },
  });
}

export function useCancelAllInstallments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelAllInstallments,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: installmentKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: ["transactions"],
      });
    },
  });
}
