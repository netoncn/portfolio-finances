import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { updateEarningSchema } from "@/domain/investments/schemas/earning.schema";
import { EarningService } from "@/domain/investments/services/earning.service";
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

    const earning = await EarningService.getById(id, session.user.id);

    if (!earning) {
      return NextResponse.json({ error: "Earning not found" }, { status: 404 });
    }

    return NextResponse.json({ data: earning }, { status: 200 });
  } catch (error) {
    logger.error(
      "Error getting earning",
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

    const validatedData = updateEarningSchema.parse({
      ...body,
      id,
      userId: session.user.id,
    });

    const earning = await EarningService.update(validatedData);

    if (!earning) {
      return NextResponse.json({ error: "Earning not found" }, { status: 404 });
    }

    return NextResponse.json({ data: earning }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    logger.error(
      "Error updating earning",
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

    const success = await EarningService.delete(id, session.user.id);

    if (!success) {
      return NextResponse.json({ error: "Earning not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Earning deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error(
      "Error deleting earning",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
