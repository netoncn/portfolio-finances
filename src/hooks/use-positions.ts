"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreatePositionDTO,
  UpdatePositionDTO,
} from "@/domain/investments/dto/investment.dto";
import type { Position } from "@/domain/investments/types";

interface PositionsResponse {
  data: Position[];
}

interface PositionResponse {
  data: Position;
}

interface UsePositionsOptions {
  accountId?: string;
}

async function fetchPositions(
  options: UsePositionsOptions = {},
): Promise<Position[]> {
  const params = new URLSearchParams();

  if (options.accountId) params.set("accountId", options.accountId);

  const response = await fetch(`/api/positions?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch positions");
  }

  const json: PositionsResponse = await response.json();
  return json.data;
}

async function fetchPosition(id: string): Promise<Position> {
  const response = await fetch(`/api/positions/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch position");
  }

  const json: PositionResponse = await response.json();
  return json.data;
}

async function createPosition(
  dto: Omit<CreatePositionDTO, "userId">,
): Promise<Position> {
  const response = await fetch("/api/positions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create position");
  }

  const json: PositionResponse = await response.json();
  return json.data;
}

async function updatePosition(
  dto: Omit<UpdatePositionDTO, "userId">,
): Promise<Position> {
  const { id, ...data } = dto;
  const response = await fetch(`/api/positions/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update position");
  }

  const json: PositionResponse = await response.json();
  return json.data;
}

async function deletePosition(id: string): Promise<void> {
  const response = await fetch(`/api/positions/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete position");
  }
}

export function usePositions(options: UsePositionsOptions = {}) {
  return useQuery({
    queryKey: ["positions", options],
    queryFn: () => fetchPositions(options),
  });
}

export function usePosition(id: string) {
  return useQuery({
    queryKey: ["positions", id],
    queryFn: () => fetchPosition(id),
    enabled: !!id,
  });
}

export function useCreatePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
    },
  });
}

export function useUpdatePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePosition,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({
        queryKey: ["positions", data.id],
      });
    },
  });
}

export function useDeletePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
    },
  });
}
