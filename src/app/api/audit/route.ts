import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AuditService } from "@/domain/audit/services/audit.service";
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
    const resourceType = searchParams.get("resourceType");
    const resourceId = searchParams.get("resourceId");
    const eventType = searchParams.get("eventType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = searchParams.get("limit");

    const events = await AuditService.listEvents({
      userId: session.user.id,
      resourceType: resourceType as any,
      resourceId: resourceId || undefined,
      eventType: eventType as any,
      startDate: startDate ? parseInt(startDate, 10) : undefined,
      endDate: endDate ? parseInt(endDate, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : 50,
    });

    return NextResponse.json({ data: events }, { status: 200 });
  } catch (error) {
    logger.error(
      "Error listing audit events",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
