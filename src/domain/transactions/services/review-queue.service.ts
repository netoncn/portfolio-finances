import "server-only";
import { SampleCollectionService } from "@/domain/accuracy-metrics";
import { adminDb } from "@/lib/firebase/firestore.admin";
import { logger } from "@/lib/logger";
import type {
  ClassificationDecision,
  TransactionReview,
} from "../types/classification";
import type { Transaction } from "../types/transaction";

const COLLECTION = "transaction_reviews";

export class ReviewQueueService {
  static async addToQueue(
    userId: string,
    transaction: Transaction,
    suggestion: ClassificationDecision,
  ): Promise<TransactionReview> {
    const now = Date.now();
    const docRef = adminDb.collection(COLLECTION).doc();

    let priority: "low" | "medium" | "high" = "medium";
    if (suggestion.confidence < 0.5) {
      priority = "high";
    } else if (suggestion.confidence > 0.8) {
      priority = "low";
    }

    if (Math.abs(transaction.amount) > 500) {
      priority = priority === "low" ? "medium" : "high";
    }

    const review: Omit<TransactionReview, "id" | "transaction"> = {
      userId,
      transactionId: transaction.id!,
      suggestedCategoryId: suggestion.categoryId,
      suggestedMerchant: suggestion.merchant,
      suggestedTags: suggestion.tags,
      suggestionSource: suggestion.source,
      suggestionConfidence: suggestion.confidence,
      suggestionReason: suggestion.reasoning,
      status: "pending",
      priority,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(review);

    logger.info(`Added transaction ${transaction.id} to review queue`, {
      reviewId: docRef.id,
      priority,
      confidence: suggestion.confidence,
    });

    return {
      id: docRef.id,
      transaction,
      ...review,
    } as TransactionReview;
  }

  static async getPendingReviews(
    userId: string,
    limit = 50,
  ): Promise<TransactionReview[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("status", "==", "pending")
      .orderBy("priority", "desc")
      .orderBy("createdAt", "asc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TransactionReview[];
  }

  static async getReviews(
    userId: string,
    filters?: {
      status?: string;
      priority?: string;
      limit?: number;
    },
  ): Promise<TransactionReview[]> {
    let query = adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId) as FirebaseFirestore.Query;

    if (filters?.status) {
      query = query.where("status", "==", filters.status);
    }

    if (filters?.priority) {
      query = query.where("priority", "==", filters.priority);
    }

    query = query.orderBy("createdAt", "desc");

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TransactionReview[];
  }

  static async getReview(
    id: string,
    userId: string,
  ): Promise<TransactionReview | null> {
    const doc = await adminDb.collection(COLLECTION).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<TransactionReview, "id">;

    if (data.userId !== userId) {
      return null;
    }

    return {
      id: doc.id,
      ...data,
    } as TransactionReview;
  }

  static async approveReview(
    id: string,
    userId: string,
    data: {
      categoryId?: string;
      merchant?: string;
      tags?: string[];
      notes?: string;
      createRule?: boolean;
    },
  ): Promise<TransactionReview | null> {
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const reviewData = doc.data() as Omit<TransactionReview, "id">;

    if (reviewData.userId !== userId) {
      return null;
    }

    const updates = {
      status: "approved",
      approvedCategoryId: data.categoryId,
      approvedMerchant: data.merchant,
      approvedTags: data.tags,
      reviewNotes: data.notes,
      createRule: data.createRule,
      reviewedBy: userId,
      reviewedAt: Date.now(),
      updatedAt: Date.now(),
    };

    await docRef.update(updates);

    logger.info(`Review ${id} approved by ${userId}`, {
      categoryId: data.categoryId,
      createRule: data.createRule,
    });

    const review: TransactionReview = {
      id,
      ...reviewData,
      ...updates,
    } as TransactionReview;

    try {
      await SampleCollectionService.createFromReview(review);
    } catch (error) {
      logger.error(
        "Failed to create ground truth sample from approved review",
        error as Error,
      );
    }

    return review;
  }

  static async rejectReview(
    id: string,
    userId: string,
    data: {
      categoryId?: string;
      merchant?: string;
      tags?: string[];
      notes?: string;
      improveSuggestion?: boolean;
    },
  ): Promise<TransactionReview | null> {
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const reviewData = doc.data() as Omit<TransactionReview, "id">;

    if (reviewData.userId !== userId) {
      return null;
    }

    const updates = {
      status: "rejected",
      approvedCategoryId: data.categoryId,
      approvedMerchant: data.merchant,
      approvedTags: data.tags,
      reviewNotes: data.notes,
      improveSuggestion: data.improveSuggestion,
      reviewedBy: userId,
      reviewedAt: Date.now(),
      updatedAt: Date.now(),
    };

    await docRef.update(updates);

    logger.info(`Review ${id} rejected by ${userId}`, {
      categoryId: data.categoryId,
      improveSuggestion: data.improveSuggestion,
    });

    const review: TransactionReview = {
      id,
      ...reviewData,
      ...updates,
    } as TransactionReview;

    try {
      await SampleCollectionService.createFromReview(review);
    } catch (error) {
      logger.error(
        "Failed to create ground truth sample from rejected review",
        error as Error,
      );
    }

    return review;
  }

  static async skipReview(id: string, userId: string): Promise<boolean> {
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    const data = doc.data() as Omit<TransactionReview, "id">;

    if (data.userId !== userId) {
      return false;
    }

    await docRef.update({
      status: "skipped",
      updatedAt: Date.now(),
    });

    return true;
  }

  static async deleteReview(id: string, userId: string): Promise<boolean> {
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    const data = doc.data() as Omit<TransactionReview, "id">;

    if (data.userId !== userId) {
      return false;
    }

    await docRef.delete();

    logger.info(`Review ${id} deleted by ${userId}`);

    return true;
  }

  static async getQueueStats(userId: string) {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .get();

    const stats = {
      total: snapshot.size,
      pending: 0,
      inReview: 0,
      approved: 0,
      rejected: 0,
      skipped: 0,
      byPriority: {
        high: 0,
        medium: 0,
        low: 0,
      },
      averageConfidence: 0,
    };

    let totalConfidence = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data() as Omit<TransactionReview, "id">;

      if (data.status === "pending") stats.pending++;
      else if (data.status === "in_review") stats.inReview++;
      else if (data.status === "approved") stats.approved++;
      else if (data.status === "rejected") stats.rejected++;
      else if (data.status === "skipped") stats.skipped++;

      stats.byPriority[data.priority]++;

      totalConfidence += data.suggestionConfidence;
    });

    stats.averageConfidence =
      stats.total > 0 ? totalConfidence / stats.total : 0;

    return stats;
  }

  static async bulkApprove(
    userId: string,
    reviewIds: string[],
  ): Promise<number> {
    let count = 0;

    for (const id of reviewIds) {
      const review = await ReviewQueueService.getReview(id, userId);
      if (!review) continue;

      const approved = await ReviewQueueService.approveReview(id, userId, {
        categoryId: review.suggestedCategoryId,
        merchant: review.suggestedMerchant,
        tags: review.suggestedTags,
      });

      if (approved) count++;
    }

    return count;
  }
}
