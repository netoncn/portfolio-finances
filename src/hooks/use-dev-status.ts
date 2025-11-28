"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LogEntry, LogLevel } from "@/lib/dev-logger";

interface SystemStatus {
  environment: {
    nodeEnv: string;
    appEnv: string;
    isDevelopment: boolean;
    isProduction: boolean;
  };
  runtime: {
    uptime: number;
    uptimeFormatted: string;
    memoryUsage: {
      heapUsed: string;
      heapTotal: string;
      external: string;
      rss: string;
    };
    nodeVersion: string;
    platform: string;
    arch: string;
  };
  services: {
    firebase: { configured: boolean; projectId: string | null };
    auth: { configured: boolean; provider: string };
    ai: {
      enabled: boolean;
      provider: string | null;
      model: string | null;
      quotaEnabled: boolean;
    };
  };
  features: {
    aiFeatures: boolean;
    firebaseEmulator: boolean;
    nextAuthDebug: boolean;
  };
  timestamp: string;
}

interface LogsResponse {
  logs: LogEntry[];
  stats: {
    total: number;
    byLevel: Record<LogLevel, number>;
    sources: string[];
  };
}

interface HealthCheckResult {
  status: "healthy" | "unhealthy";
  timestamp: string;
  service: string;
  uptime: number;
  environment: string;
  version: string;
  error?: string;
}

// Query keys
const devStatusKeys = {
  all: ["dev-status"] as const,
  status: () => [...devStatusKeys.all, "status"] as const,
  logs: (filters?: {
    level?: LogLevel;
    limit?: number;
    source?: string;
    search?: string;
  }) => [...devStatusKeys.all, "logs", filters] as const,
  health: () => [...devStatusKeys.all, "health"] as const,
};

// Fetch functions
async function fetchStatus(): Promise<SystemStatus> {
  const response = await fetch("/api/dev/status");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch status");
  }
  return response.json();
}

async function fetchLogs(filters?: {
  level?: LogLevel;
  limit?: number;
  source?: string;
  search?: string;
}): Promise<LogsResponse> {
  const params = new URLSearchParams();
  if (filters?.level) params.set("level", filters.level);
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.source) params.set("source", filters.source);
  if (filters?.search) params.set("search", filters.search);

  const response = await fetch(`/api/dev/logs?${params.toString()}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch logs");
  }
  return response.json();
}

async function fetchHealth(): Promise<HealthCheckResult> {
  const response = await fetch("/api/health");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Health check failed");
  }
  return response.json();
}

async function clearLogs(): Promise<void> {
  const response = await fetch("/api/dev/logs", { method: "DELETE" });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to clear logs");
  }
}

// Hooks
export function useDevStatus() {
  return useQuery({
    queryKey: devStatusKeys.status(),
    queryFn: fetchStatus,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000,
  });
}

export function useDevLogs(filters?: {
  level?: LogLevel;
  limit?: number;
  source?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: devStatusKeys.logs(filters),
    queryFn: () => fetchLogs(filters),
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 2000,
  });
}

export function useHealthCheck() {
  return useQuery({
    queryKey: devStatusKeys.health(),
    queryFn: fetchHealth,
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

export function useClearLogs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearLogs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: devStatusKeys.logs() });
    },
  });
}
