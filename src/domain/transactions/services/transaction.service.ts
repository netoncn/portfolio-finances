import "server-only";
import { AccountService } from "@/domain/accounts/services/account.service";
import { AuditService } from "@/domain/audit/services/audit.service";
import { adminDb } from "@/lib/firebase/firestore.admin";
import { removeUndefinedFields } from "@/lib/firebase/helpers";
import type {
  CreateTransactionDTO,
  UpdateTransactionDTO,
} from "../dto/transaction.dto";
import { extractDenormalizedFields } from "../helpers/denormalization.helper";
import type { Transaction } from "../types/transaction";

const COLLECTION = "transactions";

export class TransactionService {
  static async create(
    dto: CreateTransactionDTO,
    source: "web" | "api" | "import" = "web",
  ): Promise<Transaction> {
    const now = Date.now();
    const docRef = adminDb.collection(COLLECTION).doc();

    const account = await AccountService.getById(dto.accountId, dto.userId);
    if (!account) {
      throw new Error("Account not found");
    }

    const denormalizedFields = extractDenormalizedFields(account);

    const transactionData = removeUndefinedFields({
      ...dto,
      ...denormalizedFields,
      createdAt: now,
      updatedAt: now,
    }) as Omit<Transaction, "id">;

    await docRef.set(transactionData);

    const transaction: Transaction = {
      id: docRef.id,
      ...transactionData,
    };

    await AuditService.recordEvent({
      eventType:
        source === "import" ? "transaction.imported" : "transaction.created",
      userId: dto.userId,
      resourceType: "transaction",
      resourceId: docRef.id,
      metadata: {
        source,
        newValues: {
          accountId: dto.accountId,
          amount: dto.amount,
          type: dto.type,
          description: dto.description,
          categoryId: dto.categoryId,
        },
      },
    }).catch((error) => {
      console.error("Failed to record audit event:", error);
    });

    return transaction;
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

  static async listByDateRange(
    userId: string,
    startDate: number,
    endDate: number,
  ): Promise<Transaction[]> {
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

    const changedFields: string[] = [];
    const previousValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    Object.keys(updates).forEach((key) => {
      const typedKey = key as keyof typeof updates;
      if (data[typedKey] !== updates[typedKey]) {
        changedFields.push(key);
        previousValues[key] = data[typedKey];
        newValues[key] = updates[typedKey];
      }
    });

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

    const cleanUpdatedData = removeUndefinedFields(updatedData);

    await docRef.update(cleanUpdatedData);

    const updatedDoc = await docRef.get();
    const updatedTransaction = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as Transaction;

    if (changedFields.length > 0) {
      await AuditService.recordEvent({
        eventType: "transaction.updated",
        userId,
        resourceType: "transaction",
        resourceId: id,
        metadata: {
          source: "web",
          changedFields,
          previousValues,
          newValues,
        },
      }).catch((error) => {
        console.error("Failed to record audit event:", error);
      });
    }

    return updatedTransaction;
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

    await AuditService.recordEvent({
      eventType: "transaction.deleted",
      userId,
      resourceType: "transaction",
      resourceId: id,
      metadata: {
        source: "web",
        previousValues: {
          accountId: data.accountId,
          amount: data.amount,
          type: data.type,
          description: data.description,
          date: data.date,
        },
      },
    }).catch((error) => {
      console.error("Failed to record audit event:", error);
    });

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
      .update(
        removeUndefinedFields({
          ...denormalizedFields,
          updatedAt: Date.now(),
        }),
      );

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
        batch.update(
          docRef,
          removeUndefinedFields({
            ...denormalizedFields,
            updatedAt: Date.now(),
          }),
        );
        updateCount++;
      }
    }

    if (updateCount > 0) {
      await batch.commit();
    }

    return updateCount;
  }

  static async recordBulkImport(
    userId: string,
    importId: string,
    stats: {
      batchSize: number;
      successCount: number;
      errorCount: number;
      duplicateCount: number;
    },
  ): Promise<void> {
    await AuditService.recordEvent({
      eventType: "transaction.bulk_imported",
      userId,
      resourceType: "transaction",
      resourceId: importId,
      metadata: {
        source: "import",
        importId,
        batchSize: stats.batchSize,
        successCount: stats.successCount,
        errorCount: stats.errorCount,
        duplicateCount: stats.duplicateCount,
      },
    }).catch((error) => {
      console.error("Failed to record bulk import audit event:", error);
    });
  }
}
