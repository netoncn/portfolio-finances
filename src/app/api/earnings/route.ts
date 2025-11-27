import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { createEarningSchema } from "@/domain/investments/schemas/earning.schema";
import { EarningService } from "@/domain/investments/services/earning.service";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const positionId = searchParams.get("positionId");
    const ticker = searchParams.get("ticker");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = searchParams.get("limit");

    let earnings: Awaited<ReturnType<typeof EarningService.listByUser>>;

    if (accountId) {
      earnings = await EarningService.listByAccount(
        session.user.id,
        accountId,
        limit ? Number.parseInt(limit, 10) : undefined,
      );
    } else if (positionId) {
      earnings = await EarningService.listByPosition(
        session.user.id,
        positionId,
        limit ? Number.parseInt(limit, 10) : undefined,
      );
    } else if (ticker) {
      earnings = await EarningService.listByTicker(
        session.user.id,
        ticker,
        limit ? Number.parseInt(limit, 10) : undefined,
      );
    } else if (startDate && endDate) {
      earnings = await EarningService.listByDateRange(
        session.user.id,
        Number.parseInt(startDate, 10),
        Number.parseInt(endDate, 10),
      );
    } else {
      earnings = await EarningService.listByUser(
        session.user.id,
        limit ? Number.parseInt(limit, 10) : undefined,
      );
    }

    return NextResponse.json({ data: earnings }, { status: 200 });
  } catch (error) {
    logger.error(
      "Error listing earnings",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const validatedData = createEarningSchema.parse({
      ...body,
      userId: session.user.id,
    });

    const earning = await EarningService.create(validatedData);

    return NextResponse.json({ data: earning }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    logger.error(
      "Error creating earning",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
