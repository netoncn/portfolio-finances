import "server-only";
import { AuditService } from "@/domain/audit/services/audit.service";
import { adminDb } from "@/lib/firebase/firestore.admin";
import type { CreateEarningDTO, UpdateEarningDTO } from "../dto/investment.dto";
import type { Earning } from "../types";

const COLLECTION = "earnings";

export class EarningService {
  static async create(dto: CreateEarningDTO): Promise<Earning> {
    const now = Date.now();
    const docRef = adminDb.collection(COLLECTION).doc();

    const earningData = {
      ...dto,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(earningData);

    const earning: Earning = {
      id: docRef.id,
      ...earningData,
    };

    AuditService.recordEvent({
      eventType: "earning.created",
      userId: dto.userId,
      resourceType: "earning",
      resourceId: docRef.id,
      metadata: {
        source: "web",
        newValues: {
          earningType: earningData.earningType,
          ticker: earningData.ticker,
          amount: earningData.amount,
        },
      },
    }).catch(() => {});

    return earning;
  }

  static async listByUser(userId: string, limit?: number): Promise<Earning[]> {
    let query = adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .orderBy("paymentDate", "desc");

    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Earning[];
  }

  static async listByAccount(
    userId: string,
    investmentAccountId: string,
    limit?: number,
  ): Promise<Earning[]> {
    let query = adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("investmentAccountId", "==", investmentAccountId)
      .orderBy("paymentDate", "desc");

    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Earning[];
  }

  static async listByPosition(
    userId: string,
    positionId: string,
    limit?: number,
  ): Promise<Earning[]> {
    let query = adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("positionId", "==", positionId)
      .orderBy("paymentDate", "desc");

    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Earning[];
  }

  static async listByTicker(
    userId: string,
    ticker: string,
    limit?: number,
  ): Promise<Earning[]> {
    let query = adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("ticker", "==", ticker.toUpperCase())
      .orderBy("paymentDate", "desc");

    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Earning[];
  }

  static async listByDateRange(
    userId: string,
    startDate: number,
    endDate: number,
  ): Promise<Earning[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("paymentDate", ">=", startDate)
      .where("paymentDate", "<=", endDate)
      .orderBy("paymentDate", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Earning[];
  }

  static async getById(id: string, userId: string): Promise<Earning | null> {
    const doc = await adminDb.collection(COLLECTION).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<Earning, "id">;

    if (data.userId !== userId) {
      return null;
    }

    return {
      id: doc.id,
      ...data,
    };
  }

  static async update(dto: UpdateEarningDTO): Promise<Earning | null> {
    const { id, userId, ...updates } = dto;

    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<Earning, "id">;

    if (data.userId !== userId) {
      return null;
    }

    const now = Date.now();
    const updateData = {
      ...updates,
      updatedAt: now,
    };

    await docRef.update(updateData);

    const updated: Earning = {
      id: doc.id,
      ...data,
      ...updates,
      updatedAt: now,
    };

    AuditService.recordEvent({
      eventType: "earning.updated",
      userId,
      resourceType: "earning",
      resourceId: id,
      metadata: {
        source: "web",
        previousValues: {
          earningType: data.earningType,
          amount: data.amount,
        },
        newValues: {
          earningType: updated.earningType,
          amount: updated.amount,
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

    const data = doc.data() as Omit<Earning, "id">;

    if (data.userId !== userId) {
      return false;
    }

    await docRef.delete();

    AuditService.recordEvent({
      eventType: "earning.deleted",
      userId,
      resourceType: "earning",
      resourceId: id,
      metadata: {
        source: "web",
        previousValues: {
          earningType: data.earningType,
          ticker: data.ticker,
          amount: data.amount,
        },
      },
    }).catch(() => {});

    return true;
  }

  static async getTotalEarnings(
    userId: string,
    startDate: number,
    endDate: number,
  ): Promise<number> {
    const earnings = await EarningService.listByDateRange(
      userId,
      startDate,
      endDate,
    );
    return earnings.reduce((total, earning) => total + earning.amount, 0);
  }

  static async getEarningsByType(
    userId: string,
    startDate: number,
    endDate: number,
  ): Promise<Record<string, number>> {
    const earnings = await EarningService.listByDateRange(
      userId,
      startDate,
      endDate,
    );
    const earningsByType: Record<string, number> = {};

    for (const earning of earnings) {
      if (!earningsByType[earning.earningType]) {
        earningsByType[earning.earningType] = 0;
      }
      earningsByType[earning.earningType] += earning.amount;
    }

    return earningsByType;
  }
}
