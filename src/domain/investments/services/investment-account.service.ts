import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { AuditService } from "@/domain/audit/services/audit.service";
import { adminDb } from "@/lib/firebase/firestore.admin";
import type {
  CreateInvestmentAccountDTO,
  UpdateInvestmentAccountDTO,
} from "../dto/investment.dto";
import type { InvestmentAccount } from "../types";

const COLLECTION = "investmentAccounts";

export class InvestmentAccountService {
  static async create(
    dto: CreateInvestmentAccountDTO,
  ): Promise<InvestmentAccount> {
    const now = Date.now();
    const docRef = adminDb.collection(COLLECTION).doc();

    const accountData = {
      ...dto,
      createdAt: now,
      updatedAt: now,
      archived: false,
    };

    await docRef.set(accountData);

    const account: InvestmentAccount = {
      id: docRef.id,
      ...accountData,
    };

    AuditService.recordEvent({
      eventType: "investment_account.created",
      userId: dto.userId,
      resourceType: "investment_account",
      resourceId: docRef.id,
      metadata: {
        source: "web",
        newValues: {
          name: accountData.name,
          broker: accountData.broker,
          accountType: accountData.accountType,
        },
      },
    }).catch(() => {});

    return account;
  }

  static async listByUser(
    userId: string,
    includeArchived = false,
  ): Promise<InvestmentAccount[]> {
    let query = adminDb.collection(COLLECTION).where("userId", "==", userId);

    if (!includeArchived) {
      query = query.where("archived", "==", false);
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as InvestmentAccount[];
  }

  static async getById(
    id: string,
    userId: string,
  ): Promise<InvestmentAccount | null> {
    const doc = await adminDb.collection(COLLECTION).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<InvestmentAccount, "id">;

    if (data.userId !== userId) {
      return null;
    }

    return {
      id: doc.id,
      ...data,
    };
  }

  static async update(
    dto: UpdateInvestmentAccountDTO,
  ): Promise<InvestmentAccount | null> {
    const { id, userId, ...updates } = dto;

    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<InvestmentAccount, "id">;

    if (data.userId !== userId) {
      return null;
    }

    const now = Date.now();
    const updateData = {
      ...updates,
      updatedAt: now,
    };

    await docRef.update(updateData);

    const updated: InvestmentAccount = {
      id: doc.id,
      ...data,
      ...updates,
      updatedAt: now,
    };

    AuditService.recordEvent({
      eventType: "investment_account.updated",
      userId,
      resourceType: "investment_account",
      resourceId: id,
      metadata: {
        source: "web",
        previousValues: {
          name: data.name,
          broker: data.broker,
        },
        newValues: {
          name: updated.name,
          broker: updated.broker,
        },
      },
    }).catch(() => {});

    return updated;
  }

  static async archive(id: string, userId: string): Promise<boolean> {
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    const data = doc.data() as Omit<InvestmentAccount, "id">;

    if (data.userId !== userId) {
      return false;
    }

    const now = Date.now();
    await docRef.update({
      archived: true,
      archivedAt: now,
      updatedAt: now,
    });

    AuditService.recordEvent({
      eventType: "investment_account.archived",
      userId,
      resourceType: "investment_account",
      resourceId: id,
      metadata: {
        source: "web",
      },
    }).catch(() => {});

    return true;
  }

  static async unarchive(id: string, userId: string): Promise<boolean> {
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    const data = doc.data() as Omit<InvestmentAccount, "id">;

    if (data.userId !== userId) {
      return false;
    }

    await docRef.update({
      archived: false,
      archivedAt: FieldValue.delete(),
      updatedAt: Date.now(),
    });

    AuditService.recordEvent({
      eventType: "investment_account.unarchived",
      userId,
      resourceType: "investment_account",
      resourceId: id,
      metadata: {
        source: "web",
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

    const data = doc.data() as Omit<InvestmentAccount, "id">;

    if (data.userId !== userId) {
      return false;
    }

    // TODO: Verificar se existem posições ativas nesta conta antes de deletar
    // TODO: Considerar implementar soft delete em vez de hard delete

    await docRef.delete();

    AuditService.recordEvent({
      eventType: "investment_account.deleted",
      userId,
      resourceType: "investment_account",
      resourceId: id,
      metadata: {
        source: "web",
        previousValues: {
          name: data.name,
          broker: data.broker,
        },
      },
    }).catch(() => {});

    return true;
  }
}
