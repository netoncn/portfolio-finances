import "server-only";
import { AuditService } from "@/domain/audit/services/audit.service";
import { adminDb } from "@/lib/firebase/firestore.admin";
import type {
  CreatePointsOperationDTO,
  UpdatePointsOperationDTO,
} from "../dto/points.dto";
import type { PointsOperation } from "../types/points";

const COLLECTION = "points_operations";

export class PointsOperationService {
  static async create(dto: CreatePointsOperationDTO): Promise<PointsOperation> {
    const now = Date.now();
    const docRef = adminDb.collection(COLLECTION).doc();

    const data = {
      ...dto,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(data);

    const operation: PointsOperation = {
      id: docRef.id,
      ...data,
    };

    AuditService.recordEvent({
      eventType: "points_operation.created",
      userId: dto.userId,
      resourceType: "points_operation",
      resourceId: docRef.id,
      metadata: {
        source: "web",
        newValues: {
          programId: data.programId,
          type: data.type,
          pointsDelta: data.pointsDelta,
          date: data.date,
        },
      },
    }).catch(() => {});

    return operation;
  }

  static async listByUser(userId: string): Promise<PointsOperation[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .orderBy("date", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PointsOperation[];
  }

  static async listByProgram(
    userId: string,
    programId: string,
  ): Promise<PointsOperation[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("programId", "==", programId)
      .orderBy("date", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PointsOperation[];
  }

  static async listByType(
    userId: string,
    type: PointsOperation["type"],
  ): Promise<PointsOperation[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("type", "==", type)
      .orderBy("date", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PointsOperation[];
  }

  static async listByDateRange(
    userId: string,
    startDate: number,
    endDate: number,
  ): Promise<PointsOperation[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("date", ">=", startDate)
      .where("date", "<=", endDate)
      .orderBy("date", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PointsOperation[];
  }

  static async getById(
    id: string,
    userId: string,
  ): Promise<PointsOperation | null> {
    const doc = await adminDb.collection(COLLECTION).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<PointsOperation, "id">;

    if (data.userId !== userId) {
      return null;
    }

    return {
      id: doc.id,
      ...data,
    };
  }

  static async update(
    dto: UpdatePointsOperationDTO,
  ): Promise<PointsOperation | null> {
    const { id, userId, ...updates } = dto;

    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<PointsOperation, "id">;

    if (data.userId !== userId) {
      return null;
    }

    const now = Date.now();
    const updateData = {
      ...updates,
      updatedAt: now,
    };

    await docRef.update(updateData);

    const updated: PointsOperation = {
      id: doc.id,
      ...data,
      ...updates,
      updatedAt: now,
    };

    AuditService.recordEvent({
      eventType: "points_operation.updated",
      userId,
      resourceType: "points_operation",
      resourceId: id,
      metadata: {
        source: "web",
        previousValues: {
          type: data.type,
          pointsDelta: data.pointsDelta,
        },
        newValues: {
          type: updated.type,
          pointsDelta: updated.pointsDelta,
        },
      },
    }).catch(() => {});

    return updated;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    const data = doc.data() as Omit<PointsOperation, "id">;

    if (data.userId !== userId) {
      return false;
    }

    await docRef.delete();

    AuditService.recordEvent({
      eventType: "points_operation.deleted",
      userId,
      resourceType: "points_operation",
      resourceId: id,
      metadata: {
        source: "web",
        previousValues: {
          programId: data.programId,
          type: data.type,
          pointsDelta: data.pointsDelta,
        },
      },
    }).catch(() => {});

    return true;
  }

  static async getPointsEarnedByProgram(
    userId: string,
    programId: string,
  ): Promise<number> {
    const operations = await PointsOperationService.listByProgram(
      userId,
      programId,
    );
    return operations
      .filter((op) => op.type === "earn" || op.type === "transfer_in")
      .reduce((sum, op) => sum + op.pointsDelta, 0);
  }

  static async getPointsRedeemedByProgram(
    userId: string,
    programId: string,
  ): Promise<number> {
    const operations = await PointsOperationService.listByProgram(
      userId,
      programId,
    );
    return operations
      .filter((op) => op.type === "redeem" || op.type === "transfer_out")
      .reduce((sum, op) => sum + Math.abs(op.pointsDelta), 0);
  }
}
