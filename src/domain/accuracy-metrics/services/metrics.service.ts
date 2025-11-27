import "server-only";
import { adminDb as db } from "@/lib/firebase/firestore.admin";
import { logger } from "@/lib/logger";
import type {
  AccuracyMetrics,
  GroundTruthSample,
  MetricsCalculationRequest,
  MetricsSummary,
  ThresholdRecommendation,
} from "../types/metrics";

export class AccuracyMetricsService {
  private static readonly GROUND_TRUTH_COLLECTION = "groundTruthSamples";
  private static readonly METRICS_COLLECTION = "accuracyMetrics";

  static async calculateMetrics(
    request: MetricsCalculationRequest,
  ): Promise<AccuracyMetrics> {
    const { userId, period, minSamples = 5 } = request;

    try {
      const [year, month] = period.split("-").map(Number);
      const periodStart = new Date(year, month - 1, 1).getTime();
      const periodEnd = new Date(year, month, 0, 23, 59, 59, 999).getTime();

      const samplesSnapshot = await db
        .collection(AccuracyMetricsService.GROUND_TRUTH_COLLECTION)
        .where("userId", "==", userId)
        .where("validatedAt", ">=", periodStart)
        .where("validatedAt", "<=", periodEnd)
        .get();

      const samples: GroundTruthSample[] = samplesSnapshot.docs.map(
        (doc: any) => ({
          id: doc.id,
          ...doc.data(),
        }),
      );

      if (samples.length < minSamples) {
        throw new Error(
          `Insufficient samples: ${samples.length} (minimum: ${minSamples})`,
        );
      }

      const totalSamples = samples.length;
      const correctPredictions = samples.filter((s) => s.isCorrect).length;
      const incorrectPredictions = totalSamples - correctPredictions;
      const accuracy = (correctPredictions / totalSamples) * 100;

      const confidences = samples
        .filter((s) => s.predictionConfidence !== undefined)
        .map((s) => s.predictionConfidence!);

      const averageConfidence =
        confidences.length > 0
          ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
          : 0;

      const correctSamples = samples.filter((s) => s.isCorrect);
      const incorrectSamples = samples.filter((s) => !s.isCorrect);

      const averageConfidenceCorrect =
        correctSamples.length > 0
          ? correctSamples.reduce(
              (sum, s) => sum + (s.predictionConfidence || 0),
              0,
            ) / correctSamples.length
          : 0;

      const averageConfidenceIncorrect =
        incorrectSamples.length > 0
          ? incorrectSamples.reduce(
              (sum, s) => sum + (s.predictionConfidence || 0),
              0,
            ) / incorrectSamples.length
          : 0;

      const bySource = AccuracyMetricsService.calculateBySource(samples);

      const byModel = AccuracyMetricsService.calculateByModel(samples);

      const byCategory = AccuracyMetricsService.calculateByCategory(samples);

      const confidenceBuckets =
        AccuracyMetricsService.calculateConfidenceBuckets(samples);

      const { precision, recall, f1Score } =
        AccuracyMetricsService.calculatePRF1(samples);

      const confidenceCalibration = Math.abs(
        averageConfidence * 100 - accuracy,
      );

      const metrics: Omit<AccuracyMetrics, "id" | "createdAt" | "updatedAt"> = {
        userId,
        period,
        periodStart,
        periodEnd,
        totalSamples,
        correctPredictions,
        incorrectPredictions,
        accuracy,
        precision,
        recall,
        f1Score,
        averageConfidence: averageConfidence * 100,
        averageConfidenceCorrect: averageConfidenceCorrect * 100,
        averageConfidenceIncorrect: averageConfidenceIncorrect * 100,
        confidenceCalibration,
        bySource,
        byModel,
        byCategory,
        confidenceBuckets,
        generatedAt: Date.now(),
        samplesIncluded: samples.map((s) => s.id),
      };

      const docRef = await db
        .collection(AccuracyMetricsService.METRICS_COLLECTION)
        .add({
          ...metrics,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

      logger.info("Accuracy metrics calculated", {
        userId,
        period,
        accuracy,
        samples: totalSamples,
      });

      return {
        id: docRef.id,
        ...metrics,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    } catch (error) {
      logger.error("Failed to calculate metrics", error as Error);
      throw error;
    }
  }

  private static calculateBySource(samples: GroundTruthSample[]) {
    const bySource: Record<string, any> = {};

    for (const sample of samples) {
      const source = sample.predictionSource;
      if (!bySource[source]) {
        bySource[source] = {
          samples: 0,
          correct: 0,
          accuracy: 0,
          averageConfidence: 0,
          totalConfidence: 0,
        };
      }

      bySource[source].samples++;
      if (sample.isCorrect) bySource[source].correct++;
      if (sample.predictionConfidence) {
        bySource[source].totalConfidence += sample.predictionConfidence;
      }
    }

    for (const source in bySource) {
      const data = bySource[source];
      data.accuracy = (data.correct / data.samples) * 100;
      data.averageConfidence = (data.totalConfidence / data.samples) * 100;
      delete data.totalConfidence;
    }

    return bySource;
  }

  private static calculateByModel(samples: GroundTruthSample[]) {
    const byModel: Record<string, any> = {};

    for (const sample of samples) {
      if (!sample.predictionModel) continue;

      const model = sample.predictionModel;
      if (!byModel[model]) {
        byModel[model] = {
          samples: 0,
          correct: 0,
          accuracy: 0,
          averageConfidence: 0,
          totalConfidence: 0,
        };
      }

      byModel[model].samples++;
      if (sample.isCorrect) byModel[model].correct++;
      if (sample.predictionConfidence) {
        byModel[model].totalConfidence += sample.predictionConfidence;
      }
    }

    for (const model in byModel) {
      const data = byModel[model];
      data.accuracy = (data.correct / data.samples) * 100;
      data.averageConfidence = (data.totalConfidence / data.samples) * 100;
      delete data.totalConfidence;
    }

    return byModel;
  }

  private static calculateByCategory(samples: GroundTruthSample[]) {
    const byCategory: Record<string, any> = {};

    for (const sample of samples) {
      const categoryId = sample.correctCategoryId;
      if (!byCategory[categoryId]) {
        byCategory[categoryId] = {
          categoryName: sample.correctCategoryName,
          samples: 0,
          correct: 0,
          accuracy: 0,
          mispredictions: {} as Record<string, number>,
        };
      }

      byCategory[categoryId].samples++;
      if (sample.isCorrect) {
        byCategory[categoryId].correct++;
      } else if (sample.predictedCategoryId) {
        const predicted = sample.predictedCategoryId;
        byCategory[categoryId].mispredictions[predicted] =
          (byCategory[categoryId].mispredictions[predicted] || 0) + 1;
      }
    }

    for (const categoryId in byCategory) {
      const data = byCategory[categoryId];
      data.accuracy = (data.correct / data.samples) * 100;

      data.commonMispredictions = Object.entries(data.mispredictions)
        .map(([catId, count]) => {
          const sample = samples.find((s) => s.predictedCategoryId === catId);
          return {
            categoryId: catId,
            categoryName: sample?.predictedCategoryName || "Unknown",
            count: count as number,
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 3); // Top 3 mispredictions

      delete data.mispredictions;
    }

    return byCategory;
  }

  private static calculateConfidenceBuckets(samples: GroundTruthSample[]) {
    const buckets = [
      { range: "0.0-0.5", min: 0.0, max: 0.5, samples: 0, correct: 0 },
      { range: "0.5-0.6", min: 0.5, max: 0.6, samples: 0, correct: 0 },
      { range: "0.6-0.7", min: 0.6, max: 0.7, samples: 0, correct: 0 },
      { range: "0.7-0.8", min: 0.7, max: 0.8, samples: 0, correct: 0 },
      { range: "0.8-0.9", min: 0.8, max: 0.9, samples: 0, correct: 0 },
      { range: "0.9-1.0", min: 0.9, max: 1.0, samples: 0, correct: 0 },
    ];

    for (const sample of samples) {
      if (!sample.predictionConfidence) continue;

      const confidence = sample.predictionConfidence;
      const bucket = buckets.find(
        (b) => confidence >= b.min && confidence < b.max,
      );

      if (bucket || (confidence >= 0.9 && confidence <= 1.0)) {
        const targetBucket = bucket || buckets[buckets.length - 1];
        targetBucket.samples++;
        if (sample.isCorrect) targetBucket.correct++;
      }
    }

    return buckets.map((b) => ({
      ...b,
      accuracy: b.samples > 0 ? (b.correct / b.samples) * 100 : 0,
    }));
  }

  private static calculatePRF1(samples: GroundTruthSample[]) {
    const categories = new Set(samples.map((s) => s.correctCategoryId));

    let totalPrecision = 0;
    let totalRecall = 0;
    let validCategories = 0;

    for (const category of categories) {
      const truePositives = samples.filter(
        (s) => s.correctCategoryId === category && s.isCorrect,
      ).length;

      const falsePositives = samples.filter(
        (s) =>
          s.predictedCategoryId === category &&
          s.correctCategoryId !== category,
      ).length;

      const falseNegatives = samples.filter(
        (s) =>
          s.correctCategoryId === category &&
          s.predictedCategoryId !== category,
      ).length;

      const precision =
        truePositives + falsePositives > 0
          ? truePositives / (truePositives + falsePositives)
          : 0;

      const recall =
        truePositives + falseNegatives > 0
          ? truePositives / (truePositives + falseNegatives)
          : 0;

      if (truePositives > 0) {
        totalPrecision += precision;
        totalRecall += recall;
        validCategories++;
      }
    }

    const avgPrecision =
      validCategories > 0 ? (totalPrecision / validCategories) * 100 : 0;
    const avgRecall =
      validCategories > 0 ? (totalRecall / validCategories) * 100 : 0;

    const f1Score =
      avgPrecision + avgRecall > 0
        ? (2 * avgPrecision * avgRecall) / (avgPrecision + avgRecall)
        : 0;

    return {
      precision: avgPrecision,
      recall: avgRecall,
      f1Score,
    };
  }

  static async getMetrics(
    userId: string,
    period: string,
  ): Promise<AccuracyMetrics | null> {
    const snapshot = await db
      .collection(AccuracyMetricsService.METRICS_COLLECTION)
      .where("userId", "==", userId)
      .where("period", "==", period)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as AccuracyMetrics;
  }

  static async getMetricsSummary(userId: string): Promise<MetricsSummary> {
    const now = new Date();
    const periods: string[] = [];

    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      periods.push(
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      );
    }

    const metricsPromises = periods.map((period) =>
      AccuracyMetricsService.getMetrics(userId, period),
    );

    const metricsResults = await Promise.all(metricsPromises);
    const metrics = metricsResults.filter(
      (m) => m !== null,
    ) as AccuracyMetrics[];

    if (metrics.length === 0) {
      throw new Error("No metrics available");
    }

    const currentMetrics = metrics[0];
    const previousMetrics = metrics[1];

    let trend: "up" | "down" | "stable" = "stable";
    if (previousMetrics) {
      const diff = currentMetrics.accuracy - previousMetrics.accuracy;
      if (diff > 2) trend = "up";
      else if (diff < -2) trend = "down";
    }

    const topMispredictions: any[] = [];
    for (const categoryId in currentMetrics.byCategory) {
      const category = currentMetrics.byCategory[categoryId];
      for (const misp of category.commonMispredictions || []) {
        topMispredictions.push({
          predicted: misp.categoryName,
          actual: category.categoryName,
          count: misp.count,
          percentage: (misp.count / currentMetrics.totalSamples) * 100,
        });
      }
    }

    topMispredictions.sort((a, b) => b.count - a.count);

    const categories = Object.entries(currentMetrics.byCategory).map(
      ([id, data]: [string, any]) => ({
        categoryId: id,
        categoryName: data.categoryName,
        accuracy: data.accuracy,
        samples: data.samples,
      }),
    );

    const bestCategories = categories
      .filter((c) => c.samples >= 3)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 5);

    const worstCategories = categories
      .filter((c) => c.samples >= 3)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    return {
      userId,
      currentPeriod: currentMetrics.period,
      current: {
        accuracy: currentMetrics.accuracy,
        f1Score: currentMetrics.f1Score,
        totalSamples: currentMetrics.totalSamples,
        trend,
      },
      history: metrics.map((m) => ({
        period: m.period,
        accuracy: m.accuracy,
        f1Score: m.f1Score,
        samples: m.totalSamples,
      })),
      topMispredictions: topMispredictions.slice(0, 5),
      confidenceDistribution: currentMetrics.confidenceBuckets.map((b) => ({
        bucket: b.range,
        samples: b.samples,
        accuracy: b.accuracy,
      })),
      bestCategories,
      worstCategories,
    };
  }

  static async getThresholdRecommendation(
    userId: string,
    period: string,
  ): Promise<ThresholdRecommendation> {
    const metrics = await AccuracyMetricsService.getMetrics(userId, period);

    if (!metrics) {
      throw new Error("No metrics available for period");
    }

    const thresholds = [0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95];
    const analysis = [];

    for (const threshold of thresholds) {
      let autoClassified = 0;
      let needsReview = 0;
      let correctAtThreshold = 0;

      for (const bucket of metrics.confidenceBuckets) {
        if (bucket.min >= threshold) {
          autoClassified += bucket.samples;
          correctAtThreshold += bucket.correct;
        } else {
          needsReview += bucket.samples;
        }
      }

      const autoClassifiedPercent =
        (autoClassified / metrics.totalSamples) * 100;
      const needsReviewPercent = (needsReview / metrics.totalSamples) * 100;
      const expectedAccuracy =
        autoClassified > 0 ? (correctAtThreshold / autoClassified) * 100 : 0;

      analysis.push({
        threshold,
        autoClassifiedPercent,
        expectedAccuracy,
        needsReviewPercent,
      });
    }

    const candidates = analysis.filter((a) => a.expectedAccuracy >= 90);
    const recommended =
      candidates.length > 0
        ? candidates.reduce((best, current) =>
            current.autoClassifiedPercent > best.autoClassifiedPercent
              ? current
              : best,
          )
        : analysis[analysis.length - 1]; // Default to highest threshold

    return {
      period,
      analysis,
      recommended: {
        threshold: recommended.threshold,
        reason:
          recommended.expectedAccuracy >= 90
            ? `Maximizes auto-classification (${recommended.autoClassifiedPercent.toFixed(1)}%) while maintaining ${recommended.expectedAccuracy.toFixed(1)}% accuracy`
            : `Conservative threshold to ensure high accuracy`,
        expectedAccuracy: recommended.expectedAccuracy,
        autoClassifiedPercent: recommended.autoClassifiedPercent,
      },
    };
  }
}
