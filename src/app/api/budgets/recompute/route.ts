import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { BudgetRecomputeService } from "@/domain/budgets/services/budget-recompute.service";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await BudgetRecomputeService.recomputeAllBudgets(
      session.user.id,
    );

    return NextResponse.json(
      {
        data: result,
        message: `Recomputed ${result.success} budgets successfully${result.failed > 0 ? ` (${result.failed} failed)` : ""}`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error recomputing budgets:", error);
    return NextResponse.json(
      { error: "Failed to recompute budgets" },
      { status: 500 },
    );
  }
}
