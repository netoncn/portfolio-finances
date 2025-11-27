import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { AIUsageRecord } from "@/domain/ai-usage/types/usage";
import { authOptions } from "@/lib/auth";
import { adminDb as db } from "@/lib/firebase/firestore.admin";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    const period = searchParams.get("period") || getCurrentPeriod();
    const limitParam = searchParams.get("limit");
    const limit = limitParam
      ? Math.min(Number.parseInt(limitParam, 10), 500)
      : 100;
    const feature = searchParams.get("feature");

    const [year, month] = period.split("-").map(Number);
    const periodStart = new Date(year, month - 1, 1).getTime();
    const periodEnd = new Date(year, month, 0, 23, 59, 59, 999).getTime();

    let query = db
      .collection("aiUsage")
      .where("userId", "==", userId)
      .where("timestamp", ">=", periodStart)
      .where("timestamp", "<=", periodEnd)
      .orderBy("timestamp", "desc")
      .limit(limit);

    if (feature) {
      query = query.where("feature", "==", feature);
    }

    const snapshot = await query.get();

    const records: AIUsageRecord[] = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    })) as AIUsageRecord[];

    const summary = records.reduce(
      (acc, record) => {
        acc.totalRequests++;
        acc.totalTokens += record.totalTokens;
        acc.totalCost += record.estimatedCost;

        if (record.success) {
          acc.successfulRequests++;
        } else {
          acc.failedRequests++;
        }

        if (!acc.byFeature[record.feature]) {
          acc.byFeature[record.feature] = {
            requests: 0,
            tokens: 0,
            cost: 0,
          };
        }
        acc.byFeature[record.feature].requests++;
        acc.byFeature[record.feature].tokens += record.totalTokens;
        acc.byFeature[record.feature].cost += record.estimatedCost;

        if (!acc.byProvider[record.provider]) {
          acc.byProvider[record.provider] = {
            requests: 0,
            tokens: 0,
            cost: 0,
          };
        }
        acc.byProvider[record.provider].requests++;
        acc.byProvider[record.provider].tokens += record.totalTokens;
        acc.byProvider[record.provider].cost += record.estimatedCost;

        return acc;
      },
      {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        byFeature: {} as any,
        byProvider: {} as any,
      },
    );

    return NextResponse.json({
      success: true,
      data: {
        period,
        records,
        summary,
        count: records.length,
      },
    });
  } catch (error) {
    logger.error("Error fetching AI usage history", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function getCurrentPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
