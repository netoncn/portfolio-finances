import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { createInvestmentAccountSchema } from "@/domain/investments/schemas/investment-account.schema";
import { InvestmentAccountService } from "@/domain/investments/services/investment-account.service";
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
    const includeArchived = searchParams.get("includeArchived") === "true";

    const accounts = await InvestmentAccountService.listByUser(
      session.user.id,
      includeArchived,
    );

    return NextResponse.json({ data: accounts }, { status: 200 });
  } catch (error) {
    logger.error(
      "Error listing investment accounts",
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

    const validatedData = createInvestmentAccountSchema.parse({
      ...body,
      userId: session.user.id,
    });

    const account = await InvestmentAccountService.create(validatedData);

    return NextResponse.json({ data: account }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    logger.error(
      "Error creating investment account",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
