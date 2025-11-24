import { AccountService } from "@/domain/accounts/services/account.service";
import { adminDb } from "@/lib/firebase/firestore.admin";
import type {
  CreateTransactionDTO,
  UpdateTransactionDTO,
} from "../dto/transaction.dto";
import { extractDenormalizedFields } from "../helpers/denormalization.helper";
import type { Transaction } from "../types/transaction";

const COLLECTION = "transactions";

export class TransactionService {
  static async create(dto: CreateTransactionDTO): Promise<Transaction> {
    const now = Date.now();
    const docRef = adminDb.collection(COLLECTION).doc();

    const account = await AccountService.getById(dto.accountId, dto.userId);
    if (!account) {
      throw new Error("Account not found");
    }

    const denormalizedFields = extractDenormalizedFields(account);

    const transactionData = {
      ...dto,
      ...denormalizedFields,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(transactionData);

    return {
      id: docRef.id,
      ...transactionData,
    };
  }

  static async listByUser(userId: string): Promise<Transaction[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .orderBy("date", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[];
  }

  static async listByAccount(
    accountId: string,
    userId: string,
  ): Promise<Transaction[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("accountId", "==", accountId)
      .orderBy("date", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[];
  }

  static async listByAccountType(
    userId: string,
    accountType: string,
  ): Promise<Transaction[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("accountType", "==", accountType)
      .orderBy("date", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[];
  }

  static async listByCardBrand(
    userId: string,
    cardBrand: string,
  ): Promise<Transaction[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("cardBrand", "==", cardBrand)
      .orderBy("date", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[];
  }

  static async getById(
    id: string,
    userId: string,
  ): Promise<Transaction | null> {
    const doc = await adminDb.collection(COLLECTION).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<Transaction, "id">;

    if (data.userId !== userId) {
      return null;
    }

    return {
      id: doc.id,
      ...data,
    };
  }

  static async update(dto: UpdateTransactionDTO): Promise<Transaction | null> {
    const { id, userId, ...updates } = dto;

    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<Transaction, "id">;

    if (data.userId !== userId) {
      return null;
    }

    let updatedData = {
      ...updates,
      updatedAt: Date.now(),
    };

    if (updates.accountId && updates.accountId !== data.accountId) {
      const account = await AccountService.getById(updates.accountId, userId);
      if (!account) {
        throw new Error("New account not found");
      }

      const denormalizedFields = extractDenormalizedFields(account);
      updatedData = {
        ...updatedData,
        ...denormalizedFields,
      };
    }

    await docRef.update(updatedData);

    const updatedDoc = await docRef.get();
    return {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as Transaction;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    const data = doc.data() as Omit<Transaction, "id">;

    if (data.userId !== userId) {
      return false;
    }

    await docRef.delete();
    return true;
  }

  static async refreshDenormalizedFields(
    transactionId: string,
    userId: string,
  ): Promise<boolean> {
    const transaction = await TransactionService.getById(transactionId, userId);
    if (!transaction) {
      return false;
    }

    const account = await AccountService.getById(transaction.accountId, userId);
    if (!account) {
      return false;
    }

    const denormalizedFields = extractDenormalizedFields(account);

    if (
      transaction.accountType === denormalizedFields.accountType &&
      transaction.cardBrand === denormalizedFields.cardBrand
    ) {
      return false;
    }

    await adminDb
      .collection(COLLECTION)
      .doc(transactionId)
      .update({
        ...denormalizedFields,
        updatedAt: Date.now(),
      });

    return true;
  }

  static async refreshDenormalizedFieldsByAccount(
    accountId: string,
    userId: string,
  ): Promise<number> {
    const account = await AccountService.getById(accountId, userId);
    if (!account) {
      throw new Error("Account not found");
    }

    const transactions = await TransactionService.listByAccount(
      accountId,
      userId,
    );
    const denormalizedFields = extractDenormalizedFields(account);

    let updateCount = 0;
    const batch = adminDb.batch();

    for (const transaction of transactions) {
      if (
        transaction.accountType !== denormalizedFields.accountType ||
        transaction.cardBrand !== denormalizedFields.cardBrand
      ) {
        const docRef = adminDb.collection(COLLECTION).doc(transaction.id);
        batch.update(docRef, {
          ...denormalizedFields,
          updatedAt: Date.now(),
        });
        updateCount++;
      }
    }

    if (updateCount > 0) {
      await batch.commit();
    }

    return updateCount;
  }
}
