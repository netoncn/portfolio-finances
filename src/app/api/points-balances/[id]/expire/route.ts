import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PointsBalanceService } from "@/domain/points/services/points-balance.service";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const success = await PointsBalanceService.markAsExpired(
      id,
      session.user.id,
    );

    if (!success) {
      return NextResponse.json(
        { error: "Points balance not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Points balance marked as expired" },
      { status: 200 },
    );
  } catch (error) {
    logger.error(
      "Error marking points balance as expired",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
