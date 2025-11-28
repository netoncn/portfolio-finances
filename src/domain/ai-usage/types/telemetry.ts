import type { LLMProviderType } from "@/lib/llm/types";
import type { BaseEntity } from "@/types/common";
import type { AIFeatureType } from "./usage";

export interface ToolCallTelemetry {
  toolCallId: string;
  toolName: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  success: boolean;
  errorMessage?: string;
  errorCode?: string;
  executionTimeMs: number;
  startedAt: number;
  completedAt: number;
}

export interface AIRequestTelemetry extends BaseEntity {
  userId: string;
  sessionId?: string;
  feature: AIFeatureType;
  provider: LLMProviderType;
  model: string;

  promptTokens: number;
  completionTokens: number;
  totalTokens: number;

  // Cost Metrics (in USD cents, 1 cent = $0.01)
  promptCost: number;
  completionCost: number;
  totalCost: number;

  // Tool Call Metrics
  toolCallCount: number;
  successfulToolCalls: number;
  failedToolCalls: number;
  totalToolExecutionTimeMs: number;
  toolCalls: ToolCallTelemetry[];

  // Timing Metrics
  totalRequestTimeMs: number;
  timeToFirstTokenMs?: number;
  llmGenerationTimeMs: number;

  // Request Metadata
  requestStartedAt: number;
  requestCompletedAt: number;
  success: boolean;
  errorMessage?: string;
  messageCount: number;
  isStreaming: boolean;

  // Additional Metadata
  metadata?: Record<string, unknown>;
}

export interface ToolUsageStats {
  toolName: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  successRate: number;
  avgExecutionTimeMs: number;
  minExecutionTimeMs: number;
  maxExecutionTimeMs: number;
  totalExecutionTimeMs: number;
  p50ExecutionTimeMs: number;
  p95ExecutionTimeMs: number;
  p99ExecutionTimeMs: number;
}

export interface ModelUsageStats {
  model: string;
  provider: LLMProviderType;
  totalRequests: number;
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCost: number;
  avgTokensPerRequest: number;
  avgCostPerRequest: number;
}

export interface DailyTelemetrySummary {
  date: string; // YYYY-MM-DD
  userId: string;

  // Request Metrics
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;

  // Token Metrics
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;

  // Cost Metrics (in cents)
  totalCost: number;
  avgCostPerRequest: number;

  // Tool Metrics
  totalToolCalls: number;
  successfulToolCalls: number;
  failedToolCalls: number;
  avgToolCallsPerRequest: number;

  // Timing Metrics
  avgRequestTimeMs: number;
  avgToolExecutionTimeMs: number;

  // Breakdown by feature
  byFeature: Record<
    AIFeatureType,
    {
      requests: number;
      tokens: number;
      cost: number;
      toolCalls: number;
    }
  >;

  // Breakdown by model
  byModel: Record<
    string,
    {
      requests: number;
      tokens: number;
      cost: number;
    }
  >;

  // Breakdown by tool
  byTool: Record<
    string,
    {
      calls: number;
      successfulCalls: number;
      failedCalls: number;
      avgExecutionTimeMs: number;
    }
  >;
}

export interface TelemetryTimeRange {
  startDate: number; // timestamp
  endDate: number; // timestamp
  granularity: "hour" | "day" | "week" | "month";
}

export interface TelemetryDashboardData {
  timeRange: TelemetryTimeRange;
  userId: string;

  overview: {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    totalToolCalls: number;
    avgRequestTimeMs: number;
    successRate: number;
  };

  trends: {
    timestamps: number[];
    requests: number[];
    tokens: number[];
    costs: number[];
    toolCalls: number[];
  };

  topTools: ToolUsageStats[];

  modelUsage: ModelUsageStats[];

  // Feature Breakdown
  featureBreakdown: Record<
    AIFeatureType,
    {
      requests: number;
      tokens: number;
      cost: number;
      percentage: number;
    }
  >;

  recentErrors: Array<{
    timestamp: number;
    feature: AIFeatureType;
    errorMessage: string;
    toolName?: string;
  }>;
}

export type TelemetryEventType =
  | "request_started"
  | "request_completed"
  | "request_failed"
  | "tool_call_started"
  | "tool_call_completed"
  | "tool_call_failed"
  | "stream_started"
  | "stream_chunk"
  | "stream_completed";

export interface TelemetryEvent {
  type: TelemetryEventType;
  timestamp: number;
  userId: string;
  sessionId?: string;
  data: Record<string, unknown>;
}

export interface TelemetryConfig {
  enabled: boolean;
  trackToolArguments: boolean;
  trackToolResults: boolean;
  maxResultSize: number; // in bytes
  retentionDays: number;
  enableDailyAggregation: boolean;
  enableRealTimeEvents: boolean;
}

export const DEFAULT_TELEMETRY_CONFIG: TelemetryConfig = {
  enabled: true,
  trackToolArguments: true,
  trackToolResults: false, // Results can be large, disabled by default
  maxResultSize: 10000, // 10KB max
  retentionDays: 90,
  enableDailyAggregation: true,
  enableRealTimeEvents: false,
};
