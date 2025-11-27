"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreatePointsOfferDTO,
  UpdatePointsOfferDTO,
} from "@/domain/points/dto/points.dto";
import type { PointsOffer } from "@/domain/points/types/points";

interface PointsOffersResponse {
  data: PointsOffer[];
}

interface PointsOfferResponse {
  data: PointsOffer;
}

interface FetchOffersOptions {
  program?: string;
  expiringSoon?: number;
  highBonus?: number;
}

async function fetchPointsOffers(
  options: FetchOffersOptions = {},
): Promise<PointsOffer[]> {
  const params = new URLSearchParams();

  if (options.program) {
    params.set("program", options.program);
  }
  if (options.expiringSoon) {
    params.set("expiringSoon", options.expiringSoon.toString());
  }
  if (options.highBonus) {
    params.set("highBonus", options.highBonus.toString());
  }

  const response = await fetch(`/api/points-offers?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch points offers");
  }

  const json: PointsOffersResponse = await response.json();
  return json.data;
}

async function fetchPointsOffer(id: string): Promise<PointsOffer> {
  const response = await fetch(`/api/points-offers/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch points offer");
  }

  const json: PointsOfferResponse = await response.json();
  return json.data;
}

async function createPointsOffer(
  dto: CreatePointsOfferDTO,
): Promise<PointsOffer> {
  const response = await fetch("/api/points-offers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create points offer");
  }

  const json: PointsOfferResponse = await response.json();
  return json.data;
}

async function updatePointsOffer(
  dto: UpdatePointsOfferDTO,
): Promise<PointsOffer> {
  const { id, ...data } = dto;
  const response = await fetch(`/api/points-offers/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update points offer");
  }

  const json: PointsOfferResponse = await response.json();
  return json.data;
}

async function deletePointsOffer(id: string): Promise<void> {
  const response = await fetch(`/api/points-offers/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete points offer");
  }
}

export function usePointsOffers(options: FetchOffersOptions = {}) {
  return useQuery({
    queryKey: ["points-offers", options],
    queryFn: () => fetchPointsOffers(options),
  });
}

export function usePointsOffersExpiringSoon(days = 7) {
  return useQuery({
    queryKey: ["points-offers", "expiring", days],
    queryFn: () => fetchPointsOffers({ expiringSoon: days }),
  });
}

export function usePointsOffersHighBonus(minBonus = 50) {
  return useQuery({
    queryKey: ["points-offers", "high-bonus", minBonus],
    queryFn: () => fetchPointsOffers({ highBonus: minBonus }),
  });
}

export function usePointsOffer(id: string) {
  return useQuery({
    queryKey: ["points-offers", id],
    queryFn: () => fetchPointsOffer(id),
    enabled: !!id,
  });
}

export function useCreatePointsOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPointsOffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["points-offers"] });
    },
  });
}

export function useUpdatePointsOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePointsOffer,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["points-offers"] });
      queryClient.invalidateQueries({
        queryKey: ["points-offers", data.id],
      });
    },
  });
}

export function useDeletePointsOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePointsOffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["points-offers"] });
    },
  });
}
