import "server-only";
import type { TransactionReview } from "@/domain/transactions/types/classification";
import { adminDb as db } from "@/lib/firebase/firestore.admin";
import { logger } from "@/lib/logger";
import type {
  GroundTruthSample,
  SampleCollectionStatus,
} from "../types/metrics";

export class SampleCollectionService {
  private static readonly GROUND_TRUTH_COLLECTION = "groundTruthSamples";
  private static readonly REVIEWS_COLLECTION = "transaction_reviews";

  static async createFromReview(
    review: TransactionReview,
  ): Promise<GroundTruthSample> {
    try {
      const isCorrect =
        review.status === "approved" &&
        review.suggestedCategoryId === review.approvedCategoryId;

      const isPartiallyCorrect =
        review.suggestedCategoryId === review.approvedCategoryId &&
        review.suggestedMerchant !== review.approvedMerchant;

      const sample: Omit<GroundTruthSample, "id" | "createdAt" | "updatedAt"> =
        {
          userId: review.userId,
          transactionId: review.transactionId,

          transactionDescription: review.transaction?.description || "",
          transactionAmount: review.transaction?.amount || 0,
          transactionDate: review.transaction?.date || Date.now(),
          transactionMerchant: review.transaction?.merchant,

          correctCategoryId: review.approvedCategoryId!,
          correctCategoryName: review.approvedCategoryId || "Unknown", // TODO: Get category name
          correctMerchant: review.approvedMerchant,
          correctTags: review.approvedTags,

          predictedCategoryId: review.suggestedCategoryId,
          predictedCategoryName: review.suggestedCategoryId || "Unknown",
          predictedMerchant: review.suggestedMerchant,
          predictedTags: review.suggestedTags,
          predictionConfidence: review.suggestionConfidence,
          predictionSource: review.suggestionSource,
          predictionModel: undefined, // TODO: Extract from review
          predictionModelVersion: undefined,

          validatedBy: review.reviewedBy!,
          validatedAt: review.reviewedAt!,
          validationMethod: "review",
          validationNotes: review.reviewNotes,

          reviewId: review.id,
          isCorrect,
          isPartiallyCorrect,
        };

      const docRef = await db
        .collection(SampleCollectionService.GROUND_TRUTH_COLLECTION)
        .add({
          ...sample,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

      logger.info("Ground truth sample created from review", {
        sampleId: docRef.id,
        reviewId: review.id,
        isCorrect,
      });

      return {
        id: docRef.id,
        ...sample,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    } catch (error) {
      logger.error("Failed to create ground truth sample", error as Error);
      throw error;
    }
  }

  static async processReviewsToSamples(
    userId: string,
    reviewIds?: string[],
  ): Promise<{
    processed: number;
    created: number;
    skipped: number;
    errors: number;
  }> {
    try {
      let reviewsQuery = db
        .collection(SampleCollectionService.REVIEWS_COLLECTION)
        .where("userId", "==", userId)
        .where("status", "in", [
          "approved",
          "rejected",
        ]) as FirebaseFirestore.Query;

      if (reviewIds && reviewIds.length > 0) {
        reviewsQuery = reviewsQuery.where(
          "__name__",
          "in",
          reviewIds.slice(0, 10),
        );
      }

      const reviewsSnapshot = await reviewsQuery.get();

      const stats = {
        processed: 0,
        created: 0,
        skipped: 0,
        errors: 0,
      };

      for (const doc of reviewsSnapshot.docs) {
        stats.processed++;

        const review = {
          id: doc.id,
          ...doc.data(),
        } as TransactionReview;

        const existingSnapshot = await db
          .collection(SampleCollectionService.GROUND_TRUTH_COLLECTION)
          .where("reviewId", "==", review.id)
          .limit(1)
          .get();

        if (!existingSnapshot.empty) {
          stats.skipped++;
          continue;
        }

        if (
          !review.approvedCategoryId ||
          !review.reviewedBy ||
          !review.reviewedAt
        ) {
          stats.skipped++;
          continue;
        }

        try {
          await SampleCollectionService.createFromReview(review);
          stats.created++;
        } catch (error) {
          logger.error(`Failed to process review ${review.id}`, error as Error);
          stats.errors++;
        }
      }

      logger.info("Batch processed reviews to samples", stats);

      return stats;
    } catch (error) {
      logger.error("Failed to batch process reviews", error as Error);
      throw error;
    }
  }

  static async getCollectionStatus(
    userId: string,
  ): Promise<SampleCollectionStatus> {
    try {
      const samplesSnapshot = await db
        .collection(SampleCollectionService.GROUND_TRUTH_COLLECTION)
        .where("userId", "==", userId)
        .get();

      const totalSamples = samplesSnapshot.size;

      const now = new Date();
      const monthStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ).getTime();

      const thisMonthSamples = samplesSnapshot.docs.filter((doc: any) => {
        const data = doc.data();
        return data.validatedAt >= monthStart;
      }).length;

      const _categories = new Set<string>();
      const categoriesWithSamples = new Set<string>();

      samplesSnapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        categoriesWithSamples.add(data.correctCategoryId);
      });

      // TODO: Get total categories from user's categories collection
      const totalCategories = categoriesWithSamples.size; // Simplified

      const confidenceGaps: number[] = [];

      samplesSnapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        if (data.predictionConfidence) {
          const expected = data.isCorrect ? 1 : 0;
          const gap = Math.abs(data.predictionConfidence - expected);
          confidenceGaps.push(gap);
        }
      });

