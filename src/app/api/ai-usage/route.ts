import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { UsageTrackingService } from "@/domain/ai-usage";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const quotaCheck = await UsageTrackingService.checkQuota(userId);

    const quota = await UsageTrackingService.getOrCreateQuota(userId);

    return NextResponse.json({
      success: true,
      data: {
        quota: {
          plan: quota.plan,
          period: quota.currentPeriod,
          periodStart: quota.periodStartDate,
          periodEnd: quota.periodEndDate,
          limits: {
            requests: quota.maxRequestsPerMonth,
            tokens: quota.maxTokensPerMonth,
            cost: quota.maxCostPerMonth,
          },
          current: {
            requests: quota.currentRequests,
            tokens: quota.currentTokens,
            cost: quota.currentCost,
          },
          remaining: quotaCheck.remaining,
          usage: quotaCheck.usage,
          status: {
            allowed: quotaCheck.allowed,
            isBlocked: quota.isBlocked,
            blockReason: quota.blockReason,
            alertThreshold: quota.alertThreshold,
          },
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching AI usage", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
