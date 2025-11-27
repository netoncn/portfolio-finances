import "server-only";
import { AuditService } from "@/domain/audit/services/audit.service";
import { adminDb } from "@/lib/firebase/firestore.admin";
import type {
  CreateInvestmentTransactionDTO,
  UpdateInvestmentTransactionDTO,
} from "../dto/investment.dto";
import type { InvestmentTransaction } from "../types";

const COLLECTION = "investmentTransactions";

export class InvestmentTransactionService {
  static async create(
    dto: CreateInvestmentTransactionDTO,
  ): Promise<InvestmentTransaction> {
    const now = Date.now();
    const docRef = adminDb.collection(COLLECTION).doc();

    const transactionData = {
      ...dto,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(transactionData);

    const transaction: InvestmentTransaction = {
      id: docRef.id,
      ...transactionData,
    };

    AuditService.recordEvent({
      eventType: "investment_transaction.created",
      userId: dto.userId,
      resourceType: "investment_transaction",
      resourceId: docRef.id,
      metadata: {
        source: "web",
        newValues: {
          transactionType: transactionData.transactionType,
          ticker: transactionData.ticker,
          amount: transactionData.amount,
        },
      },
    }).catch(() => {});

    return transaction;
  }

  static async listByUser(
    userId: string,
    limit?: number,
  ): Promise<InvestmentTransaction[]> {
    let query = adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .orderBy("date", "desc");

    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as InvestmentTransaction[];
  }

  static async listByAccount(
    userId: string,
    investmentAccountId: string,
    limit?: number,
  ): Promise<InvestmentTransaction[]> {
    let query = adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("investmentAccountId", "==", investmentAccountId)
      .orderBy("date", "desc");

    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as InvestmentTransaction[];
  }

  static async listByPosition(
    userId: string,
    positionId: string,
    limit?: number,
  ): Promise<InvestmentTransaction[]> {
    let query = adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("positionId", "==", positionId)
      .orderBy("date", "desc");

    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as InvestmentTransaction[];
  }

  static async listByTicker(
    userId: string,
    ticker: string,
    limit?: number,
  ): Promise<InvestmentTransaction[]> {
    let query = adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("ticker", "==", ticker.toUpperCase())
      .orderBy("date", "desc");

    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as InvestmentTransaction[];
  }

  static async listByDateRange(
    userId: string,
    startDate: number,
    endDate: number,
  ): Promise<InvestmentTransaction[]> {
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
    })) as InvestmentTransaction[];
  }

  static async getById(
    id: string,
    userId: string,
  ): Promise<InvestmentTransaction | null> {
    const doc = await adminDb.collection(COLLECTION).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<InvestmentTransaction, "id">;

    if (data.userId !== userId) {
      return null;
    }

    return {
      id: doc.id,
      ...data,
    };
  }

  static async update(
    dto: UpdateInvestmentTransactionDTO,
  ): Promise<InvestmentTransaction | null> {
    const { id, userId, ...updates } = dto;

    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<InvestmentTransaction, "id">;

    if (data.userId !== userId) {
      return null;
    }

    const now = Date.now();
    const updateData = {
      ...updates,
      updatedAt: now,
    };

    await docRef.update(updateData);

    const updated: InvestmentTransaction = {
      id: doc.id,
      ...data,
      ...updates,
      updatedAt: now,
    };

    AuditService.recordEvent({
      eventType: "investment_transaction.updated",
      userId,
      resourceType: "investment_transaction",
      resourceId: id,
      metadata: {
        source: "web",
        previousValues: {
          transactionType: data.transactionType,
          amount: data.amount,
        },
        newValues: {
          transactionType: updated.transactionType,
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

    const data = doc.data() as Omit<InvestmentTransaction, "id">;

    if (data.userId !== userId) {
      return false;
    }

    // TODO: Atualizar posição relacionada se for transação de compra/venda

    await docRef.delete();

    AuditService.recordEvent({
      eventType: "investment_transaction.deleted",
      userId,
      resourceType: "investment_transaction",
      resourceId: id,
      metadata: {
        source: "web",
        previousValues: {
          transactionType: data.transactionType,
          ticker: data.ticker,
          amount: data.amount,
        },
      },
    }).catch(() => {});

    return true;
  }
}
