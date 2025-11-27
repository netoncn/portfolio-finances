import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { createPositionSchema } from "@/domain/investments/schemas/position.schema";
import { PositionService } from "@/domain/investments/services/position.service";
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

    const positions = accountId
      ? await PositionService.listByAccount(session.user.id, accountId)
      : await PositionService.listByUser(session.user.id);

    return NextResponse.json({ data: positions }, { status: 200 });
  } catch (error) {
    logger.error(
      "Error listing positions",
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

    const validatedData = createPositionSchema.parse({
      ...body,
      userId: session.user.id,
    });

    const position = await PositionService.create(validatedData);

    return NextResponse.json({ data: position }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    logger.error(
      "Error creating position",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
