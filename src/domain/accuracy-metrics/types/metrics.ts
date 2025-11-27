import type { ClassificationSource } from "@/domain/transactions/types/classification";
import type { LLMProviderType } from "@/lib/llm/types";
import type { BaseEntity } from "@/types/common";

export interface GroundTruthSample extends BaseEntity {
  userId: string;
  transactionId: string;

  transactionDescription: string;
  transactionAmount: number;
  transactionDate: number;
  transactionMerchant?: string;

  correctCategoryId: string;
  correctCategoryName: string;
  correctMerchant?: string;
  correctTags?: string[];

  predictedCategoryId?: string;
  predictedCategoryName?: string;
  predictedMerchant?: string;
  predictedTags?: string[];
  predictionConfidence?: number;
  predictionSource: ClassificationSource;
  predictionModel?: string;
  predictionModelVersion?: string;

  validatedBy: string;
  validatedAt: number;
  validationMethod: "review" | "manual" | "import";
  validationNotes?: string;

  reviewId?: string;
  isCorrect: boolean;
  isPartiallyCorrect?: boolean;
}

export interface AccuracyMetrics extends BaseEntity {
  userId: string;
  period: string; // YYYY-MM format
  periodStart: number;
  periodEnd: number;

  totalSamples: number;
  correctPredictions: number;
  incorrectPredictions: number;

  accuracy: number; // (correct / total) * 100
  precision: number; // (true_positives / (true_positives + false_positives)) * 100
  recall: number; // (true_positives / (true_positives + false_negatives)) * 100
  f1Score: number; // 2 * (precision * recall) / (precision + recall)

  averageConfidence: number;
  averageConfidenceCorrect: number; // Avg confidence when correct
  averageConfidenceIncorrect: number; // Avg confidence when incorrect
  confidenceCalibration: number; // How well confidence matches accuracy

  bySource: Record<
    ClassificationSource,
    {
      samples: number;
      correct: number;
      accuracy: number;
      averageConfidence: number;
    }
  >;

  byModel?: Record<
    string,
    {
      samples: number;
      correct: number;
      accuracy: number;
      averageConfidence: number;
    }
  >;

  byProvider?: Record<
    LLMProviderType,
    {
      samples: number;
      correct: number;
      accuracy: number;
    }
  >;

  byCategory: Record<
    string,
    {
      categoryName: string;
      samples: number;
      correct: number;
      accuracy: number;
      commonMispredictions: Array<{
        categoryId: string;
        categoryName: string;
        count: number;
      }>;
    }
  >;

  confidenceBuckets: Array<{
    range: string; // e.g., "0.8-0.9"
    min: number;
    max: number;
    samples: number;
    correct: number;
    accuracy: number;
  }>;

  trend?: {
    previousPeriod?: string;
    accuracyChange?: number; // % change
    samplesChange?: number;
  };

  generatedAt: number;
  samplesIncluded: string[]; // IDs of GroundTruthSamples used
}
export interface ConfusionMatrix {
  userId: string;
  period: string;

  matrix: Record<string, Record<string, number>>;

  categories: Record<
    string,
    {
      name: string;
      totalPredicted: number;
      totalActual: number;
      correctPredictions: number;
    }
  >;

  totalSamples: number;
  totalCorrect: number;
  overallAccuracy: number;

  generatedAt: number;
}

export interface MetricsCalculationRequest {
  userId: string;
  period: string; // YYYY-MM format
  includeConfusionMatrix?: boolean;
  minSamples?: number; // Minimum samples required per category
}

export interface MetricsSummary {
  userId: string;
  currentPeriod: string;

  current: {
    accuracy: number;
    f1Score: number;
    totalSamples: number;
    trend: "up" | "down" | "stable";
  };

  history: Array<{
    period: string;
    accuracy: number;
    f1Score: number;
    samples: number;
  }>;

  topMispredictions: Array<{
    predicted: string;
    actual: string;
    count: number;
    percentage: number;
  }>;

  confidenceDistribution: Array<{
    bucket: string;
    samples: number;
    accuracy: number;
  }>;

  bestCategories: Array<{
    categoryId: string;
    categoryName: string;
    accuracy: number;
    samples: number;
  }>;

  worstCategories: Array<{
    categoryId: string;
    categoryName: string;
    accuracy: number;
    samples: number;
  }>;
}

export interface ModelPerformanceComparison {
  period: string;
  models: Array<{
    modelName: string;
    provider: LLMProviderType;
    samples: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    averageConfidence: number;
    averageResponseTime?: number;
  }>;
  winner: {
    modelName: string;
    metric: "accuracy" | "f1Score" | "precision" | "recall";
    value: number;
  };
}

export interface CalibrationPoint {
  confidenceBucket: string; // e.g., "0.7-0.8"
  avgConfidence: number;
  actualAccuracy: number;
  samples: number;
  gap: number; // abs(avgConfidence - actualAccuracy)
}

export interface ThresholdRecommendation {
  period: string;
  analysis: Array<{
    threshold: number;
    autoClassifiedPercent: number; // % of transactions that would be auto-classified
    expectedAccuracy: number; // Expected accuracy at this threshold
    needsReviewPercent: number; // % that would need review
  }>;
  recommended: {
    threshold: number;
    reason: string;
    expectedAccuracy: number;
    autoClassifiedPercent: number;
  };
}

export interface SampleCollectionStatus {
  userId: string;
  totalSamples: number;
  samplesThisMonth: number;
  samplesNeeded: number; // For statistical significance
  coverage: {
    totalCategories: number;
    categoriesWithSamples: number;
    categoriesNeedingSamples: string[];
  };
  quality: {
    averageConfidenceGap: number; // How well-calibrated predictions are
    recommendedMinSamples: number;
    hasStatisticalSignificance: boolean;
  };
}
