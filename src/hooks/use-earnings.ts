"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateEarningDTO,
  UpdateEarningDTO,
} from "@/domain/investments/dto/investment.dto";
import type { Earning } from "@/domain/investments/types";

interface EarningsResponse {
  data: Earning[];
}

interface EarningResponse {
  data: Earning;
}

interface UseEarningsOptions {
  accountId?: string;
  positionId?: string;
  ticker?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
}

async function fetchEarnings(
  options: UseEarningsOptions = {},
): Promise<Earning[]> {
  const params = new URLSearchParams();

  if (options.accountId) params.set("accountId", options.accountId);
  if (options.positionId) params.set("positionId", options.positionId);
  if (options.ticker) params.set("ticker", options.ticker);
  if (options.startDate) params.set("startDate", options.startDate.toString());
  if (options.endDate) params.set("endDate", options.endDate.toString());
  if (options.limit) params.set("limit", options.limit.toString());

  const response = await fetch(`/api/earnings?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch earnings");
  }

  const json: EarningsResponse = await response.json();
  return json.data;
}

async function fetchEarning(id: string): Promise<Earning> {
  const response = await fetch(`/api/earnings/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch earning");
  }

  const json: EarningResponse = await response.json();
  return json.data;
}

async function createEarning(
  dto: Omit<CreateEarningDTO, "userId">,
): Promise<Earning> {
  const response = await fetch("/api/earnings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create earning");
  }

  const json: EarningResponse = await response.json();
  return json.data;
}

async function updateEarning(
  dto: Omit<UpdateEarningDTO, "userId">,
): Promise<Earning> {
  const { id, ...data } = dto;
  const response = await fetch(`/api/earnings/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update earning");
  }

  const json: EarningResponse = await response.json();
  return json.data;
}

async function deleteEarning(id: string): Promise<void> {
  const response = await fetch(`/api/earnings/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete earning");
  }
}

export function useEarnings(options: UseEarningsOptions = {}) {
  return useQuery({
    queryKey: ["earnings", options],
    queryFn: () => fetchEarnings(options),
  });
}

export function useEarning(id: string) {
  return useQuery({
    queryKey: ["earnings", id],
    queryFn: () => fetchEarning(id),
    enabled: !!id,
  });
}

export function useCreateEarning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEarning,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["earnings"] });
    },
  });
}

export function useUpdateEarning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEarning,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["earnings"] });
      queryClient.invalidateQueries({ queryKey: ["earnings", data.id] });
    },
  });
}

export function useDeleteEarning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEarning,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["earnings"] });
    },
  });
}
