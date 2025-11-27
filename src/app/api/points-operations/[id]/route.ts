import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { updatePointsOperationSchema } from "@/domain/points/schemas/points.schema";
import { PointsOperationService } from "@/domain/points/services/points-operation.service";
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

    const operation = await PointsOperationService.getById(id, session.user.id);

    if (!operation) {
      return NextResponse.json(
        { error: "Points operation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: operation }, { status: 200 });
  } catch (error) {
    logger.error(
      "Error getting points operation",
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

    const validatedData = updatePointsOperationSchema.parse({
      ...body,
      id,
      userId: session.user.id,
    });

    const operation = await PointsOperationService.update(validatedData);

    if (!operation) {
      return NextResponse.json(
        { error: "Points operation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: operation }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    logger.error(
      "Error updating points operation",
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

    const success = await PointsOperationService.delete(id, session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: "Points operation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Points operation deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error(
      "Error deleting points operation",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
