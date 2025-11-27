import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { InvestmentAccountService } from "@/domain/investments/services/investment-account.service";
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

    const success = await InvestmentAccountService.unarchive(
      id,
      session.user.id,
    );

    if (!success) {
      return NextResponse.json(
        { error: "Investment account not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Investment account unarchived successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error(
      "Error unarchiving investment account",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
