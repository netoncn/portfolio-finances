import type { BaseEntity } from "@/types/common";

export type AuditEventType =
  | "account.created"
  | "account.updated"
  | "account.archived"
  | "account.unarchived"
  | "account.deleted";

export interface AuditEventMetadata {
  changedFields?: string[];

  previousValues?: Record<string, unknown>;

  newValues?: Record<string, unknown>;

  reason?: string;
  source?: "web" | "mobile" | "api" | "system";
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditEvent extends BaseEntity {
  eventType: AuditEventType;

  userId: string;
  userEmail?: string;

  resourceType: "account";
  resourceId: string;

  timestamp: number;

  metadata?: AuditEventMetadata;

  expiresAt?: number;
}

export interface AuditEventSummary {
  id: string;
  eventType: AuditEventType;
  timestamp: number;
  description: string;
  userEmail?: string;
  metadata?: AuditEventMetadata;
}
