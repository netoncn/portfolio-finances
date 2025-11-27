import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { updatePointsBalanceSchema } from "@/domain/points/schemas/points.schema";
import { PointsBalanceService } from "@/domain/points/services/points-balance.service";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const balance = await PointsBalanceService.getById(id, session.user.id);

    if (!balance) {
      return NextResponse.json(
        { error: "Points balance not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: balance }, { status: 200 });
  } catch (error) {
    logger.error(
      "Error getting points balance",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    const validatedData = updatePointsBalanceSchema.parse({
      ...body,
      id,
      userId: session.user.id,
    });

    const balance = await PointsBalanceService.update(validatedData);

    if (!balance) {
      return NextResponse.json(
        { error: "Points balance not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: balance }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    logger.error(
      "Error updating points balance",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const success = await PointsBalanceService.delete(id, session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: "Points balance not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Points balance deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error(
      "Error deleting points balance",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
