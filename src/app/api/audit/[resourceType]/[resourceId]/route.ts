import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AuditService } from "@/domain/audit/services/audit.service";
import type { AuditResourceType } from "@/domain/audit/types/audit";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

type AuditParams = Promise<{ resourceType: string; resourceId: string }>;

export async function GET(
  _request: NextRequest,
  { params }: { params: AuditParams },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { resourceType, resourceId } = await params;

    const validResourceTypes = [
      "account",
      "transaction",
      "installment_group",
      "statement",
      "category",
      "budget",
      "goal",
      "mapping_rule",
    ];

    if (!validResourceTypes.includes(resourceType)) {
      return NextResponse.json(
        { error: "Invalid resource type" },
        { status: 400 },
      );
    }

    const events = await AuditService.getResourceHistory(
      resourceType as AuditResourceType,
      resourceId,
      session.user.id,
    );

    return NextResponse.json({ data: events }, { status: 200 });
  } catch (error) {
    logger.error(
      "Error fetching resource audit history",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
