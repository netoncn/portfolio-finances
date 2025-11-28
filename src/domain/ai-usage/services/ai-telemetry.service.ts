import "server-only";

import { adminDb as db } from "@/lib/firebase/firestore.admin";
import type { LLMProviderType } from "@/lib/llm/types";
import { logger } from "@/lib/logger";
import {
  type AIRequestTelemetry,
  type DailyTelemetrySummary,
  DEFAULT_TELEMETRY_CONFIG,
  type ModelUsageStats,
  type TelemetryConfig,
  type TelemetryDashboardData,
  type TelemetryTimeRange,
  type ToolCallTelemetry,
  type ToolUsageStats,
} from "../types/telemetry";
import type { AIFeatureType } from "../types/usage";
import { MODEL_PRICING } from "../types/usage";

export class AITelemetryService {
  private static readonly COLLECTION = "aiTelemetry";
  private static readonly DAILY_COLLECTION = "aiTelemetryDaily";
  private static config: TelemetryConfig = DEFAULT_TELEMETRY_CONFIG;

  static configure(config: Partial<TelemetryConfig>): void {
    AITelemetryService.config = {
      ...AITelemetryService.config,
      ...config,
    };
  }

  static calculateCostBreakdown(
    model: string,
    promptTokens: number,
    completionTokens: number,
  ): { promptCost: number; completionCost: number; totalCost: number } {
    const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];

    if (!pricing) {
      logger.warn(`No pricing found for model: ${model}, using default`);
      const promptCost = Math.ceil((promptTokens / 1000) * 50);
      const completionCost = Math.ceil((completionTokens / 1000) * 150);
      return {
        promptCost,
        completionCost,
        totalCost: promptCost + completionCost,
      };
    }

    const promptCost = Math.ceil((promptTokens / 1000) * pricing.promptPrice);
    const completionCost = Math.ceil(
      (completionTokens / 1000) * pricing.completionPrice,
    );

