import "server-only";
import { AuditService } from "@/domain/audit/services/audit.service";
import { adminDb } from "@/lib/firebase/firestore.admin";
import type {
  CreatePointsBalanceDTO,
  UpdatePointsBalanceDTO,
} from "../dto/points.dto";
import type { PointsBalance } from "../types/points";

const COLLECTION = "points_balances";

export class PointsBalanceService {
  static async create(dto: CreatePointsBalanceDTO): Promise<PointsBalance> {
    const now = Date.now();
    const docRef = adminDb.collection(COLLECTION).doc();

    const data = {
      ...dto,
      status: dto.status || "active",
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(data);

    const balance: PointsBalance = {
      id: docRef.id,
      ...data,
    };

    AuditService.recordEvent({
      eventType: "points_balance.created",
      userId: dto.userId,
      resourceType: "points_balance",
      resourceId: docRef.id,
      metadata: {
        source: "web",
        newValues: {
          programId: data.programId,
          points: data.points,
          expiresAt: data.expiresAt,
          status: data.status,
        },
      },
    }).catch(() => {});

    return balance;
  }

  static async listByUser(userId: string): Promise<PointsBalance[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .orderBy("expiresAt", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PointsBalance[];
  }

  static async listByProgram(
    userId: string,
    programId: string,
  ): Promise<PointsBalance[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("programId", "==", programId)
      .orderBy("expiresAt", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PointsBalance[];
  }

  static async listActive(
    userId: string,
    programId?: string,
  ): Promise<PointsBalance[]> {
    let query = adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("status", "==", "active");

    if (programId) {
      query = query.where("programId", "==", programId);
    }

    const snapshot = await query.orderBy("expiresAt", "asc").get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PointsBalance[];
  }

  static async listExpiringSoon(
    userId: string,
    daysAhead = 30,
  ): Promise<PointsBalance[]> {
    const now = Date.now();
    const futureDate = now + daysAhead * 24 * 60 * 60 * 1000;

    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("status", "==", "active")
      .where("expiresAt", ">=", now)
      .where("expiresAt", "<=", futureDate)
      .orderBy("expiresAt", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PointsBalance[];
  }

  static async getById(
    id: string,
    userId: string,
  ): Promise<PointsBalance | null> {
    const doc = await adminDb.collection(COLLECTION).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<PointsBalance, "id">;

    if (data.userId !== userId) {
      return null;
    }

    return {
      id: doc.id,
      ...data,
    };
  }

  static async update(
    dto: UpdatePointsBalanceDTO,
  ): Promise<PointsBalance | null> {
    const { id, userId, ...updates } = dto;

    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<PointsBalance, "id">;

    if (data.userId !== userId) {
      return null;
    }

    const now = Date.now();
    const updateData = {
      ...updates,
      updatedAt: now,
    };

    await docRef.update(updateData);

    const updated: PointsBalance = {
      id: doc.id,
      ...data,
      ...updates,
      updatedAt: now,
    };

    AuditService.recordEvent({
      eventType: "points_balance.updated",
      userId,
      resourceType: "points_balance",
      resourceId: id,
      metadata: {
        source: "web",
        previousValues: {
          points: data.points,
          status: data.status,
        },
        newValues: {
          points: updated.points,
          status: updated.status,
        },
      },
    }).catch(() => {});

    return updated;
  }

  static async markAsRedeemed(id: string, userId: string): Promise<boolean> {
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    const data = doc.data() as Omit<PointsBalance, "id">;

    if (data.userId !== userId) {
      return false;
    }

    await docRef.update({
      status: "redeemed",
      updatedAt: Date.now(),
    });

    AuditService.recordEvent({
      eventType: "points_balance.redeemed",
      userId,
      resourceType: "points_balance",
      resourceId: id,
      metadata: {
        source: "web",
        previousValues: { status: data.status },
        newValues: { status: "redeemed" },
      },
    }).catch(() => {});

    return true;
  }

  static async markAsExpired(id: string, userId: string): Promise<boolean> {
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    const data = doc.data() as Omit<PointsBalance, "id">;

    if (data.userId !== userId) {
      return false;
    }

    await docRef.update({
      status: "expired",
      updatedAt: Date.now(),
    });

    AuditService.recordEvent({
      eventType: "points_balance.expired",
      userId,
      resourceType: "points_balance",
      resourceId: id,
      metadata: {
        source: "web",
        previousValues: { status: data.status },
        newValues: { status: "expired" },
      },
    }).catch(() => {});

    return true;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    const data = doc.data() as Omit<PointsBalance, "id">;

    if (data.userId !== userId) {
      return false;
    }

    await docRef.delete();

    AuditService.recordEvent({
      eventType: "points_balance.deleted",
      userId,
      resourceType: "points_balance",
      resourceId: id,
      metadata: {
        source: "web",
        previousValues: {
          programId: data.programId,
          points: data.points,
        },
      },
    }).catch(() => {});

    return true;
  }

  static async getTotalByProgram(
    userId: string,
    programId: string,
  ): Promise<number> {
    const balances = await PointsBalanceService.listActive(userId, programId);
    return balances.reduce((sum, balance) => sum + balance.points, 0);
  }
}
