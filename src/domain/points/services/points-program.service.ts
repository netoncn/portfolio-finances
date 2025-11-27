import "server-only";
import { AuditService } from "@/domain/audit/services/audit.service";
import { adminDb } from "@/lib/firebase/firestore.admin";
import type {
  CreatePointsProgramDTO,
  UpdatePointsProgramDTO,
} from "../dto/points.dto";
import type { PointsProgram } from "../types/points";

const COLLECTION = "points_programs";

export class PointsProgramService {
  static async create(dto: CreatePointsProgramDTO): Promise<PointsProgram> {
    const now = Date.now();
    const docRef = adminDb.collection(COLLECTION).doc();

    const data = {
      ...dto,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(data);

    const program: PointsProgram = {
      id: docRef.id,
      ...data,
    };

    AuditService.recordEvent({
      eventType: "points_program.created",
      userId: dto.userId,
      resourceType: "points_program",
      resourceId: docRef.id,
      metadata: {
        source: "web",
        newValues: {
          program: data.program,
          memberId: data.memberId,
        },
      },
    }).catch(() => {});

    return program;
  }

  static async listByUser(userId: string): Promise<PointsProgram[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PointsProgram[];
  }

  static async getById(
    id: string,
    userId: string,
  ): Promise<PointsProgram | null> {
    const doc = await adminDb.collection(COLLECTION).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<PointsProgram, "id">;

    if (data.userId !== userId) {
      return null;
    }

    return {
      id: doc.id,
      ...data,
    };
  }

  static async update(
    dto: UpdatePointsProgramDTO,
  ): Promise<PointsProgram | null> {
    const { id, userId, ...updates } = dto;

    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<PointsProgram, "id">;

    if (data.userId !== userId) {
      return null;
    }

    const now = Date.now();
    const updateData = {
      ...updates,
      updatedAt: now,
    };

    await docRef.update(updateData);

    const updated: PointsProgram = {
      id: doc.id,
      ...data,
      ...updates,
      updatedAt: now,
    };

    AuditService.recordEvent({
      eventType: "points_program.updated",
      userId,
      resourceType: "points_program",
      resourceId: id,
      metadata: {
        source: "web",
        previousValues: {
          program: data.program,
          memberId: data.memberId,
        },
        newValues: {
          program: updated.program,
          memberId: updated.memberId,
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

    const data = doc.data() as Omit<PointsProgram, "id">;

    if (data.userId !== userId) {
      return false;
    }

    await docRef.delete();

    AuditService.recordEvent({
      eventType: "points_program.deleted",
      userId,
      resourceType: "points_program",
      resourceId: id,
      metadata: {
        source: "web",
        previousValues: {
          program: data.program,
          memberId: data.memberId,
        },
      },
    }).catch(() => {});

    return true;
  }
}
