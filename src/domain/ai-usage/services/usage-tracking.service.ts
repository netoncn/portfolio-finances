import "server-only";
import { env } from "@/config/env";
import { adminDb as db } from "@/lib/firebase/firestore.admin";
import type { LLMGenerationResult } from "@/lib/llm/types";
import { logger } from "@/lib/logger";
import {
  type AIFeatureType,
  type AIUsageRecord,
  MODEL_PRICING,
  QUOTA_PLANS,
  type QuotaCheckResult,
  type UserQuota,
} from "../types/usage";

export class UsageTrackingService {
  private static readonly COLLECTION = "aiUsage";
  private static readonly QUOTA_COLLECTION = "aiQuotas";

  static calculateCost(
    model: string,
    promptTokens: number,
    completionTokens: number,
  ): number {
    const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];

    if (!pricing) {
      logger.warn(`No pricing found for model: ${model}, using default`);
      // Default pricing (similar to gpt-3.5-turbo)
      const promptCost = (promptTokens / 1000) * 50;
      const completionCost = (completionTokens / 1000) * 150;
      return Math.ceil(promptCost + completionCost);
    }

    // Calculate cost in cents per 1K tokens
    const promptCost = (promptTokens / 1000) * pricing.promptPrice;
    const completionCost = (completionTokens / 1000) * pricing.completionPrice;

