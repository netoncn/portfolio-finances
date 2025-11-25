import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Statement } from "@/domain/statements";
import type { Transaction } from "@/domain/transactions";

export const statementKeys = {
  all: ["statements"] as const,
  lists: () => [...statementKeys.all, "list"] as const,
  list: (accountId?: string) => [...statementKeys.lists(), accountId] as const,
  details: () => [...statementKeys.all, "detail"] as const,
  detail: (id: string) => [...statementKeys.details(), id] as const,
  byMonth: (accountId: string, month: string) =>
    [...statementKeys.all, "month", accountId, month] as const,
  transactions: (statementId: string) =>
    [...statementKeys.detail(statementId), "transactions"] as const,
};

async function fetchStatements(accountId?: string): Promise<Statement[]> {
  const url = accountId
    ? `/api/statements?accountId=${accountId}`
    : "/api/statements";
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch statements");
  }

  const json = await response.json();
  return json.data;
}

async function fetchStatement(id: string): Promise<Statement> {
  const response = await fetch(`/api/statements/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch statement");
  }

  const json = await response.json();
  return json.data;
}

async function fetchStatementByMonth(
  accountId: string,
  month: string,
): Promise<Statement | null> {
  const response = await fetch(
    `/api/statements?accountId=${accountId}&month=${month}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch statement");
  }

  const json = await response.json();
  return json.data[0] || null;
}

async function fetchStatementTransactions(
  statementId: string,
): Promise<Transaction[]> {
  const response = await fetch(`/api/statements/${statementId}/transactions`);

  if (!response.ok) {
    throw new Error("Failed to fetch statement transactions");
  }

  const json = await response.json();
  return json.data;
}

async function closeStatement(id: string): Promise<Statement> {
  const response = await fetch(`/api/statements/${id}/close`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to close statement");
  }

  const json = await response.json();
  return json.data;
}

async function markStatementPaid(
  id: string,
  paidAmount: number,
): Promise<Statement> {
  const response = await fetch(`/api/statements/${id}/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paidAmount }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to mark statement as paid");
  }

  const json = await response.json();
  return json.data;
}

export function useStatements(accountId?: string) {
  return useQuery({
    queryKey: statementKeys.list(accountId),
    queryFn: () => fetchStatements(accountId),
  });
}

export function useStatement(id: string) {
  return useQuery({
    queryKey: statementKeys.detail(id),
    queryFn: () => fetchStatement(id),
    enabled: !!id,
  });
}

export function useStatementByMonth(accountId: string, month: string) {
  return useQuery({
    queryKey: statementKeys.byMonth(accountId, month),
    queryFn: () => fetchStatementByMonth(accountId, month),
    enabled: !!accountId && !!month,
  });
}

export function useStatementTransactions(statementId: string) {
  return useQuery({
    queryKey: statementKeys.transactions(statementId),
    queryFn: () => fetchStatementTransactions(statementId),
    enabled: !!statementId,
  });
}

export function useCloseStatement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: closeStatement,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: statementKeys.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: statementKeys.lists(),
      });
    },
  });
}

export function useMarkStatementPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      markStatementPaid(id, amount),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: statementKeys.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: statementKeys.lists(),
      });
    },
  });
}
