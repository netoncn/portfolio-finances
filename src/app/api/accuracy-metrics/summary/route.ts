import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AccuracyMetricsService } from "@/domain/accuracy-metrics";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const summary = await AccuracyMetricsService.getMetricsSummary(userId);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error("Error fetching metrics summary", error as Error);
    return NextResponse.json(
      {
        error: "Failed to fetch summary",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
