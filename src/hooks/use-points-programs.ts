"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreatePointsProgramDTO,
  UpdatePointsProgramDTO,
} from "@/domain/points/dto/points.dto";
import type { PointsProgram } from "@/domain/points/types/points";

interface PointsProgramsResponse {
  data: PointsProgram[];
}

interface PointsProgramResponse {
  data: PointsProgram;
}

async function fetchPointsPrograms(): Promise<PointsProgram[]> {
  const response = await fetch("/api/points-programs");

  if (!response.ok) {
    throw new Error("Failed to fetch points programs");
  }

  const json: PointsProgramsResponse = await response.json();
  return json.data;
}

async function fetchPointsProgram(id: string): Promise<PointsProgram> {
  const response = await fetch(`/api/points-programs/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch points program");
  }

  const json: PointsProgramResponse = await response.json();
  return json.data;
}

async function createPointsProgram(
  dto: Omit<CreatePointsProgramDTO, "userId">,
): Promise<PointsProgram> {
  const response = await fetch("/api/points-programs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create points program");
  }

  const json: PointsProgramResponse = await response.json();
  return json.data;
}

async function updatePointsProgram(
  dto: Omit<UpdatePointsProgramDTO, "userId">,
): Promise<PointsProgram> {
  const { id, ...data } = dto;
  const response = await fetch(`/api/points-programs/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update points program");
  }

  const json: PointsProgramResponse = await response.json();
  return json.data;
}

async function deletePointsProgram(id: string): Promise<void> {
  const response = await fetch(`/api/points-programs/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete points program");
  }
}

export function usePointsPrograms() {
  return useQuery({
    queryKey: ["points-programs"],
    queryFn: fetchPointsPrograms,
  });
}

export function usePointsProgram(id: string) {
  return useQuery({
    queryKey: ["points-programs", id],
    queryFn: () => fetchPointsProgram(id),
    enabled: !!id,
  });
}

export function useCreatePointsProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPointsProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["points-programs"] });
    },
  });
}

export function useUpdatePointsProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePointsProgram,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["points-programs"] });
      queryClient.invalidateQueries({ queryKey: ["points-programs", data.id] });
    },
  });
}

export function useDeletePointsProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePointsProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["points-programs"] });
    },
  });
}
