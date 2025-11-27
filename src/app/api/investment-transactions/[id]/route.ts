import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { updateInvestmentTransactionSchema } from "@/domain/investments/schemas/investment-transaction.schema";
import { InvestmentTransactionService } from "@/domain/investments/services/investment-transaction.service";
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

    const transaction = await InvestmentTransactionService.getById(
      id,
      session.user.id,
    );

    if (!transaction) {
      return NextResponse.json(
        { error: "Investment transaction not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: transaction }, { status: 200 });
  } catch (error) {
    logger.error(
      "Error getting investment transaction",
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

    const validatedData = updateInvestmentTransactionSchema.parse({
      ...body,
      id,
      userId: session.user.id,
    });

    const transaction =
      await InvestmentTransactionService.update(validatedData);

    if (!transaction) {
      return NextResponse.json(
        { error: "Investment transaction not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: transaction }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    logger.error(
      "Error updating investment transaction",
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

    const success = await InvestmentTransactionService.delete(
      id,
      session.user.id,
    );

    if (!success) {
      return NextResponse.json(
        { error: "Investment transaction not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Investment transaction deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error(
      "Error deleting investment transaction",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
