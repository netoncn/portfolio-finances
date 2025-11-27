import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { createPointsOperationSchema } from "@/domain/points/schemas/points.schema";
import { PointsOperationService } from "@/domain/points/services/points-operation.service";
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
    const type = searchParams.get("type") as
      | "earn"
      | "redeem"
      | "transfer_in"
      | "transfer_out"
      | "adjust"
      | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let operations: Awaited<
      ReturnType<typeof PointsOperationService.listByUser>
    >;

    if (startDate && endDate) {
      operations = await PointsOperationService.listByDateRange(
        session.user.id,
        parseInt(startDate, 10),
        parseInt(endDate, 10),
      );
    } else if (type) {
      operations = await PointsOperationService.listByType(
        session.user.id,
        type,
      );
    } else if (programId) {
      operations = await PointsOperationService.listByProgram(
        session.user.id,
        programId,
      );
    } else {
      operations = await PointsOperationService.listByUser(session.user.id);
    }

    return NextResponse.json({ data: operations }, { status: 200 });
  } catch (error) {
    logger.error(
      "Error listing points operations",
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

    const validatedData = createPointsOperationSchema.parse({
      ...body,
      userId: session.user.id,
    });

    const operation = await PointsOperationService.create(validatedData);

    return NextResponse.json({ data: operation }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    logger.error(
      "Error creating points operation",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
