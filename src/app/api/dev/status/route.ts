import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isDevelopment } from "@/config/env";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface SystemStatus {
  environment: {
    nodeEnv: string;
    appEnv: string;
    isDevelopment: boolean;
    isProduction: boolean;
  };
  runtime: {
    uptime: number;
    uptimeFormatted: string;
    memoryUsage: {
      heapUsed: string;
      heapTotal: string;
      external: string;
      rss: string;
    };
    nodeVersion: string;
    platform: string;
    arch: string;
  };
  services: {
    firebase: { configured: boolean; projectId: string | null };
    auth: { configured: boolean; provider: string };
    ai: {
      enabled: boolean;
      provider: string | null;
      model: string | null;
      quotaEnabled: boolean;
    };
  };
  features: {
    aiFeatures: boolean;
    firebaseEmulator: boolean;
    nextAuthDebug: boolean;
  };
  timestamp: string;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(" ");
}

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

export async function GET() {
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
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    const status: SystemStatus = {
      environment: {
        nodeEnv: process.env.NODE_ENV || "unknown",
        appEnv: process.env.NEXT_PUBLIC_APP_ENV || "unknown",
        isDevelopment: isDevelopment(),
        isProduction: process.env.NODE_ENV === "production",
      },
      runtime: {
        uptime,
        uptimeFormatted: formatUptime(uptime),
        memoryUsage: {
          heapUsed: formatBytes(memoryUsage.heapUsed),
          heapTotal: formatBytes(memoryUsage.heapTotal),
          external: formatBytes(memoryUsage.external),
          rss: formatBytes(memoryUsage.rss),
        },
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      services: {
        firebase: {
          configured: !!process.env.FIREBASE_PROJECT_ID,
          projectId: process.env.FIREBASE_PROJECT_ID
            ? `${process.env.FIREBASE_PROJECT_ID.slice(0, 8)}...`
            : null,
        },
        auth: {
          configured: !!process.env.NEXTAUTH_SECRET,
          provider: "google",
        },
        ai: {
          enabled: process.env.NEXT_PUBLIC_ENABLE_AI_FEATURES === "true",
          provider: process.env.LLM_PROVIDER || null,
          model: getActiveModel(),
          quotaEnabled: process.env.AI_QUOTA_ENABLED !== "false",
        },
      },
      features: {
        aiFeatures: process.env.NEXT_PUBLIC_ENABLE_AI_FEATURES === "true",
        firebaseEmulator:
          process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true",
        nextAuthDebug: process.env.NEXTAUTH_DEBUG === "true",
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(status, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Status check failed:", error);
    return NextResponse.json(
      {
        error: "Failed to get system status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

function getActiveModel(): string | null {
  const provider = process.env.LLM_PROVIDER;
  switch (provider) {
    case "openai":
      return process.env.OPENAI_MODEL || "gpt-4o-mini";
    case "anthropic":
      return process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
    case "google":
      return process.env.GOOGLE_MODEL || "gemini-1.5-flash";
    default:
      return null;
  }
}
