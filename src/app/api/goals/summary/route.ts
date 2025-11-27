import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { GoalService } from "@/domain/goals/services/goal.service";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const summary = await GoalService.getSummary(session.user.id);

    return NextResponse.json({ data: summary }, { status: 200 });
  } catch (error) {
    logger.error(
      "Error getting goals summary",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
