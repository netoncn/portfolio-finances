import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { createBudgetSchema } from "@/domain/budgets/schemas/budget.schema";
import { BudgetService } from "@/domain/budgets/services/budget.service";
import type { Budget } from "@/domain/budgets/types/budget";
import { authOptions } from "@/lib/auth";
import { CacheInvalidation } from "@/lib/cache/memory-cache";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");
    const activeOnly = searchParams.get("activeOnly") === "true";

    let budgets: Budget[];
    if (activeOnly) {
      budgets = await BudgetService.listActiveByUser(session.user.id);
    } else if (period) {
      budgets = await BudgetService.listByPeriod(session.user.id, period);
    } else {
      budgets = await BudgetService.listByUser(session.user.id);
    }

    return NextResponse.json({ data: budgets }, { status: 200 });
  } catch (error) {
    logger.error(
      "Error listing budgets",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[API /api/budgets POST] Request received");

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log("[API /api/budgets POST] Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[API /api/budgets POST] Session user:", session.user.id);

    const body = await request.json();
    console.log("[API /api/budgets POST] Request body:", body);

    const validatedData = createBudgetSchema.parse({
      ...body,
      userId: session.user.id,
    });
    console.log("[API /api/budgets POST] Validated data:", validatedData);

    const budget = await BudgetService.create(validatedData);
    console.log("[API /api/budgets POST] Budget created:", budget.id);

    CacheInvalidation.invalidateUserDashboard(session.user.id);
    CacheInvalidation.invalidateUserBudgets(session.user.id);

    return NextResponse.json({ data: budget }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("[API /api/budgets POST] Validation error:", error.issues);
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    console.error("[API /api/budgets POST] Error creating budget:", error);
    logger.error(
      "Error creating budget",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