    return Math.ceil(promptCost + completionCost);
  }

  static async recordUsage(
    userId: string,
    feature: AIFeatureType,
    result: LLMGenerationResult,
    metadata?: Record<string, any>,
  ): Promise<AIUsageRecord> {
    try {
      const usage = result.usage || {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      };

      const cost = UsageTrackingService.calculateCost(
        result.model,
        usage.promptTokens,
        usage.completionTokens,
      );

      const record: Omit<AIUsageRecord, "id" | "createdAt" | "updatedAt"> = {
        userId,
        feature,
        provider: result.provider,
        model: result.model,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        estimatedCost: cost,
        currency: "USD",
        timestamp: Date.now(),
        success: true,
        metadata,
      };

      const docRef = await db.collection(UsageTrackingService.COLLECTION).add({
        ...record,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await UsageTrackingService.updateQuota(
        userId,
        1,
        usage.totalTokens,
        cost,
      );

      logger.info("AI usage recorded", {
        userId,
        feature,
        tokens: usage.totalTokens,
        cost,
      });

      return {
        ...record,
        id: docRef.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    } catch (error) {
      logger.error("Failed to record AI usage", error as Error);
      throw error;
    }
  }

  static async recordFailure(
    userId: string,
    feature: AIFeatureType,
    provider: string,
    model: string,
    errorMessage: string,
  ): Promise<void> {
    try {
      await db.collection(UsageTrackingService.COLLECTION).add({
        userId,
        feature,
        provider,
        model,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
        currency: "USD",
        timestamp: Date.now(),
        success: false,
        errorMessage,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch (error) {
      logger.error("Failed to record AI failure", error as Error);
    }
  }

  static async checkQuota(userId: string): Promise<QuotaCheckResult> {
    try {
      const serverEnv = env.server;
      if (!serverEnv.AI_QUOTA_ENABLED) {
        logger.info("Quota system disabled - allowing request");
        return {
          allowed: true,
          reason: "Quota system disabled",
          remaining: {
            requests: Number.MAX_SAFE_INTEGER,
            tokens: Number.MAX_SAFE_INTEGER,
            cost: Number.MAX_SAFE_INTEGER,
          },
          usage: {
            requests: 0,
            tokens: 0,
            cost: 0,
            requestsPercent: 0,
            tokensPercent: 0,
            costPercent: 0,
          },
        };
      }

      const quota = await UsageTrackingService.getOrCreateQuota(userId);

      if (Date.now() > quota.periodEndDate) {
        await UsageTrackingService.resetQuota(userId);
        const newQuota = await UsageTrackingService.getOrCreateQuota(userId);
        return UsageTrackingService.buildQuotaCheckResult(newQuota, true);
      }

      if (quota.isBlocked) {
        return {
          allowed: false,
          reason: quota.blockReason || "User is blocked from using AI features",
          remaining: {
            requests: 0,
            tokens: 0,
            cost: 0,
          },
          usage: {
            requests: quota.currentRequests,
            tokens: quota.currentTokens,
            cost: quota.currentCost,
            requestsPercent: 100,
            tokensPercent: 100,
            costPercent: 100,
          },
        };
      }

      return UsageTrackingService.buildQuotaCheckResult(quota);
    } catch (error) {
      logger.error("Failed to check quota", error as Error);
      return {
        allowed: true,
        reason: "Error checking quota, allowing request",
        remaining: { requests: 0, tokens: 0, cost: 0 },
        usage: {
          requests: 0,
          tokens: 0,
          cost: 0,
          requestsPercent: 0,
          tokensPercent: 0,
          costPercent: 0,
        },
      };
    }
  }

  private static buildQuotaCheckResult(
    quota: UserQuota,
    resetJustHappened = false,
  ): QuotaCheckResult {
    const requestsRemaining = quota.maxRequestsPerMonth - quota.currentRequests;
    const tokensRemaining = quota.maxTokensPerMonth - quota.currentTokens;
    const costRemaining = quota.maxCostPerMonth - quota.currentCost;

    const requestsPercent =
      (quota.currentRequests / quota.maxRequestsPerMonth) * 100;
    const tokensPercent = (quota.currentTokens / quota.maxTokensPerMonth) * 100;
    const costPercent = (quota.currentCost / quota.maxCostPerMonth) * 100;

    const allowed =
      !resetJustHappened &&
      requestsRemaining > 0 &&
      tokensRemaining > 0 &&
      costRemaining > 0;

    let reason: string | undefined;
    if (!allowed) {
      if (requestsRemaining <= 0) {
        reason = "Monthly request limit exceeded";
      } else if (tokensRemaining <= 0) {
        reason = "Monthly token limit exceeded";
      } else if (costRemaining <= 0) {
        reason = "Monthly cost limit exceeded";
      }
    }

    return {
      allowed,
      reason,
      remaining: {
        requests: Math.max(0, requestsRemaining),
        tokens: Math.max(0, tokensRemaining),
        cost: Math.max(0, costRemaining),
      },
      usage: {
        requests: quota.currentRequests,
        tokens: quota.currentTokens,
        cost: quota.currentCost,
        requestsPercent: Math.min(100, requestsPercent),
        tokensPercent: Math.min(100, tokensPercent),
        costPercent: Math.min(100, costPercent),
      },
    };
  }

  static async getOrCreateQuota(userId: string): Promise<UserQuota> {
    const quotaDoc = await db
      .collection(UsageTrackingService.QUOTA_COLLECTION)
      .doc(userId)
      .get();

    if (quotaDoc.exists) {
      return { id: quotaDoc.id, ...quotaDoc.data() } as UserQuota;
    }

    const serverEnv = env.server;
    const quotaLimits = {
      maxRequestsPerMonth:
        serverEnv.AI_QUOTA_MAX_REQUESTS_PER_MONTH ||
        QUOTA_PLANS.free.maxRequestsPerMonth,
      maxTokensPerMonth:
        serverEnv.AI_QUOTA_MAX_TOKENS_PER_MONTH ||
        QUOTA_PLANS.free.maxTokensPerMonth,
      maxCostPerMonth:
        serverEnv.AI_QUOTA_MAX_COST_PER_MONTH ||
        QUOTA_PLANS.free.maxCostPerMonth,
      alertThreshold: QUOTA_PLANS.free.alertThreshold,
    };

    const now = Date.now();
    const currentPeriod = UsageTrackingService.getCurrentPeriod();
    const { periodStartDate, periodEndDate } =
      UsageTrackingService.getPeriodDates(currentPeriod);

    const quota: UserQuota = {
      id: userId,
      userId,
      ...quotaLimits,
      currentRequests: 0,
      currentTokens: 0,
      currentCost: 0,
      currentPeriod,
      periodStartDate,
      periodEndDate,
      isBlocked: false,
      plan: "free",
      createdAt: now,
      updatedAt: now,
    };

    await db
      .collection(UsageTrackingService.QUOTA_COLLECTION)
      .doc(userId)
      .set(quota);

    logger.info("Created user quota", { userId });

    return quota;
  }

  private static async updateQuota(
    userId: string,
    requestsIncrement: number,
    tokensIncrement: number,
    costIncrement: number,
  ): Promise<void> {
    try {
      const quotaRef = db
        .collection(UsageTrackingService.QUOTA_COLLECTION)
        .doc(userId);

      await db.runTransaction(async (transaction: any) => {
        const quotaDoc = await transaction.get(quotaRef);

        if (!quotaDoc.exists) {
          await UsageTrackingService.getOrCreateQuota(userId);
          return;
        }

        const quota = quotaDoc.data() as UserQuota;

        const newRequests = quota.currentRequests + requestsIncrement;
        const newTokens = quota.currentTokens + tokensIncrement;
        const newCost = quota.currentCost + costIncrement;

        const requestsPercent = (newRequests / quota.maxRequestsPerMonth) * 100;
        const tokensPercent = (newTokens / quota.maxTokensPerMonth) * 100;
        const costPercent = (newCost / quota.maxCostPerMonth) * 100;

        const maxPercent = Math.max(
          requestsPercent,
          tokensPercent,
          costPercent,
        );

        if (maxPercent >= quota.alertThreshold && !quota.lastAlertSent) {
          logger.warn("User approaching quota limit", {
            userId,
            requestsPercent,
            tokensPercent,
            costPercent,
          });
          // TODO: Send email/notification alert
        }

        transaction.update(quotaRef, {
          currentRequests: newRequests,
          currentTokens: newTokens,
          currentCost: newCost,
          updatedAt: Date.now(),
        });
      });
    } catch (error) {
      logger.error("Failed to update quota", error as Error);
      throw error;
    }
  }

  static async resetQuota(userId: string): Promise<void> {
    try {
      const currentPeriod = UsageTrackingService.getCurrentPeriod();
      const { periodStartDate, periodEndDate } =
        UsageTrackingService.getPeriodDates(currentPeriod);

      await db
        .collection(UsageTrackingService.QUOTA_COLLECTION)
        .doc(userId)
        .update({
          currentRequests: 0,
          currentTokens: 0,
          currentCost: 0,
          currentPeriod,
          periodStartDate,
          periodEndDate,
          lastAlertSent: null,
          updatedAt: Date.now(),
        });

      logger.info("User quota reset for new period", { userId, currentPeriod });
    } catch (error) {
      logger.error("Failed to reset quota", error as Error);
      throw error;
    }
  }

  private static getCurrentPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }

  private static getPeriodDates(period: string): {
    periodStartDate: number;
    periodEndDate: number;
  } {
    const [year, month] = period.split("-").map(Number);
    const periodStartDate = new Date(year, month - 1, 1).getTime();
    const periodEndDate = new Date(year, month, 0, 23, 59, 59, 999).getTime();
    return { periodStartDate, periodEndDate };
  }

  static async updateUserPlan(
    userId: string,
    plan: "free" | "basic" | "premium" | "unlimited",
  ): Promise<void> {
    try {
      const planLimits = QUOTA_PLANS[plan];

      await db
        .collection(UsageTrackingService.QUOTA_COLLECTION)
        .doc(userId)
        .update({
          plan,
          maxRequestsPerMonth: planLimits.maxRequestsPerMonth,
          maxTokensPerMonth: planLimits.maxTokensPerMonth,
          maxCostPerMonth: planLimits.maxCostPerMonth,
          alertThreshold: planLimits.alertThreshold,
          updatedAt: Date.now(),
        });

      logger.info("User plan updated", { userId, plan });
    } catch (error) {
      logger.error("Failed to update user plan", error as Error);
      throw error;
    }
  }

  static async blockUser(userId: string, reason: string): Promise<void> {
    try {
      await db
        .collection(UsageTrackingService.QUOTA_COLLECTION)
        .doc(userId)
        .update({
          isBlocked: true,
          blockReason: reason,
          updatedAt: Date.now(),
        });

      logger.warn("User blocked from AI features", { userId, reason });
    } catch (error) {
      logger.error("Failed to block user", error as Error);
      throw error;
    }
  }

  static async unblockUser(userId: string): Promise<void> {
    try {
      await db
        .collection(UsageTrackingService.QUOTA_COLLECTION)
        .doc(userId)
        .update({
          isBlocked: false,
          blockReason: null,
          updatedAt: Date.now(),
        });

      logger.info("User unblocked from AI features", { userId });
    } catch (error) {
      logger.error("Failed to unblock user", error as Error);
      throw error;
    }
  }
}
