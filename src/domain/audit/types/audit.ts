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
  | "mapping_rule.applied"
  // Investment account events
  | "investment_account.created"
  | "investment_account.updated"
  | "investment_account.archived"
  | "investment_account.unarchived"
  | "investment_account.deleted"
  // Position events
  | "position.created"
  | "position.updated"
  | "position.deleted"
  // Investment transaction events
  | "investment_transaction.created"
  | "investment_transaction.updated"
  | "investment_transaction.deleted"
  // Earning events
  | "earning.created"
  | "earning.updated"
  | "earning.deleted"
  // Points program events
  | "points_program.created"
  | "points_program.updated"
  | "points_program.deleted"
  // Points balance events
  | "points_balance.created"
  | "points_balance.updated"
  | "points_balance.redeemed"
  | "points_balance.expired"
  | "points_balance.deleted"
  // Points operation events
  | "points_operation.created"
  | "points_operation.updated"
  | "points_operation.deleted"
  // AI tool events
  | "ai_tool.executed"
  | "ai_tool.failed";

export type AuditResourceType =
  | "account"
  | "transaction"
  | "installment_group"
  | "statement"
  | "category"
  | "budget"
  | "goal"
  | "mapping_rule"
  | "investment_account"
  | "position"
  | "investment_transaction"
  | "earning"
  | "points_program"
  | "points_balance"
  | "points_operation"
  | "ai_tool";

export interface AuditEventMetadata {
  changedFields?: string[];

  previousValues?: Record<string, unknown>;

  newValues?: Record<string, unknown>;

  reason?: string;
  source?: "web" | "mobile" | "api" | "system" | "import" | "ai";
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

  // AI tool-specific metadata
  toolName?: string;
  status?: string;
  input?: Record<string, unknown>;
  month?: string;
  locale?: string;
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
