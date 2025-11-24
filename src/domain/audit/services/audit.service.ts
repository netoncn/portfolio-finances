import { adminDb } from "@/lib/firebase/firestore.admin";
import { logger } from "@/lib/logger";
import type {
  CreateAuditEventDTO,
  ListAuditEventsQuery,
} from "../dto/audit.dto";
import type { AuditEvent } from "../types/audit";

const COLLECTION = "audit_events";
const DEFAULT_RETENTION_DAYS = 90;

export class AuditService {
  static async recordEvent(dto: CreateAuditEventDTO): Promise<AuditEvent> {
    try {
      const now = Date.now();
      const docRef = adminDb.collection(COLLECTION).doc();

      const expiresAt = now + DEFAULT_RETENTION_DAYS * 24 * 60 * 60 * 1000;

      const eventData = {
        ...dto,
        timestamp: now,
        createdAt: now,
        updatedAt: now,
        expiresAt,
      };

      await docRef.set(eventData);

      return {
        id: docRef.id,
        ...eventData,
      };
    } catch (error) {
      logger.error(
        "Failed to record audit event",
        error instanceof Error ? error : undefined,
      );
      throw error;
    }
  }

  static async listEvents(query: ListAuditEventsQuery): Promise<AuditEvent[]> {
    try {
      let firestoreQuery = adminDb.collection(COLLECTION);

      if (query.userId) {
        firestoreQuery = firestoreQuery.where(
          "userId",
          "==",
          query.userId,
        ) as any;
      }

      if (query.resourceType) {
        firestoreQuery = firestoreQuery.where(
          "resourceType",
          "==",
          query.resourceType,
        ) as any;
      }

      if (query.resourceId) {
        firestoreQuery = firestoreQuery.where(
          "resourceId",
          "==",
          query.resourceId,
        ) as any;
      }

      if (query.eventType) {
        firestoreQuery = firestoreQuery.where(
          "eventType",
          "==",
          query.eventType,
        ) as any;
      }

      if (query.startDate) {
        firestoreQuery = firestoreQuery.where(
          "timestamp",
          ">=",
          query.startDate,
        ) as any;
      }

      if (query.endDate) {
        firestoreQuery = firestoreQuery.where(
          "timestamp",
          "<=",
          query.endDate,
        ) as any;
      }

      firestoreQuery = firestoreQuery.orderBy("timestamp", "desc") as any;

      const limit = query.limit || 50;
      firestoreQuery = firestoreQuery.limit(limit) as any;

      const snapshot = await firestoreQuery.get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AuditEvent[];
    } catch (error) {
      logger.error(
        "Failed to list audit events",
        error instanceof Error ? error : undefined,
      );
      throw error;
    }
  }

  static async getResourceHistory(
    resourceType: "account",
    resourceId: string,
    userId: string,
  ): Promise<AuditEvent[]> {
    return AuditService.listEvents({
      userId,
      resourceType,
      resourceId,
      limit: 100,
    });
  }

  static async cleanupExpiredEvents(): Promise<number> {
    try {
      const now = Date.now();
      const snapshot = await adminDb
        .collection(COLLECTION)
        .where("expiresAt", "<=", now)
        .limit(500)
        .get();

      if (snapshot.empty) {
        return 0;
      }

      const batch = adminDb.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      logger.info(`Cleaned up ${snapshot.size} expired audit events`);
      return snapshot.size;
    } catch (error) {
      logger.error(
        "Failed to cleanup expired audit events",
        error instanceof Error ? error : undefined,
      );
      throw error;
    }
  }
}
