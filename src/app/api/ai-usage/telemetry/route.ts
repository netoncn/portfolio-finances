import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AITelemetryService, type TelemetryTimeRange } from "@/domain/ai-usage";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const startDate = searchParams.get("startDate")
      ? Number.parseInt(searchParams.get("startDate")!, 10)
      : sevenDaysAgo;

    const endDate = searchParams.get("endDate")
      ? Number.parseInt(searchParams.get("endDate")!, 10)
      : now;

    const granularity = (searchParams.get("granularity") || "day") as
      | "hour"
      | "day"
      | "week"
      | "month";

    if (!["hour", "day", "week", "month"].includes(granularity)) {
      return NextResponse.json(
        { error: "Invalid granularity. Must be: hour, day, week, or month" },
        { status: 400 },
      );
    }

    const timeRange: TelemetryTimeRange = {
      startDate,
      endDate,
      granularity,
    };

    const dashboardData = await AITelemetryService.getDashboardData(
      userId,
      timeRange,
    );

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    logger.error("Error fetching AI telemetry", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
