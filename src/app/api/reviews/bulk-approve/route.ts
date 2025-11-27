import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError, z } from "zod";
import { ReviewQueueService } from "@/domain/transactions/services/review-queue.service";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const bulkApproveSchema = z.object({
  reviewIds: z.array(z.string()).min(1).max(50),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = bulkApproveSchema.parse(body);

    const count = await ReviewQueueService.bulkApprove(
      session.user.id,
      validatedData.reviewIds,
    );

    return NextResponse.json({
      success: true,
      count,
      message: `${count} reviews approved`,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    logger.error("Error in bulk approve", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
