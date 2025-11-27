import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { createPointsBalanceSchema } from "@/domain/points/schemas/points.schema";
import { PointsBalanceService } from "@/domain/points/services/points-balance.service";
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
    const programId = searchParams.get("programId");
    const status = searchParams.get("status");
    const expiringDays = searchParams.get("expiringDays");

    let balances: Awaited<ReturnType<typeof PointsBalanceService.listByUser>>;

    if (expiringDays) {
      balances = await PointsBalanceService.listExpiringSoon(
        session.user.id,
        parseInt(expiringDays, 10),
      );
    } else if (status === "active") {
      balances = await PointsBalanceService.listActive(
        session.user.id,
        programId || undefined,
      );
    } else if (programId) {
      balances = await PointsBalanceService.listByProgram(
        session.user.id,
        programId,
      );
    } else {
      balances = await PointsBalanceService.listByUser(session.user.id);
    }

    return NextResponse.json({ data: balances }, { status: 200 });
  } catch (error) {
    logger.error(
      "Error listing points balances",
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

    const validatedData = createPointsBalanceSchema.parse({
      ...body,
      userId: session.user.id,
    });

    const balance = await PointsBalanceService.create(validatedData);

    return NextResponse.json({ data: balance }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    logger.error(
      "Error creating points balance",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
