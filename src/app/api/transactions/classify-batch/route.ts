import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { CategoryService } from "@/domain/categories/services/category.service";
import { batchClassificationRequestSchema } from "@/domain/transactions/schemas/classification.schema";
import { ReviewQueueService } from "@/domain/transactions/services/review-queue.service";
import { TransactionService } from "@/domain/transactions/services/transaction.service";
import { authOptions } from "@/lib/auth";
import { ClassificationPipeline } from "@/lib/classification/classification-pipeline";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    const validatedData = batchClassificationRequestSchema.parse({
      ...body,
      userId,
    });

    const { transactionIds, forceAI, confidenceThreshold } = validatedData;

    const transactions = await Promise.all(
      transactionIds.map((id) => TransactionService.getById(id, userId)),
    );

    const validTransactions = transactions.filter((t) => t !== null);

    if (validTransactions.length === 0) {
      return NextResponse.json(
        { error: "No valid transactions found" },
        { status: 404 },
      );
    }

    const categories = await CategoryService.listByUser(userId);
    const rules: any[] = []; // TODO: Implement RuleService to get user's rules

    const allTransactions = await TransactionService.listByUser(userId);
    const recentTransactions = allTransactions
      .sort((a, b) => b.date - a.date)
      .slice(0, 20);

    const pipeline = new ClassificationPipeline({
      enableAI: true,
      onlyUseAIWhenNoRule: !forceAI,
      reviewThreshold: confidenceThreshold,
    });

    const results = await pipeline.classifyBatch(validTransactions, {
      rules,
      categories,
      recentTransactions,
    });

    const stats = {
      total: results.size,
      applied: 0,
      queued: 0,
      skipped: 0,
    };

    const updatedTransactions: string[] = [];
    const queuedReviews: string[] = [];

    for (const [transactionId, result] of results.entries()) {
      if (result.shouldSave) {
        await TransactionService.update({
          id: transactionId,
          userId,
          ...result.appliedChanges,
        });
        updatedTransactions.push(transactionId);
        stats.applied++;
      } else if (result.shouldQueue) {
        const transaction = validTransactions.find(
          (t) => t.id === transactionId,
        );
        if (transaction) {
          const review = await ReviewQueueService.addToQueue(
            userId,
            transaction,
            result.decision,
          );
          queuedReviews.push(review.id);
          stats.queued++;
        }
      } else {
        stats.skipped++;
      }
    }

    const pipelineStats = pipeline.getStats(results);

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        ...pipelineStats,
      },
      updatedTransactions,
      queuedReviews,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    logger.error("Error in batch classification", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
