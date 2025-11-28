import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AITelemetryService } from "@/domain/ai-usage";
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
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const startDate = searchParams.get("startDate")
      ? Number.parseInt(searchParams.get("startDate")!, 10)
      : thirtyDaysAgo;

    const endDate = searchParams.get("endDate")
      ? Number.parseInt(searchParams.get("endDate")!, 10)
      : now;

    const toolStats = await AITelemetryService.getToolUsageStats(
      userId,
      startDate,
      endDate,
    );

    return NextResponse.json({
      success: true,
      data: {
        tools: toolStats,
        timeRange: {
          startDate,
          endDate,
        },
        summary: {
          totalTools: toolStats.length,
          totalCalls: toolStats.reduce((sum, t) => sum + t.totalCalls, 0),
          totalSuccessful: toolStats.reduce(
            (sum, t) => sum + t.successfulCalls,
            0,
          ),
          totalFailed: toolStats.reduce((sum, t) => sum + t.failedCalls, 0),
          avgSuccessRate:
            toolStats.length > 0
              ? toolStats.reduce((sum, t) => sum + t.successRate, 0) /
                toolStats.length
              : 100,
          avgExecutionTimeMs:
            toolStats.length > 0
              ? toolStats.reduce((sum, t) => sum + t.avgExecutionTimeMs, 0) /
                toolStats.length
              : 0,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching tool usage stats", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