    return {
      promptCost,
      completionCost,
      totalCost: promptCost + completionCost,
    };
  }

  static async recordRequest(
    data: Omit<AIRequestTelemetry, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    if (!AITelemetryService.config.enabled) {
      return "";
    }

    try {
      const sanitizedToolCalls = data.toolCalls.map((tc) =>
        AITelemetryService.sanitizeToolCall(tc),
      );

      const record: Omit<AIRequestTelemetry, "id"> = {
        ...data,
        toolCalls: sanitizedToolCalls,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const docRef = await db
        .collection(AITelemetryService.COLLECTION)
        .add(record);

      logger.info("AI telemetry recorded", {
        userId: data.userId,
        feature: data.feature,
        model: data.model,
        tokens: data.totalTokens,
        cost: data.totalCost,
        toolCalls: data.toolCallCount,
      });

      if (AITelemetryService.config.enableDailyAggregation) {
        AITelemetryService.updateDailyAggregation(data).catch((error) => {
          logger.error("Failed to update daily aggregation", error as Error);
        });
      }

      return docRef.id;
    } catch (error) {
      logger.error("Failed to record AI telemetry", error as Error);
      throw error;
    }
  }

  private static sanitizeToolCall(tc: ToolCallTelemetry): ToolCallTelemetry {
    const sanitized = { ...tc };

    if (!AITelemetryService.config.trackToolArguments) {
      sanitized.arguments = {};
    }

    if (!AITelemetryService.config.trackToolResults) {
      sanitized.result = undefined;
    } else if (sanitized.result !== undefined) {
      const resultStr = JSON.stringify(sanitized.result);
      if (resultStr.length > AITelemetryService.config.maxResultSize) {
        sanitized.result = {
          _truncated: true,
          _originalSize: resultStr.length,
        };
      }
    }

    return sanitized;
  }

  private static async updateDailyAggregation(
    data: Omit<AIRequestTelemetry, "id" | "createdAt" | "updatedAt">,
  ): Promise<void> {
    const date = new Date(data.requestStartedAt).toISOString().split("T")[0];
    const docId = `${data.userId}_${date}`;
    const docRef = db
      .collection(AITelemetryService.DAILY_COLLECTION)
      .doc(docId);

    await db.runTransaction(async (transaction: any) => {
      const doc = await transaction.get(docRef);

      if (!doc.exists) {
        const summary: Omit<DailyTelemetrySummary, "id"> = {
          date,
          userId: data.userId,
          totalRequests: 1,
          successfulRequests: data.success ? 1 : 0,
          failedRequests: data.success ? 0 : 1,
          successRate: data.success ? 100 : 0,
          totalTokens: data.totalTokens,
          totalPromptTokens: data.promptTokens,
          totalCompletionTokens: data.completionTokens,
          totalCost: data.totalCost,
          avgCostPerRequest: data.totalCost,
          totalToolCalls: data.toolCallCount,
          successfulToolCalls: data.successfulToolCalls,
          failedToolCalls: data.failedToolCalls,
          avgToolCallsPerRequest: data.toolCallCount,
          avgRequestTimeMs: data.totalRequestTimeMs,
          avgToolExecutionTimeMs:
            data.toolCallCount > 0
              ? data.totalToolExecutionTimeMs / data.toolCallCount
              : 0,
          byFeature: {
            chat: { requests: 0, tokens: 0, cost: 0, toolCalls: 0 },
            chat_with_tools: { requests: 0, tokens: 0, cost: 0, toolCalls: 0 },
            classification: { requests: 0, tokens: 0, cost: 0, toolCalls: 0 },
            insights: { requests: 0, tokens: 0, cost: 0, toolCalls: 0 },
            review: { requests: 0, tokens: 0, cost: 0, toolCalls: 0 },
          },
          byModel: {},
          byTool: {},
        };

        summary.byFeature[data.feature] = {
          requests: 1,
          tokens: data.totalTokens,
          cost: data.totalCost,
          toolCalls: data.toolCallCount,
        };

        summary.byModel[data.model] = {
          requests: 1,
          tokens: data.totalTokens,
          cost: data.totalCost,
        };

        for (const tc of data.toolCalls) {
          summary.byTool[tc.toolName] = {
            calls: 1,
            successfulCalls: tc.success ? 1 : 0,
            failedCalls: tc.success ? 0 : 1,
            avgExecutionTimeMs: tc.executionTimeMs,
          };
        }

        transaction.set(docRef, summary);
      } else {
        const existing = doc.data() as DailyTelemetrySummary;
        const newTotal = existing.totalRequests + 1;

        const updates: Partial<DailyTelemetrySummary> = {
          totalRequests: newTotal,
          successfulRequests:
            existing.successfulRequests + (data.success ? 1 : 0),
          failedRequests: existing.failedRequests + (data.success ? 0 : 1),
          totalTokens: existing.totalTokens + data.totalTokens,
          totalPromptTokens: existing.totalPromptTokens + data.promptTokens,
          totalCompletionTokens:
            existing.totalCompletionTokens + data.completionTokens,
          totalCost: existing.totalCost + data.totalCost,
          totalToolCalls: existing.totalToolCalls + data.toolCallCount,
          successfulToolCalls:
            existing.successfulToolCalls + data.successfulToolCalls,
          failedToolCalls: existing.failedToolCalls + data.failedToolCalls,
        };

        updates.successRate =
          ((updates.successfulRequests || 0) / newTotal) * 100;
        updates.avgCostPerRequest = (updates.totalCost || 0) / newTotal;
        updates.avgToolCallsPerRequest =
          (updates.totalToolCalls || 0) / newTotal;
        updates.avgRequestTimeMs =
          (existing.avgRequestTimeMs * existing.totalRequests +
            data.totalRequestTimeMs) /
          newTotal;

        const featureStats = existing.byFeature[data.feature] || {
          requests: 0,
          tokens: 0,
          cost: 0,
          toolCalls: 0,
        };
        updates.byFeature = {
          ...existing.byFeature,
          [data.feature]: {
            requests: featureStats.requests + 1,
            tokens: featureStats.tokens + data.totalTokens,
            cost: featureStats.cost + data.totalCost,
            toolCalls: featureStats.toolCalls + data.toolCallCount,
          },
        };

        const modelStats = existing.byModel[data.model] || {
          requests: 0,
          tokens: 0,
          cost: 0,
        };
        updates.byModel = {
          ...existing.byModel,
          [data.model]: {
            requests: modelStats.requests + 1,
            tokens: modelStats.tokens + data.totalTokens,
            cost: modelStats.cost + data.totalCost,
          },
        };

        const byTool = { ...existing.byTool };
        for (const tc of data.toolCalls) {
          const toolStats = byTool[tc.toolName] || {
            calls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            avgExecutionTimeMs: 0,
          };
          const newCalls = toolStats.calls + 1;
          byTool[tc.toolName] = {
            calls: newCalls,
            successfulCalls: toolStats.successfulCalls + (tc.success ? 1 : 0),
            failedCalls: toolStats.failedCalls + (tc.success ? 0 : 1),
            avgExecutionTimeMs:
              (toolStats.avgExecutionTimeMs * toolStats.calls +
                tc.executionTimeMs) /
              newCalls,
          };
        }
        updates.byTool = byTool;

        transaction.update(docRef, updates);
      }
    });
  }

  static async getRequestTelemetry(
    telemetryId: string,
  ): Promise<AIRequestTelemetry | null> {
    try {
      const doc = await db
        .collection(AITelemetryService.COLLECTION)
        .doc(telemetryId)
        .get();

      if (!doc.exists) {
        return null;
      }

      return { id: doc.id, ...doc.data() } as AIRequestTelemetry;
    } catch (error) {
      logger.error("Failed to get request telemetry", error as Error);
      throw error;
    }
  }

  static async getRecentTelemetry(
    userId: string,
    limit = 50,
  ): Promise<AIRequestTelemetry[]> {
    try {
      const snapshot = await db
        .collection(AITelemetryService.COLLECTION)
        .where("userId", "==", userId)
        .orderBy("requestStartedAt", "desc")
        .limit(limit)
        .get();

      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as AIRequestTelemetry,
      );
    } catch (error) {
      logger.error("Failed to get recent telemetry", error as Error);
      throw error;
    }
  }

  static async getToolUsageStats(
    userId: string,
    startDate: number,
    endDate: number,
  ): Promise<ToolUsageStats[]> {
    try {
      const snapshot = await db
        .collection(AITelemetryService.COLLECTION)
        .where("userId", "==", userId)
        .where("requestStartedAt", ">=", startDate)
        .where("requestStartedAt", "<=", endDate)
        .get();

      const toolStats = new Map<string, number[]>();

      for (const doc of snapshot.docs) {
        const data = doc.data() as AIRequestTelemetry;
        for (const tc of data.toolCalls || []) {
          if (!toolStats.has(tc.toolName)) {
            toolStats.set(tc.toolName, []);
          }
          toolStats
            .get(tc.toolName)!
            .push(tc.success ? tc.executionTimeMs : -tc.executionTimeMs);
        }
      }

      const results: ToolUsageStats[] = [];

      for (const [toolName, times] of toolStats.entries()) {
        const successTimes = times.filter((t) => t > 0);
        const failedTimes = times.filter((t) => t < 0).map((t) => -t);
        const allTimes = times.map((t) => Math.abs(t));

        const sorted = [...allTimes].sort((a, b) => a - b);
        const p50Index = Math.floor(sorted.length * 0.5);
        const p95Index = Math.floor(sorted.length * 0.95);
        const p99Index = Math.floor(sorted.length * 0.99);

        results.push({
          toolName,
          totalCalls: times.length,
          successfulCalls: successTimes.length,
          failedCalls: failedTimes.length,
          successRate: (successTimes.length / times.length) * 100,
          avgExecutionTimeMs:
            allTimes.reduce((a, b) => a + b, 0) / allTimes.length,
          minExecutionTimeMs: Math.min(...allTimes),
          maxExecutionTimeMs: Math.max(...allTimes),
          totalExecutionTimeMs: allTimes.reduce((a, b) => a + b, 0),
          p50ExecutionTimeMs: sorted[p50Index] || 0,
          p95ExecutionTimeMs: sorted[p95Index] || 0,
          p99ExecutionTimeMs: sorted[p99Index] || 0,
        });
      }

      return results.sort((a, b) => b.totalCalls - a.totalCalls);
    } catch (error) {
      logger.error("Failed to get tool usage stats", error as Error);
      throw error;
    }
  }

  static async getModelUsageStats(
    userId: string,
    startDate: number,
    endDate: number,
  ): Promise<ModelUsageStats[]> {
    try {
      const snapshot = await db
        .collection(AITelemetryService.COLLECTION)
        .where("userId", "==", userId)
        .where("requestStartedAt", ">=", startDate)
        .where("requestStartedAt", "<=", endDate)
        .get();

      const modelStats = new Map<
        string,
        {
          provider: LLMProviderType;
          requests: number;
          tokens: number;
          promptTokens: number;
          completionTokens: number;
          cost: number;
        }
      >();

      for (const doc of snapshot.docs) {
        const data = doc.data() as AIRequestTelemetry;
        const key = data.model;

        if (!modelStats.has(key)) {
          modelStats.set(key, {
            provider: data.provider,
            requests: 0,
            tokens: 0,
            promptTokens: 0,
            completionTokens: 0,
            cost: 0,
          });
        }

        const stats = modelStats.get(key)!;
        stats.requests += 1;
        stats.tokens += data.totalTokens;
        stats.promptTokens += data.promptTokens;
        stats.completionTokens += data.completionTokens;
        stats.cost += data.totalCost;
      }

      return Array.from(modelStats.entries()).map(([model, stats]) => ({
        model,
        provider: stats.provider,
        totalRequests: stats.requests,
        totalTokens: stats.tokens,
        totalPromptTokens: stats.promptTokens,
        totalCompletionTokens: stats.completionTokens,
        totalCost: stats.cost,
        avgTokensPerRequest: stats.tokens / stats.requests,
        avgCostPerRequest: stats.cost / stats.requests,
      }));
    } catch (error) {
      logger.error("Failed to get model usage stats", error as Error);
      throw error;
    }
  }

  static async getDailySummaries(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<DailyTelemetrySummary[]> {
    try {
      const snapshot = await db
        .collection(AITelemetryService.DAILY_COLLECTION)
        .where("userId", "==", userId)
        .where("date", ">=", startDate)
        .where("date", "<=", endDate)
        .orderBy("date", "asc")
        .get();

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...(doc.data() as unknown as DailyTelemetrySummary),
          }) as DailyTelemetrySummary,
      );
    } catch (error) {
      logger.error("Failed to get daily summaries", error as Error);
      throw error;
    }
  }

  static async getDashboardData(
    userId: string,
    timeRange: TelemetryTimeRange,
  ): Promise<TelemetryDashboardData> {
    try {
      const [recentTelemetry, toolStats, modelStats] = await Promise.all([
        AITelemetryService.getRecentTelemetry(userId, 100),
        AITelemetryService.getToolUsageStats(
          userId,
          timeRange.startDate,
          timeRange.endDate,
        ),
        AITelemetryService.getModelUsageStats(
          userId,
          timeRange.startDate,
          timeRange.endDate,
        ),
      ]);

      const filtered = recentTelemetry.filter(
        (t) =>
          t.requestStartedAt >= timeRange.startDate &&
          t.requestStartedAt <= timeRange.endDate,
      );

      const totalRequests = filtered.length;
      const totalTokens = filtered.reduce((sum, t) => sum + t.totalTokens, 0);
      const totalCost = filtered.reduce((sum, t) => sum + t.totalCost, 0);
      const totalToolCalls = filtered.reduce(
        (sum, t) => sum + t.toolCallCount,
        0,
      );
      const avgRequestTime =
        totalRequests > 0
          ? filtered.reduce((sum, t) => sum + t.totalRequestTimeMs, 0) /
            totalRequests
          : 0;
      const successCount = filtered.filter((t) => t.success).length;
      const successRate =
        totalRequests > 0 ? (successCount / totalRequests) * 100 : 100;

      const featureBreakdown: TelemetryDashboardData["featureBreakdown"] = {
        chat: { requests: 0, tokens: 0, cost: 0, percentage: 0 },
        chat_with_tools: { requests: 0, tokens: 0, cost: 0, percentage: 0 },
        classification: { requests: 0, tokens: 0, cost: 0, percentage: 0 },
        insights: { requests: 0, tokens: 0, cost: 0, percentage: 0 },
        review: { requests: 0, tokens: 0, cost: 0, percentage: 0 },
      };

      for (const t of filtered) {
        featureBreakdown[t.feature].requests += 1;
        featureBreakdown[t.feature].tokens += t.totalTokens;
        featureBreakdown[t.feature].cost += t.totalCost;
      }

      for (const feature of Object.keys(featureBreakdown) as AIFeatureType[]) {
        featureBreakdown[feature].percentage =
          totalRequests > 0
            ? (featureBreakdown[feature].requests / totalRequests) * 100
            : 0;
      }

      const trends = AITelemetryService.calculateTrends(filtered, timeRange);

      const recentErrors = filtered
        .filter((t) => !t.success || t.failedToolCalls > 0)
        .slice(0, 10)
        .map((t) => ({
          timestamp: t.requestStartedAt,
          feature: t.feature,
          errorMessage: t.errorMessage || "Tool call failed",
          toolName: t.toolCalls.find((tc) => !tc.success)?.toolName,
        }));

      return {
        timeRange,
        userId,
        overview: {
          totalRequests,
          totalTokens,
          totalCost,
          totalToolCalls,
          avgRequestTimeMs: avgRequestTime,
          successRate,
        },
        trends,
        topTools: toolStats.slice(0, 10),
        modelUsage: modelStats,
        featureBreakdown,
        recentErrors,
      };
    } catch (error) {
      logger.error("Failed to get dashboard data", error as Error);
      throw error;
    }
  }

  private static calculateTrends(
    data: AIRequestTelemetry[],
    timeRange: TelemetryTimeRange,
  ): TelemetryDashboardData["trends"] {
    const buckets = new Map<
      number,
      {
        requests: number;
        tokens: number;
        costs: number;
        toolCalls: number;
      }
    >();

    let bucketSizeMs: number;
    switch (timeRange.granularity) {
      case "hour":
        bucketSizeMs = 60 * 60 * 1000;
        break;
      case "day":
        bucketSizeMs = 24 * 60 * 60 * 1000;
        break;
      case "week":
        bucketSizeMs = 7 * 24 * 60 * 60 * 1000;
        break;
      case "month":
        bucketSizeMs = 30 * 24 * 60 * 60 * 1000;
        break;
    }

    for (
      let ts = timeRange.startDate;
      ts <= timeRange.endDate;
      ts += bucketSizeMs
    ) {
      buckets.set(ts, { requests: 0, tokens: 0, costs: 0, toolCalls: 0 });
    }

    for (const t of data) {
      const bucketTs =
        Math.floor(t.requestStartedAt / bucketSizeMs) * bucketSizeMs;
      const bucket = buckets.get(bucketTs);
      if (bucket) {
        bucket.requests += 1;
        bucket.tokens += t.totalTokens;
        bucket.costs += t.totalCost;
        bucket.toolCalls += t.toolCallCount;
      }
    }

    const sortedBuckets = Array.from(buckets.entries()).sort(
      ([a], [b]) => a - b,
    );

    return {
      timestamps: sortedBuckets.map(([ts]) => ts),
      requests: sortedBuckets.map(([, d]) => d.requests),
      tokens: sortedBuckets.map(([, d]) => d.tokens),
      costs: sortedBuckets.map(([, d]) => d.costs),
      toolCalls: sortedBuckets.map(([, d]) => d.toolCalls),
    };
  }

  static async cleanupOldData(): Promise<number> {
    try {
      const cutoffDate =
        Date.now() -
        AITelemetryService.config.retentionDays * 24 * 60 * 60 * 1000;

      const snapshot = await db
        .collection(AITelemetryService.COLLECTION)
        .where("requestStartedAt", "<", cutoffDate)
        .limit(500)
        .get();

      const batch = db.batch();
      for (const doc of snapshot.docs) {
        batch.delete(doc.ref);
      }
      await batch.commit();

      logger.info("Cleaned up old telemetry data", {
        deletedCount: snapshot.docs.length,
      });

      return snapshot.docs.length;
    } catch (error) {
      logger.error("Failed to cleanup old telemetry", error as Error);
      throw error;
    }
  }
}
