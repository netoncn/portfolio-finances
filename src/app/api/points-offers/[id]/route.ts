import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { updatePointsOfferSchema } from "@/domain/points/schemas/points.schema";
import { PointsOfferService } from "@/domain/points/services/points-offer.service";
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

    const offer = await PointsOfferService.getById(id);

    if (!offer) {
      return NextResponse.json(
        { error: "Points offer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: offer }, { status: 200 });
  } catch (error) {
    logger.error(
      "Error getting points offer",
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

    const validatedData = updatePointsOfferSchema.parse({
      ...body,
      id,
    });

    const offer = await PointsOfferService.update(validatedData);

    if (!offer) {
      return NextResponse.json(
        { error: "Points offer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: offer }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    logger.error(
      "Error updating points offer",
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

    const success = await PointsOfferService.delete(id);

    if (!success) {
      return NextResponse.json(
        { error: "Points offer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Points offer deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error(
      "Error deleting points offer",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
