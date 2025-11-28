import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isDevelopment } from "@/config/env";
import { authOptions } from "@/lib/auth";
import {
  clearLogs,
  getLogStats,
  getLogs,
  type LogLevel,
} from "@/lib/dev-logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  // Only allow in development
  if (!isDevelopment()) {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode" },
      { status: 403 },
    );
  }

  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level") as LogLevel | null;
    const limit = searchParams.get("limit");
    const source = searchParams.get("source");
    const search = searchParams.get("search");

    const logs = getLogs({
      level: level || undefined,
      limit: limit ? parseInt(limit, 10) : 100,
      source: source || undefined,
      search: search || undefined,
    });

    const stats = getLogStats();

    return NextResponse.json(
      { logs, stats },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error("Failed to get logs:", error);
    return NextResponse.json(
      {
        error: "Failed to get logs",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  // Only allow in development
  if (!isDevelopment()) {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode" },
      { status: 403 },
    );
  }

  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    clearLogs();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to clear logs:", error);
    return NextResponse.json(
      {
        error: "Failed to clear logs",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
