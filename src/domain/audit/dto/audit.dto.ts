import type { AuditEventMetadata, AuditEventType } from "../types/audit";

export interface CreateAuditEventDTO {
  eventType: AuditEventType;
  userId: string;
  userEmail?: string;
  resourceType: "account";
  resourceId: string;
  metadata?: AuditEventMetadata;
}

export interface ListAuditEventsQuery {
  userId?: string;
  resourceType?: "account";
  resourceId?: string;
  eventType?: AuditEventType;
  startDate?: number;
  endDate?: number;
  limit?: number;
}
