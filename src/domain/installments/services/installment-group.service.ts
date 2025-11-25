import { adminDb } from "@/lib/firebase/firestore.admin";
import type {
  CreateInstallmentGroupDTO,
  UpdateInstallmentGroupDTO,
} from "../dto/installment-group.dto";
import type { InstallmentGroup } from "../types/installment-group";

const COLLECTION = "installment_groups";

export class InstallmentGroupService {
  static async create(
    dto: CreateInstallmentGroupDTO,
  ): Promise<InstallmentGroup> {
    const now = Date.now();
    const docRef = adminDb.collection(COLLECTION).doc();

    const installmentGroupData = {
      ...dto,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(installmentGroupData);

    return {
      id: docRef.id,
      ...installmentGroupData,
    };
  }

  static async listByUser(userId: string): Promise<InstallmentGroup[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .orderBy("purchaseDate", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as InstallmentGroup[];
  }

  static async listByCardAccount(
    cardAccountId: string,
    userId: string,
  ): Promise<InstallmentGroup[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("cardAccountId", "==", cardAccountId)
      .orderBy("purchaseDate", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as InstallmentGroup[];
  }

  static async getById(
    id: string,
    userId: string,
  ): Promise<InstallmentGroup | null> {
    const doc = await adminDb.collection(COLLECTION).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<InstallmentGroup, "id">;

    if (data.userId !== userId) {
      return null;
    }

    return {
      id: doc.id,
      ...data,
    };
  }

  static async update(
    dto: UpdateInstallmentGroupDTO,
  ): Promise<InstallmentGroup | null> {
    const { id, userId, ...updates } = dto;

    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<InstallmentGroup, "id">;

    if (data.userId !== userId) {
      return null;
    }

    const updatedData = {
      ...updates,
      updatedAt: Date.now(),
    };

    await docRef.update(updatedData);

    const updatedDoc = await docRef.get();
    return {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as InstallmentGroup;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    const data = doc.data() as Omit<InstallmentGroup, "id">;

    if (data.userId !== userId) {
      return false;
    }

    await docRef.delete();
    return true;
  }

  static async getByStatementMonth(
    userId: string,
    statementMonth: string,
  ): Promise<InstallmentGroup[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("statementStartMonth", "==", statementMonth)
      .orderBy("purchaseDate", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as InstallmentGroup[];
  }

  static async getActive(userId: string): Promise<InstallmentGroup[]> {
    const now = Date.now();

    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("firstDueDate", "<=", now)
      .orderBy("firstDueDate", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as InstallmentGroup[];
  }
}
