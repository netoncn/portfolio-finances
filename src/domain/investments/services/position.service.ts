import "server-only";
import { AuditService } from "@/domain/audit/services/audit.service";
import { adminDb } from "@/lib/firebase/firestore.admin";
import type {
  CreatePositionDTO,
  UpdatePositionDTO,
} from "../dto/investment.dto";
import type { Position } from "../types";

const COLLECTION = "positions";

export class PositionService {
  static async create(dto: CreatePositionDTO): Promise<Position> {
    const now = Date.now();
    const docRef = adminDb.collection(COLLECTION).doc();

    const positionData = {
      ...dto,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(positionData);

    const position: Position = {
      id: docRef.id,
      ...positionData,
    };

    AuditService.recordEvent({
      eventType: "position.created",
      userId: dto.userId,
      resourceType: "position",
      resourceId: docRef.id,
      metadata: {
        source: "web",
        newValues: {
          ticker: positionData.ticker,
          assetName: positionData.assetName,
          quantity: positionData.quantity,
        },
      },
    }).catch(() => {});

    return position;
  }

  static async listByUser(userId: string): Promise<Position[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Position[];
  }

  static async listByAccount(
    userId: string,
    investmentAccountId: string,
  ): Promise<Position[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("investmentAccountId", "==", investmentAccountId)
      .orderBy("ticker", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Position[];
  }

  static async getById(id: string, userId: string): Promise<Position | null> {
    const doc = await adminDb.collection(COLLECTION).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<Position, "id">;

    if (data.userId !== userId) {
      return null;
    }

    return {
      id: doc.id,
      ...data,
    };
  }

  static async getByTicker(
    userId: string,
    investmentAccountId: string,
    ticker: string,
  ): Promise<Position | null> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("investmentAccountId", "==", investmentAccountId)
      .where("ticker", "==", ticker.toUpperCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Position;
  }

  static async update(dto: UpdatePositionDTO): Promise<Position | null> {
    const { id, userId, ...updates } = dto;

    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<Position, "id">;

    if (data.userId !== userId) {
      return null;
    }

    const now = Date.now();
    const updateData = {
      ...updates,
      updatedAt: now,
    };

    await docRef.update(updateData);

    const updated: Position = {
      id: doc.id,
      ...data,
      ...updates,
      updatedAt: now,
    };

    AuditService.recordEvent({
      eventType: "position.updated",
      userId,
      resourceType: "position",
      resourceId: id,
      metadata: {
        source: "web",
        previousValues: {
          ticker: data.ticker,
          quantity: data.quantity,
          averagePrice: data.averagePrice,
        },
        newValues: {
          ticker: updated.ticker,
          quantity: updated.quantity,
          averagePrice: updated.averagePrice,
        },
      },
    }).catch(() => {});

    return updated;
  }

  static async updateAveragePrice(
    id: string,
    userId: string,
    newQuantity: number,
    newAveragePrice: number,
  ): Promise<Position | null> {
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<Position, "id">;

    if (data.userId !== userId) {
      return null;
    }

    const now = Date.now();
    await docRef.update({
      quantity: newQuantity,
      averagePrice: newAveragePrice,
      updatedAt: now,
    });

    const updated: Position = {
      id: doc.id,
      ...data,
      quantity: newQuantity,
      averagePrice: newAveragePrice,
      updatedAt: now,
    };

    return updated;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    const data = doc.data() as Omit<Position, "id">;

    if (data.userId !== userId) {
      return false;
    }

    // TODO: Verificar se existem transações ou earnings relacionados antes de deletar
    // TODO: Considerar implementar soft delete

    await docRef.delete();

    AuditService.recordEvent({
      eventType: "position.deleted",
      userId,
      resourceType: "position",
      resourceId: id,
      metadata: {
        source: "web",
        previousValues: {
          ticker: data.ticker,
          assetName: data.assetName,
          quantity: data.quantity,
        },
      },
    }).catch(() => {});

    return true;
  }
}
