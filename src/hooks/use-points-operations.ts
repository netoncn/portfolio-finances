"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreatePointsOperationDTO,
  UpdatePointsOperationDTO,
} from "@/domain/points/dto/points.dto";
import type { PointsOperation } from "@/domain/points/types/points";

interface PointsOperationsResponse {
  data: PointsOperation[];
}

interface PointsOperationResponse {
  data: PointsOperation;
}

interface FetchOperationsOptions {
  programId?: string;
  type?: "earn" | "redeem" | "transfer_in" | "transfer_out" | "adjust";
  startDate?: number;
  endDate?: number;
}

async function fetchPointsOperations(
  options: FetchOperationsOptions = {},
): Promise<PointsOperation[]> {
  const params = new URLSearchParams();

  if (options.programId) {
    params.set("programId", options.programId);
  }
  if (options.type) {
    params.set("type", options.type);
  }
  if (options.startDate) {
    params.set("startDate", options.startDate.toString());
  }
  if (options.endDate) {
    params.set("endDate", options.endDate.toString());
  }

  const response = await fetch(`/api/points-operations?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch points operations");
  }

  const json: PointsOperationsResponse = await response.json();
  return json.data;
}

async function fetchPointsOperation(id: string): Promise<PointsOperation> {
  const response = await fetch(`/api/points-operations/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch points operation");
  }

  const json: PointsOperationResponse = await response.json();
  return json.data;
}

async function createPointsOperation(
  dto: Omit<CreatePointsOperationDTO, "userId">,
): Promise<PointsOperation> {
  const response = await fetch("/api/points-operations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create points operation");
  }

  const json: PointsOperationResponse = await response.json();
  return json.data;
}

async function updatePointsOperation(
  dto: Omit<UpdatePointsOperationDTO, "userId">,
): Promise<PointsOperation> {
  const { id, ...data } = dto;
  const response = await fetch(`/api/points-operations/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update points operation");
  }

  const json: PointsOperationResponse = await response.json();
  return json.data;
}

async function deletePointsOperation(id: string): Promise<void> {
  const response = await fetch(`/api/points-operations/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete points operation");
  }
}

export function usePointsOperations(options: FetchOperationsOptions = {}) {
  return useQuery({
    queryKey: ["points-operations", options],
    queryFn: () => fetchPointsOperations(options),
  });
}

export function usePointsOperation(id: string) {
  return useQuery({
    queryKey: ["points-operations", id],
    queryFn: () => fetchPointsOperation(id),
    enabled: !!id,
  });
}

export function useCreatePointsOperation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPointsOperation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["points-operations"] });
      queryClient.invalidateQueries({ queryKey: ["points-balances"] });
    },
  });
}

export function useUpdatePointsOperation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePointsOperation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["points-operations"] });
      queryClient.invalidateQueries({
        queryKey: ["points-operations", data.id],
      });
      queryClient.invalidateQueries({ queryKey: ["points-balances"] });
    },
  });
}

export function useDeletePointsOperation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePointsOperation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["points-operations"] });
      queryClient.invalidateQueries({ queryKey: ["points-balances"] });
    },
  });
}
