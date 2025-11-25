import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateTransactionDTO,
  Transaction,
  UpdateTransactionDTO,
} from "@/domain/transactions";

export const transactionKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
  list: (filters?: TransactionFilters) =>
    [...transactionKeys.lists(), filters] as const,
  details: () => [...transactionKeys.all, "detail"] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
};

export interface TransactionFilters {
  accountId?: string;
  accountType?: string;
  cardBrand?: string;
}

async function fetchTransactions(
  filters?: TransactionFilters,
): Promise<Transaction[]> {
  const params = new URLSearchParams();

  if (filters?.accountId) {
    params.append("accountId", filters.accountId);
  }
  if (filters?.accountType) {
    params.append("accountType", filters.accountType);
  }
  if (filters?.cardBrand) {
    params.append("cardBrand", filters.cardBrand);
  }

  const url = `/api/transactions${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch transactions");
  }

  const json = await response.json();
  return json.data;
}

async function fetchTransaction(id: string): Promise<Transaction> {
  const response = await fetch(`/api/transactions/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch transaction");
  }

  const json = await response.json();
  return json.data;
}

async function createTransaction(
  data: Omit<CreateTransactionDTO, "userId">,
): Promise<Transaction> {
  const response = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create transaction");
  }

  const json = await response.json();
  return json.data;
}

async function updateTransaction(
  data: Omit<UpdateTransactionDTO, "userId">,
): Promise<Transaction> {
  const { id, ...updateData } = data;
  const response = await fetch(`/api/transactions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update transaction");
  }

  const json = await response.json();
  return json.data;
}

async function deleteTransaction(id: string): Promise<void> {
  const response = await fetch(`/api/transactions/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete transaction");
  }
}

export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => fetchTransactions(filters),
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => fetchTransaction(id),
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: transactionKeys.lists(),
      });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTransaction,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: transactionKeys.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: transactionKeys.lists(),
      });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: transactionKeys.lists(),
      });
    },
  });
}
