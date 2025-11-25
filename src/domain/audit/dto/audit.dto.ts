import type {
  AuditEventMetadata,
  AuditEventType,
  AuditResourceType,
} from "../types/audit";

export interface CreateAuditEventDTO {
  eventType: AuditEventType;
  userId: string;
  userEmail?: string;
  resourceType: AuditResourceType;
  resourceId: string;
  metadata?: AuditEventMetadata;
}

export interface ListAuditEventsQuery {
  userId?: string;
  resourceType?: AuditResourceType;
  resourceId?: string;
  eventType?: AuditEventType;
  startDate?: number;
  endDate?: number;
  limit?: number;
}
