import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ReviewQueueService } from "@/domain/transactions/services/review-queue.service";
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

    const status = searchParams.get("status") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const limit = searchParams.get("limit")
      ? Number.parseInt(searchParams.get("limit")!, 10)
      : 50;

    const reviews = await ReviewQueueService.getReviews(userId, {
      status,
      priority,
      limit,
    });

    const stats = await ReviewQueueService.getQueueStats(userId);

    return NextResponse.json({
      data: reviews,
      stats,
    });
  } catch (error) {
    logger.error("Error fetching reviews", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
