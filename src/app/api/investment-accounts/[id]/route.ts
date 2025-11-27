import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { updateInvestmentAccountSchema } from "@/domain/investments/schemas/investment-account.schema";
import { InvestmentAccountService } from "@/domain/investments/services/investment-account.service";
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

    const account = await InvestmentAccountService.getById(id, session.user.id);

    if (!account) {
      return NextResponse.json(
        { error: "Investment account not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: account }, { status: 200 });
  } catch (error) {
    logger.error(
      "Error getting investment account",
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

    const validatedData = updateInvestmentAccountSchema.parse({
      ...body,
      id,
      userId: session.user.id,
    });

    const account = await InvestmentAccountService.update(validatedData);

    if (!account) {
      return NextResponse.json(
        { error: "Investment account not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: account }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    logger.error(
      "Error updating investment account",
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

    const success = await InvestmentAccountService.archive(id, session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: "Investment account not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Investment account archived successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error(
      "Error archiving investment account",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
