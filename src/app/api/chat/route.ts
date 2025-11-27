import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { ChatService } from "@/domain/chat/services/chat.service";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const chatRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(1000),
  history: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
        timestamp: z.number(),
      }),
    )
    .optional()
    .default([]),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format")
    .optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    const validatedData = chatRequestSchema.parse(body);

    const month =
      validatedData.month ||
      (() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      })();

    const context = await ChatService.buildFinancialContext(userId, month);

    const response = await ChatService.processMessage(
      userId,
      validatedData.message,
      context,
      validatedData.history,
    );

    return NextResponse.json({
      success: true,
      data: {
        message: response,
        context,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    logger.error("Error processing chat message", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
