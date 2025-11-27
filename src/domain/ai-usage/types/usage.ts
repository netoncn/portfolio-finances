import type { LLMProviderType } from "@/lib/llm/types";
import type { BaseEntity } from "@/types/common";

export type AIFeatureType =
  | "chat" // Financial chat
  | "classification" // Transaction classification
  | "insights" // AI insights generation
  | "review"; // Review queue processing

export interface AIUsageRecord extends BaseEntity {
  userId: string;
  feature: AIFeatureType;
  provider: LLMProviderType;
  model: string;

  promptTokens: number;
  completionTokens: number;
  totalTokens: number;

  estimatedCost: number; // in USD cents (1 cent = $0.01)
  currency: "USD";

  timestamp: number;
  responseTime?: number; // in milliseconds
  success: boolean;
  errorMessage?: string;

  metadata?: {
    messageCount?: number;
    transactionCount?: number;
    [key: string]: any;
  };
}

export interface UserQuota extends BaseEntity {
  userId: string;

  maxRequestsPerMonth: number;
  maxTokensPerMonth: number;
  maxCostPerMonth: number; // in USD cents

  currentRequests: number;
  currentTokens: number;
  currentCost: number; // in USD cents

  currentPeriod: string; // YYYY-MM format
  periodStartDate: number;
  periodEndDate: number;

  isBlocked: boolean;
  blockReason?: string;

  alertThreshold: number; // Percentage (e.g., 80 = 80%)
  lastAlertSent?: number;

  plan: "free" | "basic" | "premium" | "unlimited";
  customLimits?: boolean;
}

export interface UsageSummary {
  userId: string;
  period: string; // YYYY-MM format

  totalRequests: number;
  totalTokens: number;
  totalCost: number; // in USD cents

  byFeature: Record<
    AIFeatureType,
    {
      requests: number;
      tokens: number;
      cost: number;
    }
  >;

  byProvider: Record<
    LLMProviderType,
    {
      requests: number;
      tokens: number;
      cost: number;
    }
  >;

  quota: {
    maxRequests: number;
    maxTokens: number;
    maxCost: number;
    requestsUsagePercent: number;
    tokensUsagePercent: number;
    costUsagePercent: number;
  };
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  remaining: {
    requests: number;
    tokens: number;
    cost: number; // in USD cents
  };
  usage: {
    requests: number;
    tokens: number;
    cost: number; // in USD cents
    requestsPercent: number;
    tokensPercent: number;
    costPercent: number;
  };
}

export const QUOTA_PLANS = {
  free: {
    maxRequestsPerMonth: 50,
    maxTokensPerMonth: 50000,
    maxCostPerMonth: 100, // $1.00
    alertThreshold: 80,
  },
  basic: {
    maxRequestsPerMonth: 500,
    maxTokensPerMonth: 500000,
    maxCostPerMonth: 1000, // $10.00
    alertThreshold: 80,
  },
  premium: {
    maxRequestsPerMonth: 5000,
    maxTokensPerMonth: 5000000,
    maxCostPerMonth: 10000, // $100.00
    alertThreshold: 90,
  },
  unlimited: {
    maxRequestsPerMonth: Number.MAX_SAFE_INTEGER,
    maxTokensPerMonth: Number.MAX_SAFE_INTEGER,
    maxCostPerMonth: Number.MAX_SAFE_INTEGER,
    alertThreshold: 95,
  },
} as const;

export const MODEL_PRICING = {
  // OpenAI
  "gpt-4o": {
    promptPrice: 250, // $2.50 per 1M tokens = $0.0025 per 1K = 0.25 cents
    completionPrice: 1000, // $10.00 per 1M tokens
  },
  "gpt-4o-mini": {
    promptPrice: 15, // $0.15 per 1M tokens
    completionPrice: 60, // $0.60 per 1M tokens
  },
  "gpt-4-turbo": {
    promptPrice: 1000,
    completionPrice: 3000,
  },
  "gpt-3.5-turbo": {
    promptPrice: 50,
    completionPrice: 150,
  },

  // Anthropic Claude
  "claude-3-5-sonnet-20241022": {
    promptPrice: 300, // $3.00 per 1M tokens
    completionPrice: 1500, // $15.00 per 1M tokens
  },
  "claude-3-opus-20240229": {
    promptPrice: 1500,
    completionPrice: 7500,
  },
  "claude-3-sonnet-20240229": {
    promptPrice: 300,
    completionPrice: 1500,
  },
  "claude-3-haiku-20240307": {
    promptPrice: 25,
    completionPrice: 125,
  },

  // Google Gemini
  "gemini-1.5-pro": {
    promptPrice: 125, // $1.25 per 1M tokens
    completionPrice: 500, // $5.00 per 1M tokens
  },
  "gemini-1.5-flash": {
    promptPrice: 7.5, // $0.075 per 1M tokens
    completionPrice: 30, // $0.30 per 1M tokens
  },
  "gemini-pro": {
    promptPrice: 50,
    completionPrice: 150,
  },
} as const;
