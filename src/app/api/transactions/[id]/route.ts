import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { BudgetRecomputeService } from "@/domain/budgets/services/budget-recompute.service";
import { updateTransactionSchema } from "@/domain/transactions/schemas/transaction.schema";
import { TransactionService } from "@/domain/transactions/services/transaction.service";
import { authOptions } from "@/lib/auth";
import { CacheInvalidation } from "@/lib/cache/memory-cache";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const transaction = await TransactionService.getById(id, session.user.id);

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: transaction }, { status: 200 });
  } catch (error) {
    logger.error(
      "Error getting transaction",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    const oldTransaction = await TransactionService.getById(
      id,
      session.user.id,
    );

    const validatedData = updateTransactionSchema.parse({
      ...body,
      id,
      userId: session.user.id,
    });

    const transaction = await TransactionService.update(validatedData);

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    if (oldTransaction) {
      BudgetRecomputeService.recomputeAffectedBudgets(
        session.user.id,
        transaction,
        oldTransaction,
      ).catch((error: unknown) => {
        logger.error(
          "Failed to recompute budgets after transaction update",
          error instanceof Error ? error : undefined,
        );
      });
    }

    CacheInvalidation.invalidateUser(session.user.id);

    return NextResponse.json({ data: transaction }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    logger.error(
      "Error updating transaction",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const transaction = await TransactionService.getById(id, session.user.id);

    const success = await TransactionService.delete(id, session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    if (transaction) {
      const deletedTransaction = { ...transaction, amount: 0 };
      BudgetRecomputeService.recomputeAffectedBudgets(
        session.user.id,
        deletedTransaction,
        transaction,
      ).catch((error: unknown) => {
        logger.error(
          "Failed to recompute budgets after transaction delete",
          error instanceof Error ? error : undefined,
        );
      });
    }

    CacheInvalidation.invalidateUser(session.user.id);

    return NextResponse.json(
      { message: "Transaction deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error(
      "Error deleting transaction",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
