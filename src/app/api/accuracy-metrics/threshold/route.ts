import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AccuracyMetricsService } from "@/domain/accuracy-metrics";
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
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");

    if (!period) {
      return NextResponse.json(
        { error: "Period is required (YYYY-MM format)" },
        { status: 400 },
      );
    }

    // Validate period format
    if (!/^\d{4}-\d{2}$/.test(period)) {
      return NextResponse.json(
        { error: "Invalid period format. Use YYYY-MM" },
        { status: 400 },
      );
    }

    const recommendation =
      await AccuracyMetricsService.getThresholdRecommendation(userId, period);

    return NextResponse.json({
      success: true,
      data: recommendation,
    });
  } catch (error) {
    logger.error("Error calculating threshold recommendation", error as Error);
    return NextResponse.json(
      {
        error: "Failed to calculate recommendation",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
