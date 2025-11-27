"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreatePointsBalanceDTO,
  UpdatePointsBalanceDTO,
} from "@/domain/points/dto/points.dto";
import type { PointsBalance } from "@/domain/points/types/points";

interface PointsBalancesResponse {
  data: PointsBalance[];
}

interface PointsBalanceResponse {
  data: PointsBalance;
}

interface FetchBalancesOptions {
  programId?: string;
  status?: "active" | "all";
  expiringDays?: number;
}

async function fetchPointsBalances(
  options: FetchBalancesOptions = {},
): Promise<PointsBalance[]> {
  const params = new URLSearchParams();

  if (options.programId) {
    params.set("programId", options.programId);
  }
  if (options.status) {
    params.set("status", options.status);
  }
  if (options.expiringDays) {
    params.set("expiringDays", options.expiringDays.toString());
  }

  const response = await fetch(`/api/points-balances?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch points balances");
  }

  const json: PointsBalancesResponse = await response.json();
  return json.data;
}

async function fetchPointsBalance(id: string): Promise<PointsBalance> {
  const response = await fetch(`/api/points-balances/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch points balance");
  }

  const json: PointsBalanceResponse = await response.json();
  return json.data;
}

async function createPointsBalance(
  dto: Omit<CreatePointsBalanceDTO, "userId">,
): Promise<PointsBalance> {
  const response = await fetch("/api/points-balances", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create points balance");
  }

  const json: PointsBalanceResponse = await response.json();
  return json.data;
}

async function updatePointsBalance(
  dto: Omit<UpdatePointsBalanceDTO, "userId">,
): Promise<PointsBalance> {
  const { id, ...data } = dto;
  const response = await fetch(`/api/points-balances/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update points balance");
  }

  const json: PointsBalanceResponse = await response.json();
  return json.data;
}

async function deletePointsBalance(id: string): Promise<void> {
  const response = await fetch(`/api/points-balances/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete points balance");
  }
}

async function redeemPointsBalance(id: string): Promise<void> {
  const response = await fetch(`/api/points-balances/${id}/redeem`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to redeem points balance");
  }
}

async function expirePointsBalance(id: string): Promise<void> {
  const response = await fetch(`/api/points-balances/${id}/expire`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to expire points balance");
  }
}

export function usePointsBalances(options: FetchBalancesOptions = {}) {
  return useQuery({
    queryKey: ["points-balances", options],
    queryFn: () => fetchPointsBalances(options),
  });
}

export function usePointsBalancesExpiringSoon(days: number) {
  return useQuery({
    queryKey: ["points-balances", "expiring", days],
    queryFn: () => fetchPointsBalances({ expiringDays: days }),
  });
}

export function usePointsBalance(id: string) {
  return useQuery({
    queryKey: ["points-balances", id],
    queryFn: () => fetchPointsBalance(id),
    enabled: !!id,
  });
}

export function useCreatePointsBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPointsBalance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["points-balances"] });
    },
  });
}

export function useUpdatePointsBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePointsBalance,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["points-balances"] });
      queryClient.invalidateQueries({ queryKey: ["points-balances", data.id] });
    },
  });
}

export function useDeletePointsBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePointsBalance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["points-balances"] });
    },
  });
}

export function useRedeemPointsBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: redeemPointsBalance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["points-balances"] });
    },
  });
}

export function useExpirePointsBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expirePointsBalance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["points-balances"] });
    },
  });
}
