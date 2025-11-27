import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
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
    const calculate = searchParams.get("calculate") === "true";

    if (!period) {
      return NextResponse.json(
        { error: "Period is required (YYYY-MM format)" },
        { status: 400 },
      );
    }

    if (!/^\d{4}-\d{2}$/.test(period)) {
      return NextResponse.json(
        { error: "Invalid period format. Use YYYY-MM" },
        { status: 400 },
      );
    }

    let metrics = await AccuracyMetricsService.getMetrics(userId, period);

    if (!metrics && calculate) {
      try {
        metrics = await AccuracyMetricsService.calculateMetrics({
          userId,
          period,
        });
      } catch (error) {
        return NextResponse.json(
          {
            error: "Failed to calculate metrics",
            details: (error as Error).message,
          },
          { status: 500 },
        );
      }
    }

    if (!metrics) {
      return NextResponse.json(
        { error: "No metrics available for this period" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error("Error fetching accuracy metrics", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    const schema = z.object({
      period: z
        .string()
        .regex(/^\d{4}-\d{2}$/, "Period must be YYYY-MM format"),
      minSamples: z.number().optional(),
    });

    const validated = schema.parse(body);

    const metrics = await AccuracyMetricsService.calculateMetrics({
      userId,
      period: validated.period,
      minSamples: validated.minSamples,
    });

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    logger.error("Error calculating accuracy metrics", error as Error);
    return NextResponse.json(
      {
        error: "Failed to calculate metrics",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
