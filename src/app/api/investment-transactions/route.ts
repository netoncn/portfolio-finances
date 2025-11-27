import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { createInvestmentTransactionSchema } from "@/domain/investments/schemas/investment-transaction.schema";
import { InvestmentTransactionService } from "@/domain/investments/services/investment-transaction.service";
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
    const positionId = searchParams.get("positionId");
    const ticker = searchParams.get("ticker");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = searchParams.get("limit");

    let transactions: Awaited<
      ReturnType<typeof InvestmentTransactionService.listByUser>
    >;

    if (accountId) {
      transactions = await InvestmentTransactionService.listByAccount(
        session.user.id,
        accountId,
        limit ? Number.parseInt(limit, 10) : undefined,
      );
    } else if (positionId) {
      transactions = await InvestmentTransactionService.listByPosition(
        session.user.id,
        positionId,
        limit ? Number.parseInt(limit, 10) : undefined,
      );
    } else if (ticker) {
      transactions = await InvestmentTransactionService.listByTicker(
        session.user.id,
        ticker,
        limit ? Number.parseInt(limit, 10) : undefined,
      );
    } else if (startDate && endDate) {
      transactions = await InvestmentTransactionService.listByDateRange(
        session.user.id,
        Number.parseInt(startDate, 10),
        Number.parseInt(endDate, 10),
      );
    } else {
      transactions = await InvestmentTransactionService.listByUser(
        session.user.id,
        limit ? Number.parseInt(limit, 10) : undefined,
      );
    }

    return NextResponse.json({ data: transactions }, { status: 200 });
  } catch (error) {
    logger.error(
      "Error listing investment transactions",
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

    const validatedData = createInvestmentTransactionSchema.parse({
      ...body,
      userId: session.user.id,
    });

    const transaction =
      await InvestmentTransactionService.create(validatedData);

    return NextResponse.json({ data: transaction }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    logger.error(
      "Error creating investment transaction",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
