"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useReviews } from "@/hooks/use-reviews";
import { ReviewCard } from "./ReviewCard";
import { ReviewQueueStats } from "./ReviewQueueStats";

interface ReviewQueueListProps {
  status?: "pending" | "approved" | "rejected" | "skipped";
}

export function ReviewQueueList({ status = "pending" }: ReviewQueueListProps) {
  const t = useTranslations("reviews.list");
  const {
    reviews,
    stats,
    isLoading,
    error,
    approveReview,
    rejectReview,
    skipReview,
    bulkApprove,
  } = useReviews({ status, limit: 50 });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t("error")}</AlertTitle>
        <AlertDescription>{t("errorMessage")}</AlertDescription>
      </Alert>
    );
  }

  const handleBulkApprove = async () => {
    if (reviews.length === 0) return;

    const pendingIds = reviews
      .filter((r) => r.status === "pending")
      .map((r) => r.id);

    if (pendingIds.length > 0) {
      await bulkApprove(pendingIds);
    }
  };

  return (
    <div className="space-y-6">
      {stats && <ReviewQueueStats stats={stats} />}

      {status === "pending" && reviews.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleBulkApprove} variant="outline">
            {t("approveAllButton", { count: reviews.length })}
          </Button>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("noReviews", { status })}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onApprove={async (data) => {
                await approveReview(review.id, data);
              }}
              onReject={async (data) => {
                await rejectReview(review.id, data);
              }}
              onSkip={async () => {
                await skipReview(review.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
