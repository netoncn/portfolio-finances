import type { BaseEntity } from "@/types/common";

export type AuditEventType =
  // Account events
  | "account.created"
  | "account.updated"
  | "account.archived"
  | "account.unarchived"
  | "account.deleted"
  // Transaction events
  | "transaction.created"
  | "transaction.updated"
  | "transaction.deleted"
  | "transaction.imported"
  | "transaction.bulk_imported"
  // Installment events
  | "installment.created"
  | "installment.paid"
  | "installment.canceled"
  | "installment.all_canceled"
  // Statement events
  | "statement.created"
  | "statement.closed"
  | "statement.paid"
  | "statement.updated"
  // Category events
  | "category.created"
  | "category.updated"
  | "category.deleted"
  | "category.bulk_created"
  // Budget events
  | "budget.created"
  | "budget.updated"
  | "budget.deleted"
  | "budget.spent_updated"
  | "budget.alert_triggered"
  // Goal events
  | "goal.created"
  | "goal.updated"
  | "goal.deleted"
  | "goal.progress_updated"
  // Mapping rule events
  | "mapping_rule.created"
  | "mapping_rule.updated"
  | "mapping_rule.deleted"
  | "mapping_rule.applied";

export type AuditResourceType =
  | "account"
  | "transaction"
  | "installment_group"
  | "statement"
  | "category"
  | "budget"
  | "goal"
  | "mapping_rule";

export interface AuditEventMetadata {
  changedFields?: string[];

  previousValues?: Record<string, unknown>;

  newValues?: Record<string, unknown>;

  reason?: string;
  source?: "web" | "mobile" | "api" | "system" | "import";
  ipAddress?: string;
  userAgent?: string;

  // Import-specific metadata
  importId?: string;
  batchSize?: number;
  successCount?: number;
  errorCount?: number;
  duplicateCount?: number;
  count?: number;

  // Classification metadata
  ruleId?: string;
  confidence?: number;
  autoClassified?: boolean;

  // Goal-specific metadata
  previousAmount?: number;
  newAmount?: number;
  targetAmount?: number;
  percentageComplete?: number;
  deletedValues?: Record<string, unknown>;
}

export interface AuditEvent extends BaseEntity {
  eventType: AuditEventType;

  userId: string;
  userEmail?: string;

  resourceType: AuditResourceType;
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
