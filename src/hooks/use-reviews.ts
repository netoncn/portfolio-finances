"use client";

import { useCallback, useEffect, useState } from "react";
import type { TransactionReview } from "@/domain/transactions";
import { logger } from "@/lib/logger";

interface ReviewStats {
  total: number;
  pending: number;
  inReview: number;
  approved: number;
  rejected: number;
  skipped: number;
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
  averageConfidence: number;
}

interface UseReviewsResult {
  reviews: TransactionReview[];
  stats: ReviewStats | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  approveReview: (
    id: string,
    data: {
      categoryId?: string;
      merchant?: string;
      tags?: string[];
      notes?: string;
      createRule?: boolean;
    },
  ) => Promise<boolean>;
  rejectReview: (
    id: string,
    data: {
      categoryId?: string;
      merchant?: string;
      tags?: string[];
      notes?: string;
      improveSuggestion?: boolean;
    },
  ) => Promise<boolean>;
  skipReview: (id: string) => Promise<boolean>;
  bulkApprove: (ids: string[]) => Promise<boolean>;
}

export function useReviews(filters?: {
  status?: string;
  priority?: string;
  limit?: number;
}): UseReviewsResult {
  const [reviews, setReviews] = useState<TransactionReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.priority) params.append("priority", filters.priority);
      if (filters?.limit) params.append("limit", filters.limit.toString());

      const response = await fetch(`/api/reviews?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }

      const data = await response.json();
      setReviews(data.data || []);
      setStats(data.stats || null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      logger.error("Error fetching reviews", error);
    } finally {
      setIsLoading(false);
    }
  }, [filters?.status, filters?.priority, filters?.limit]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const approveReview = async (
    id: string,
    data: {
      categoryId?: string;
      merchant?: string;
      tags?: string[];
      notes?: string;
      createRule?: boolean;
    },
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "approved",
          approvedCategoryId: data.categoryId,
          approvedMerchant: data.merchant,
          approvedTags: data.tags,
          reviewNotes: data.notes,
          createRule: data.createRule,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve review");
      }

      await fetchReviews();
      return true;
    } catch (err) {
      logger.error("Error approving review", err as Error);
      return false;
    }
  };

  const rejectReview = async (
    id: string,
    data: {
      categoryId?: string;
      merchant?: string;
      tags?: string[];
      notes?: string;
      improveSuggestion?: boolean;
    },
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "rejected",
          approvedCategoryId: data.categoryId,
          approvedMerchant: data.merchant,
          approvedTags: data.tags,
          reviewNotes: data.notes,
          improveSuggestion: data.improveSuggestion,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject review");
      }

      await fetchReviews();
      return true;
    } catch (err) {
      logger.error("Error rejecting review", err as Error);
      return false;
    }
  };

  const skipReview = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "skipped",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to skip review");
      }

      await fetchReviews();
      return true;
    } catch (err) {
      logger.error("Error skipping review", err as Error);
      return false;
    }
  };

  const bulkApprove = async (ids: string[]): Promise<boolean> => {
    try {
      const response = await fetch("/api/reviews/bulk-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewIds: ids }),
      });

      if (!response.ok) {
        throw new Error("Failed to bulk approve reviews");
      }

      await fetchReviews();
      return true;
    } catch (err) {
      logger.error("Error bulk approving reviews", err as Error);
      return false;
    }
  };

  return {
    reviews,
    stats,
    isLoading,
    error,
    refetch: fetchReviews,
    approveReview,
    rejectReview,
    skipReview,
    bulkApprove,
  };
}
