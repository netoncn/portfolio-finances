import "server-only";

import type { LLMProviderType } from "@/lib/llm/types";
import { logger } from "@/lib/logger";
import type { AIRequestTelemetry, ToolCallTelemetry } from "../types/telemetry";
import type { AIFeatureType } from "../types/usage";
import { AITelemetryService } from "./ai-telemetry.service";

export class ToolCallTelemetryBuilder {
  private data: Partial<ToolCallTelemetry> = {};
  private startTime: number = Date.now();

  constructor(toolCallId: string, toolName: string) {
    this.data.toolCallId = toolCallId;
    this.data.toolName = toolName;
    this.data.startedAt = this.startTime;
    this.data.arguments = {};
  }

  withArguments(args: Record<string, unknown>): this {
    this.data.arguments = args;
    return this;
  }

  success(result?: unknown): ToolCallTelemetry {
    const endTime = Date.now();
    return {
      toolCallId: this.data.toolCallId!,
      toolName: this.data.toolName!,
      arguments: this.data.arguments!,
      result,
      success: true,
      executionTimeMs: endTime - this.startTime,
      startedAt: this.startTime,
      completedAt: endTime,
    };
  }

  failure(errorMessage: string, errorCode?: string): ToolCallTelemetry {
    const endTime = Date.now();
    return {
      toolCallId: this.data.toolCallId!,
      toolName: this.data.toolName!,
      arguments: this.data.arguments!,
      success: false,
      errorMessage,
      errorCode,
      executionTimeMs: endTime - this.startTime,
      startedAt: this.startTime,
      completedAt: endTime,
    };
  }
}

export class RequestTelemetryBuilder {
  private data: Partial<
    Omit<AIRequestTelemetry, "id" | "createdAt" | "updatedAt">
  > = {};
  private startTime: number = Date.now();
  private llmStartTime?: number;
  private llmEndTime?: number;
  private toolCalls: ToolCallTelemetry[] = [];

  constructor(userId: string, feature: AIFeatureType) {
    this.data.userId = userId;
    this.data.feature = feature;
    this.data.requestStartedAt = this.startTime;
    this.data.isStreaming = false;
    this.data.metadata = {};
  }

  withSessionId(sessionId: string): this {
    this.data.sessionId = sessionId;
    return this;
  }

  withModel(provider: LLMProviderType, model: string): this {
    this.data.provider = provider;
    this.data.model = model;
    return this;
  }

  withTokens(promptTokens: number, completionTokens: number): this {
    this.data.promptTokens = promptTokens;
    this.data.completionTokens = completionTokens;
    this.data.totalTokens = promptTokens + completionTokens;

    const costs = AITelemetryService.calculateCostBreakdown(
      this.data.model || "",
      promptTokens,
      completionTokens,
    );
    this.data.promptCost = costs.promptCost;
    this.data.completionCost = costs.completionCost;
    this.data.totalCost = costs.totalCost;

    return this;
  }

  withMessageCount(count: number): this {
    this.data.messageCount = count;
    return this;
  }

  withStreaming(isStreaming: boolean): this {
    this.data.isStreaming = isStreaming;
    return this;
  }

  withTimeToFirstToken(timeMs: number): this {
    this.data.timeToFirstTokenMs = timeMs;
    return this;
  }

  startLLMGeneration(): this {
    this.llmStartTime = Date.now();
    return this;
  }

  endLLMGeneration(): this {
    this.llmEndTime = Date.now();
    if (this.llmStartTime) {
      this.data.llmGenerationTimeMs = this.llmEndTime - this.llmStartTime;
    }
    return this;
  }

  addToolCall(toolCall: ToolCallTelemetry): this {
    this.toolCalls.push(toolCall);
    return this;
  }

  addToolCalls(toolCalls: ToolCallTelemetry[]): this {
    this.toolCalls.push(...toolCalls);
    return this;
  }

  withMetadata(key: string, value: unknown): this {
    this.data.metadata = this.data.metadata || {};
    this.data.metadata[key] = value;
    return this;
  }

  async success(): Promise<string> {
    return this.finalize(true);
  }

  async failure(errorMessage: string): Promise<string> {
    this.data.errorMessage = errorMessage;
    return this.finalize(false);
  }

  private async finalize(success: boolean): Promise<string> {
    const endTime = Date.now();

    const successfulToolCalls = this.toolCalls.filter(
      (tc) => tc.success,
    ).length;
    const failedToolCalls = this.toolCalls.filter((tc) => !tc.success).length;
    const totalToolExecutionTime = this.toolCalls.reduce(
      (sum, tc) => sum + tc.executionTimeMs,
      0,
    );

    const telemetry: Omit<
      AIRequestTelemetry,
      "id" | "createdAt" | "updatedAt"
    > = {
      userId: this.data.userId!,
      sessionId: this.data.sessionId,
      feature: this.data.feature!,
      provider: this.data.provider || "openai",
      model: this.data.model || "unknown",

      promptTokens: this.data.promptTokens || 0,
      completionTokens: this.data.completionTokens || 0,
      totalTokens: this.data.totalTokens || 0,

      promptCost: this.data.promptCost || 0,
      completionCost: this.data.completionCost || 0,
      totalCost: this.data.totalCost || 0,

      toolCallCount: this.toolCalls.length,
      successfulToolCalls,
      failedToolCalls,
      totalToolExecutionTimeMs: totalToolExecutionTime,
      toolCalls: this.toolCalls,

      totalRequestTimeMs: endTime - this.startTime,
      timeToFirstTokenMs: this.data.timeToFirstTokenMs,
      llmGenerationTimeMs: this.data.llmGenerationTimeMs || 0,

      requestStartedAt: this.startTime,
      requestCompletedAt: endTime,
      success,
      errorMessage: this.data.errorMessage,
      messageCount: this.data.messageCount || 0,
      isStreaming: this.data.isStreaming || false,

      metadata: this.data.metadata,
    };

    try {
      return await AITelemetryService.recordRequest(telemetry);
    } catch (error) {
      logger.error("Failed to record telemetry", error as Error);
      return "";
    }
  }
}

export function createRequestTelemetry(
  userId: string,
  feature: AIFeatureType,
): RequestTelemetryBuilder {
  return new RequestTelemetryBuilder(userId, feature);
}

export function createToolCallTelemetry(
  toolCallId: string,
  toolName: string,
): ToolCallTelemetryBuilder {
  return new ToolCallTelemetryBuilder(toolCallId, toolName);
}

export interface TelemetryContext {
  userId: string;
  sessionId?: string;
  feature: AIFeatureType;
  requestBuilder: RequestTelemetryBuilder;
}

export function createTelemetryContext(
  userId: string,
  feature: AIFeatureType,
  sessionId?: string,
): TelemetryContext {
  const builder = createRequestTelemetry(userId, feature);
  if (sessionId) {
    builder.withSessionId(sessionId);
  }

  return {
    userId,
    sessionId,
    feature,
    requestBuilder: builder,
  };
}
