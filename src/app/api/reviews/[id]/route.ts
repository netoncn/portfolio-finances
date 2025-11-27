import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { updateReviewSchema } from "@/domain/transactions/schemas/classification.schema";
import { ReviewQueueService } from "@/domain/transactions/services/review-queue.service";
import { TransactionService } from "@/domain/transactions/services/transaction.service";
import type { TransactionReview } from "@/domain/transactions/types/classification";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const review = await ReviewQueueService.getReview(id, session.user.id);

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ data: review });
  } catch (error) {
    logger.error("Error fetching review", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const userId = session.user.id;
    const body = await request.json();

    const validatedData = updateReviewSchema.parse({
      ...body,
      id,
      userId,
    });

    let updatedReview: TransactionReview | null = null;

    if (validatedData.status === "approved") {
      updatedReview = await ReviewQueueService.approveReview(id, userId, {
        categoryId: validatedData.approvedCategoryId,
        merchant: validatedData.approvedMerchant,
        tags: validatedData.approvedTags,
        notes: validatedData.reviewNotes,
        createRule: validatedData.createRule,
      });
    } else if (validatedData.status === "rejected") {
      updatedReview = await ReviewQueueService.rejectReview(id, userId, {
        categoryId: validatedData.approvedCategoryId,
        merchant: validatedData.approvedMerchant,
        tags: validatedData.approvedTags,
        notes: validatedData.reviewNotes,
        improveSuggestion: validatedData.improveSuggestion,
      });
    } else if (validatedData.status === "skipped") {
      const success = await ReviewQueueService.skipReview(id, userId);
      if (!success) {
        return NextResponse.json(
          { error: "Review not found" },
          { status: 404 },
        );
      }
      updatedReview = await ReviewQueueService.getReview(id, userId);
    }

    if (!updatedReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (
      validatedData.status === "approved" ||
      validatedData.status === "rejected"
    ) {
      await TransactionService.update({
        id: updatedReview.transactionId,
        userId,
        categoryId: validatedData.approvedCategoryId,
        merchant: validatedData.approvedMerchant,
        tags: validatedData.approvedTags,
      });
    }

    return NextResponse.json({
      data: updatedReview,
      message: "Review updated successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    logger.error("Error updating review", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const success = await ReviewQueueService.deleteReview(id, session.user.id);

    if (!success) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Review deleted successfully" });
  } catch (error) {
    logger.error("Error deleting review", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
