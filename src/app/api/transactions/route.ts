import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { createTransactionSchema } from "@/domain/transactions/schemas/transaction.schema";
import { TransactionService } from "@/domain/transactions/services/transaction.service";
import type { Transaction } from "@/domain/transactions/types/transaction";
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
    const accountType = searchParams.get("accountType");
    const cardBrand = searchParams.get("cardBrand");

    let transactions: Transaction[];

    if (accountId) {
      transactions = await TransactionService.listByAccount(
        accountId,
        session.user.id,
      );
    } else if (accountType) {
      transactions = await TransactionService.listByAccountType(
        session.user.id,
        accountType,
      );
    } else if (cardBrand) {
      transactions = await TransactionService.listByCardBrand(
        session.user.id,
        cardBrand,
      );
    } else {
      transactions = await TransactionService.listByUser(session.user.id);
    }

    return NextResponse.json({ data: transactions }, { status: 200 });
  } catch (error) {
    logger.error(
      "Error listing transactions",
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
    const { searchParams } = new URL(request.url);
    const sourceParam = searchParams.get("source");

    const validatedData = createTransactionSchema.parse({
      ...body,
      userId: session.user.id,
    });

    const source = sourceParam === "import" ? "import" : "web";
    const transaction = await TransactionService.create(validatedData, source);

    return NextResponse.json({ data: transaction }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    logger.error(
      "Error creating transaction",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
