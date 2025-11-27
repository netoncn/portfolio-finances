import "server-only";
import { LLMProviderFactory } from "@/lib/llm";
import type {
  LLMGenerationOptions,
  LLMGenerationResult,
  LLMMessage,
} from "@/lib/llm/types";
import { logger } from "@/lib/logger";
import type { AIFeatureType } from "../types/usage";
import { UsageTrackingService } from "./usage-tracking.service";

export class AIServiceWrapper {
  static async generateText(
    userId: string,
    feature: AIFeatureType,
    messages: LLMMessage[],
    options?: LLMGenerationOptions,
    metadata?: Record<string, any>,
  ): Promise<LLMGenerationResult> {
    const startTime = Date.now();

    try {
      const quotaCheck = await UsageTrackingService.checkQuota(userId);

      if (!quotaCheck.allowed) {
        logger.warn("AI request blocked due to quota", {
          userId,
          feature,
          reason: quotaCheck.reason,
        });

        throw new Error(
          quotaCheck.reason || "AI quota exceeded. Please upgrade your plan.",
        );
      }

      const provider = LLMProviderFactory.getProvider();
      const result = await provider.generateText(messages, options);

      const responseTime = Date.now() - startTime;

      await UsageTrackingService.recordUsage(userId, feature, result, {
        ...metadata,
        responseTime,
        messageCount: messages.length,
      });

      logger.info("AI request successful", {
        userId,
        feature,
        tokens: result.usage?.totalTokens || 0,
        responseTime,
      });

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      if (!(error instanceof Error && error.message.includes("quota"))) {
        const provider = LLMProviderFactory.getProvider();
        await UsageTrackingService.recordFailure(
          userId,
          feature,
          provider.type,
          options?.model || "unknown",
          (error as Error).message,
        );
      }

      logger.error("AI request failed", error as Error, {
        userId,
        feature,
        responseTime,
      });

      throw error;
    }
  }

  static async generateJSON<T = unknown>(
    userId: string,
    feature: AIFeatureType,
    messages: LLMMessage[],
    options?: LLMGenerationOptions,
    metadata?: Record<string, any>,
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const quotaCheck = await UsageTrackingService.checkQuota(userId);

      if (!quotaCheck.allowed) {
        logger.warn("AI request blocked due to quota", {
          userId,
          feature,
          reason: quotaCheck.reason,
        });

        throw new Error(
          quotaCheck.reason || "AI quota exceeded. Please upgrade your plan.",
        );
      }

      const provider = LLMProviderFactory.getProvider();
      const result = await provider.generateJSON<T>(messages, options);

      const estimatedTokens = Math.ceil(
        messages.reduce((sum, msg) => sum + msg.content.length, 0) / 4,
      );

      const generationResult: LLMGenerationResult = {
        text: JSON.stringify(result),
        model: options?.model || provider.type,
        provider: provider.type,
        usage: {
          promptTokens: estimatedTokens,
          completionTokens: Math.ceil(JSON.stringify(result).length / 4),
          totalTokens:
            estimatedTokens + Math.ceil(JSON.stringify(result).length / 4),
        },
      };

      const responseTime = Date.now() - startTime;

      await UsageTrackingService.recordUsage(
        userId,
        feature,
        generationResult,
        {
          ...metadata,
          responseTime,
          messageCount: messages.length,
          jsonOutput: true,
        },
      );

      logger.info("AI JSON request successful", {
        userId,
        feature,
        estimatedTokens,
        responseTime,
      });

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      if (!(error instanceof Error && error.message.includes("quota"))) {
        const provider = LLMProviderFactory.getProvider();
        await UsageTrackingService.recordFailure(
          userId,
          feature,
          provider.type,
          options?.model || "unknown",
          (error as Error).message,
        );
      }

      logger.error("AI JSON request failed", error as Error, {
        userId,
        feature,
        responseTime,
      });

      throw error;
    }
  }

  static async canUseAI(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    try {
      const quotaCheck = await UsageTrackingService.checkQuota(userId);
      return {
        allowed: quotaCheck.allowed,
        reason: quotaCheck.reason,
      };
    } catch (error) {
      logger.error("Error checking AI availability", error as Error);
      return { allowed: true };
    }
  }

  static async getRemainingQuota(userId: string) {
    try {
      const quotaCheck = await UsageTrackingService.checkQuota(userId);
      return quotaCheck.remaining;
    } catch (error) {
      logger.error("Error getting remaining quota", error as Error);
      return { requests: 0, tokens: 0, cost: 0 };
    }
  }

  static async getCurrentUsage(userId: string) {
    try {
      const quotaCheck = await UsageTrackingService.checkQuota(userId);
      return quotaCheck.usage;
    } catch (error) {
      logger.error("Error getting current usage", error as Error);
      return {
        requests: 0,
        tokens: 0,
        cost: 0,
        requestsPercent: 0,
        tokensPercent: 0,
        costPercent: 0,
      };
    }
  }
}
