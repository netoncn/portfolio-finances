import { uidSchema } from "@lib/validation/common.schema";
import { z } from "zod";

export const auditEventTypeEnum = z.enum([
  "account.created",
  "account.updated",
  "account.archived",
  "account.unarchived",
  "account.deleted",
]);

export const auditResourceTypeEnum = z.enum(["account"]);

export const auditSourceEnum = z.enum(["web", "mobile", "api", "system"]);

export const auditEventMetadataSchema = z.object({
  changedFields: z.array(z.string()).optional(),
  previousValues: z.record(z.string(), z.unknown()).optional(),
  newValues: z.record(z.string(), z.unknown()).optional(),
  reason: z.string().optional(),
  source: auditSourceEnum.optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export const createAuditEventSchema = z.object({
  eventType: auditEventTypeEnum,
  userId: uidSchema,
  userEmail: z.string().email().optional(),
  resourceType: auditResourceTypeEnum,
  resourceId: z.string().min(1),
  metadata: auditEventMetadataSchema.optional(),
});

export const auditEventSchema = createAuditEventSchema.extend({
  id: z.string().min(1),
  timestamp: z.number().int().positive(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  expiresAt: z.number().int().positive().optional(),
});
