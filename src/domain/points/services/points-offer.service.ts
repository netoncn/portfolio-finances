import "server-only";
import { adminDb } from "@/lib/firebase/firestore.admin";
import type {
  CreatePointsOfferDTO,
  UpdatePointsOfferDTO,
} from "../dto/points.dto";
import type { PointsOffer, PointsProgramName } from "../types/points";

const COLLECTION = "points_offers";

export class PointsOfferService {
  static async create(dto: CreatePointsOfferDTO): Promise<PointsOffer> {
    const docRef = adminDb.collection(COLLECTION).doc();

    const data = {
      ...dto,
    };

    await docRef.set(data);

    return {
      id: docRef.id,
      ...data,
    };
  }

  static async listAll(): Promise<PointsOffer[]> {
    const now = Date.now();
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("validUntil", ">=", now)
      .orderBy("validUntil", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PointsOffer[];
  }

  static async listByProgram(
    program: PointsProgramName,
  ): Promise<PointsOffer[]> {
    const now = Date.now();
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("program", "==", program)
      .where("validUntil", ">=", now)
      .orderBy("validUntil", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PointsOffer[];
  }

  static async getById(id: string): Promise<PointsOffer | null> {
    const doc = await adminDb.collection(COLLECTION).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as PointsOffer;
  }

  static async update(dto: UpdatePointsOfferDTO): Promise<PointsOffer | null> {
    const { id, ...updates } = dto;

    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    await docRef.update(updates);

    const data = doc.data() as Omit<PointsOffer, "id">;

    return {
      id: doc.id,
      ...data,
      ...updates,
    };
  }

  static async delete(id: string): Promise<boolean> {
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    await docRef.delete();
    return true;
  }

  static async listExpiringSoon(daysAhead = 7): Promise<PointsOffer[]> {
    const now = Date.now();
    const futureDate = now + daysAhead * 24 * 60 * 60 * 1000;

    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("validUntil", ">=", now)
      .where("validUntil", "<=", futureDate)
      .orderBy("validUntil", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PointsOffer[];
  }

  static async listHighBonus(minBonus = 50): Promise<PointsOffer[]> {
    const now = Date.now();
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("validUntil", ">=", now)
      .where("bonus", ">=", minBonus)
      .orderBy("validUntil", "asc")
      .orderBy("bonus", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PointsOffer[];
  }
}
