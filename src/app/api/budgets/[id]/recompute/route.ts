import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { BudgetRecomputeService } from "@/domain/budgets/services/budget-recompute.service";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const budget = await BudgetRecomputeService.recomputeBudgetById(
      id,
      session.user.id,
    );

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        data: budget,
        message: "Budget recomputed successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error recomputing budget:", error);
    return NextResponse.json(
      { error: "Failed to recompute budget" },
      { status: 500 },
    );
  }
}
