import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { createPointsOfferSchema } from "@/domain/points/schemas/points.schema";
import { PointsOfferService } from "@/domain/points/services/points-offer.service";
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
    const program = searchParams.get("program");
    const expiringSoon = searchParams.get("expiringSoon");
    const highBonus = searchParams.get("highBonus");

    let offers: Awaited<ReturnType<typeof PointsOfferService.listAll>>;

    if (program) {
      offers = await PointsOfferService.listByProgram(
        program as Parameters<typeof PointsOfferService.listByProgram>[0],
      );
    } else if (expiringSoon) {
      const days = Number.parseInt(expiringSoon, 10) || 7;
      offers = await PointsOfferService.listExpiringSoon(days);
    } else if (highBonus) {
      const minBonus = Number.parseFloat(highBonus) || 50;
      offers = await PointsOfferService.listHighBonus(minBonus);
    } else {
      offers = await PointsOfferService.listAll();
    }

    return NextResponse.json({ data: offers }, { status: 200 });
  } catch (error) {
    logger.error(
      "Error listing points offers",
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

    const validatedData = createPointsOfferSchema.parse(body);

    const offer = await PointsOfferService.create(validatedData);

    return NextResponse.json({ data: offer }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    logger.error(
      "Error creating points offer",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
