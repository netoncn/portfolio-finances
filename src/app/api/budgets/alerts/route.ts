import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { BudgetAlertService } from "@/domain/budgets/services/budget-alert.service";
import { authOptions } from "@/lib/auth";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alerts = await BudgetAlertService.getActiveAlerts(session.user.id);
    const counts = BudgetAlertService.getAlertCounts(alerts);
    const hasCritical = BudgetAlertService.hasCriticalAlerts(alerts);

    return NextResponse.json(
      {
        data: {
          alerts,
          counts,
          hasCritical,
          total: alerts.length,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching budget alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget alerts" },
      { status: 500 },
    );
  }
}