      const averageConfidenceGap =
        confidenceGaps.length > 0
          ? confidenceGaps.reduce((sum, gap) => sum + gap, 0) /
            confidenceGaps.length
          : 0;

      const recommendedMinSamples = totalCategories * 30;
      const hasStatisticalSignificance =
        totalSamples >= Math.min(100, recommendedMinSamples * 0.5);

      return {
        userId,
        totalSamples,
        samplesThisMonth: thisMonthSamples,
        samplesNeeded: Math.max(0, recommendedMinSamples - totalSamples),
        coverage: {
          totalCategories,
          categoriesWithSamples: categoriesWithSamples.size,
          categoriesNeedingSamples: [], // TODO: Implement
        },
        quality: {
          averageConfidenceGap,
          recommendedMinSamples,
          hasStatisticalSignificance,
        },
      };
    } catch (error) {
      logger.error("Failed to get collection status", error as Error);
      throw error;
    }
  }

  static async getSamples(
    userId: string,
    period?: string,
    limit = 100,
  ): Promise<GroundTruthSample[]> {
    let query = db
      .collection(SampleCollectionService.GROUND_TRUTH_COLLECTION)
      .where("userId", "==", userId) as FirebaseFirestore.Query;

    if (period) {
      const [year, month] = period.split("-").map(Number);
      const periodStart = new Date(year, month - 1, 1).getTime();
      const periodEnd = new Date(year, month, 0, 23, 59, 59, 999).getTime();

      query = query
        .where("validatedAt", ">=", periodStart)
        .where("validatedAt", "<=", periodEnd);
    }

    query = query.orderBy("validatedAt", "desc").limit(limit);

    const snapshot = await query.get();

    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    })) as GroundTruthSample[];
  }

  static async deleteSample(id: string, userId: string): Promise<boolean> {
    try {
      const docRef = db
        .collection(SampleCollectionService.GROUND_TRUTH_COLLECTION)
        .doc(id);

      const doc = await docRef.get();

      if (!doc.exists) {
        return false;
      }

      const data = doc.data() as GroundTruthSample;

      if (data.userId !== userId) {
        return false;
      }

      await docRef.delete();

      logger.info("Ground truth sample deleted", { id, userId });

      return true;
    } catch (error) {
      logger.error("Failed to delete sample", error as Error);
      throw error;
    }
  }

  static async createManualSample(
    sample: Omit<
      GroundTruthSample,
      "id" | "createdAt" | "updatedAt" | "validationMethod"
    >,
  ): Promise<GroundTruthSample> {
    try {
      const docRef = await db
        .collection(SampleCollectionService.GROUND_TRUTH_COLLECTION)
        .add({
          ...sample,
          validationMethod: "manual",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

      logger.info("Manual ground truth sample created", {
        sampleId: docRef.id,
        userId: sample.userId,
      });

      return {
        id: docRef.id,
        ...sample,
        validationMethod: "manual",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    } catch (error) {
      logger.error("Failed to create manual sample", error as Error);
      throw error;
    }
  }
}
