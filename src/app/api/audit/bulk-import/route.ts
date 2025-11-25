import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { TransactionService } from "@/domain/transactions/services/transaction.service";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { importId, batchSize, successCount, errorCount, duplicateCount } =
      body;

    if (
      !importId ||
      typeof batchSize !== "number" ||
      typeof successCount !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    await TransactionService.recordBulkImport(session.user.id, importId, {
      batchSize,
      successCount,
      errorCount: errorCount || 0,
      duplicateCount: duplicateCount || 0,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logger.error(
      "Error recording bulk import audit",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
