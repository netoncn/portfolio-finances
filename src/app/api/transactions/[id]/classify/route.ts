import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { CategoryService } from "@/domain/categories/services/category.service";
import { ReviewQueueService } from "@/domain/transactions/services/review-queue.service";
import { TransactionService } from "@/domain/transactions/services/transaction.service";
import { authOptions } from "@/lib/auth";
import { ClassificationPipeline } from "@/lib/classification/classification-pipeline";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  _request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const userId = session.user.id;

    const transaction = await TransactionService.getById(id, userId);
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    const categories = await CategoryService.listByUser(userId);
    const rules: any[] = []; // TODO: Implement RuleService to get user's rules

    const allTransactions = await TransactionService.listByUser(userId);
    const recentTransactions = allTransactions
      .sort((a, b) => b.date - a.date)
      .slice(0, 10);

    const pipeline = new ClassificationPipeline();
    const result = await pipeline.classify(transaction, {
      rules,
      categories,
      recentTransactions,
    });

    if (result.shouldSave) {
      await TransactionService.update({
        id,
        userId,
        ...result.appliedChanges,
      });

      return NextResponse.json({
        success: true,
        applied: true,
        decision: result.decision,
        message: "Transaction classified and updated automatically",
      });
    }

    if (result.shouldQueue) {
      const review = await ReviewQueueService.addToQueue(
        userId,
        transaction,
        result.decision,
      );

      return NextResponse.json({
        success: true,
        applied: false,
        queued: true,
        decision: result.decision,
        reviewId: review.id,
        message: "Transaction added to review queue",
      });
    }

    return NextResponse.json({
      success: true,
      applied: false,
      queued: false,
      decision: result.decision,
      message: "No automatic classification available",
    });
  } catch (error) {
    logger.error("Error classifying transaction", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
