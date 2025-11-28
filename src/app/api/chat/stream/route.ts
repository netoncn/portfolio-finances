import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import {
  ChatWithToolsService,
  type StreamChunk,
} from "@/domain/chat/services/chat-with-tools.service";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
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
});

function encodeSSE(data: StreamChunk): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validatedData = chatRequestSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          details: validatedData.error.issues,
        },
        { status: 400 },
      );
    }

    const { message, history } = validatedData.data;
    const userId = session.user.id;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const chunk of ChatWithToolsService.processMessageStream(
            userId,
            message,
            history,
          )) {
            const sseData = encodeSSE(chunk);
            controller.enqueue(encoder.encode(sseData));
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          logger.error("Chat stream error", error as Error);
          const errorChunk: StreamChunk = {
            type: "done",
            result: {
              text: "I'm sorry, an error occurred while processing your request.",
              toolCalls: [],
            },
          };
          controller.enqueue(encoder.encode(encodeSSE(errorChunk)));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    logger.error("Chat stream route error", error as Error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
