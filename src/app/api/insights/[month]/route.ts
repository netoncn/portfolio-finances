import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { InsightsService } from "@/domain/insights/services/insights.service";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ month: string }>;
};

export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { month } = await context.params;
    const userId = session.user.id;

    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "Invalid month format. Use YYYY-MM" },
        { status: 400 },
      );
    }

    const insights = await InsightsService.generateMonthlyInsights({
      userId,
      month,
      includeAI: true,
      forceRegenerate: false,
    });

    return NextResponse.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    logger.error("Error generating insights", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
