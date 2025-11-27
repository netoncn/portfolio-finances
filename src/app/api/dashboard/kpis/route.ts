import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AccountService } from "@/domain/accounts/services/account.service";
import { CategoryService } from "@/domain/categories/services/category.service";
import { DashboardKPIsService } from "@/domain/dashboard/services/dashboard-kpis.service";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 },
      );
    }

    const periodStart = Number.parseInt(startDate, 10);
    const periodEnd = Number.parseInt(endDate, 10);

    if (Number.isNaN(periodStart) || Number.isNaN(periodEnd)) {
      return NextResponse.json(
        { error: "Invalid date parameters" },
        { status: 400 },
      );
    }

    const categories = await CategoryService.listByUser(session.user.id);
    const accounts = await AccountService.listByUser(session.user.id);

    const kpis = await DashboardKPIsService.getDashboardKPIs(
      session.user.id,
      periodStart,
      periodEnd,
      categories,
    );

    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const accountMap = new Map(accounts.map((a) => [a.id, a]));

    const enrichedInstallments = kpis.upcomingInstallments.map((inst) => ({
      ...inst,
      categoryName: inst.categoryId
        ? categoryMap.get(inst.categoryId)?.name
        : undefined,
      categoryIcon: inst.categoryId
        ? categoryMap.get(inst.categoryId)?.icon
        : undefined,
      accountName: inst.accountId
        ? accountMap.get(inst.accountId)?.name
        : undefined,
    }));

    return NextResponse.json(
      {
        data: {
          ...kpis,
          upcomingInstallments: enrichedInstallments,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching dashboard KPIs:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard KPIs" },
      { status: 500 },
    );
  }
}
