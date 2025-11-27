import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { updateBudgetSchema } from "@/domain/budgets/schemas/budget.schema";
import { BudgetService } from "@/domain/budgets/services/budget.service";
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

    const budget = await BudgetService.getById(id, session.user.id);

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    return NextResponse.json({ data: budget }, { status: 200 });
  } catch (error) {
    logger.error(
      "Error getting budget",
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

    const validatedData = updateBudgetSchema.parse({
      ...body,
      id,
      userId: session.user.id,
    });

    const budget = await BudgetService.update(validatedData);

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    CacheInvalidation.invalidateUserDashboard(session.user.id);
    CacheInvalidation.invalidateUserBudgets(session.user.id);

    return NextResponse.json({ data: budget }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    logger.error(
      "Error updating budget",
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

    const success = await BudgetService.delete(id, session.user.id);

    if (!success) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    CacheInvalidation.invalidateUserDashboard(session.user.id);
    CacheInvalidation.invalidateUserBudgets(session.user.id);

    return NextResponse.json(
      { message: "Budget deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error(
      "Error deleting budget",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
