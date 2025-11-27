import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { SampleCollectionService } from "@/domain/accuracy-metrics";
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
    const period = searchParams.get("period") || undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number.parseInt(limitParam, 10) : 100;
    const getStatus = searchParams.get("status") === "true";

    if (getStatus) {
      const status = await SampleCollectionService.getCollectionStatus(userId);
      return NextResponse.json({
        success: true,
        data: status,
      });
    }

    const samples = await SampleCollectionService.getSamples(
      userId,
      period,
      limit,
    );

    return NextResponse.json({
      success: true,
      data: {
        samples,
        count: samples.length,
        period,
      },
    });
  } catch (error) {
    logger.error("Error fetching samples", error as Error);
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
      reviewIds: z.array(z.string()).optional(),
    });

    const validated = schema.parse(body);

    const stats = await SampleCollectionService.processReviewsToSamples(
      userId,
      validated.reviewIds,
    );

    return NextResponse.json({
      success: true,
      data: stats,
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

    logger.error("Error processing reviews to samples", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Sample ID is required" },
        { status: 400 },
      );
    }

    const deleted = await SampleCollectionService.deleteSample(id, userId);

    if (!deleted) {
      return NextResponse.json({ error: "Sample not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Sample deleted",
    });
  } catch (error) {
    logger.error("Error deleting sample", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
