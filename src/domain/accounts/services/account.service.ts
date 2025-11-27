import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { AuditService } from "@/domain/audit/services/audit.service";
import { adminDb } from "@/lib/firebase/firestore.admin";
import type { CreateAccountDTO, UpdateAccountDTO } from "../dto/account.dto";
import type { Account } from "../types/account";

const COLLECTION = "accounts";

export class AccountService {
  static async create(dto: CreateAccountDTO): Promise<Account> {
    const now = Date.now();
    const docRef = adminDb.collection(COLLECTION).doc();

    const accountData = {
      ...dto,
      ...(dto.billing?.creditLimit && {
        billing: {
          ...dto.billing,
          availableCredit: dto.billing.creditLimit,
        },
      }),
      createdAt: now,
      updatedAt: now,
      archived: false,
    };

    await docRef.set(accountData);

    const account = {
      id: docRef.id,
      ...accountData,
    };

    AuditService.recordEvent({
      eventType: "account.created",
      userId: dto.userId,
      resourceType: "account",
      resourceId: docRef.id,
      metadata: {
        source: "web",
        newValues: {
          name: accountData.name,
          accountType: accountData.accountType,
        },
      },
    }).catch(() => {});

    return account;
  }

  static async listByUser(
    userId: string,
    includeArchived = false,
  ): Promise<Account[]> {
    let query = adminDb.collection(COLLECTION).where("userId", "==", userId);

    if (!includeArchived) {
      query = query.where("archived", "==", false);
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Account[];
  }

  static async getById(id: string, userId: string): Promise<Account | null> {
    const doc = await adminDb.collection(COLLECTION).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<Account, "id">;

    if (data.userId !== userId) {
      return null;
    }

    return {
      id: doc.id,
      ...data,
    };
  }

  static async update(dto: UpdateAccountDTO): Promise<Account | null> {
    const { id, userId, ...updates } = dto;

    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<Account, "id">;

    if (data.userId !== userId) {
      return null;
    }

    const updatedData = {
      ...updates,
      updatedAt: Date.now(),
    };

    await docRef.update(updatedData);

    const updatedDoc = await docRef.get();
    const account = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as Account;

    const changedFields = Object.keys(updates);
    AuditService.recordEvent({
      eventType: "account.updated",
      userId,
      resourceType: "account",
      resourceId: id,
      metadata: {
        source: "web",
        changedFields,
        previousValues: changedFields.reduce(
          (acc, field) => {
            acc[field] = (data as any)[field];
            return acc;
          },
          {} as Record<string, unknown>,
        ),
        newValues: changedFields.reduce(
          (acc, field) => {
            acc[field] = (updates as any)[field];
            return acc;
          },
          {} as Record<string, unknown>,
        ),
      },
    }).catch(() => {});

    return account;
  }

  static async archive(id: string, userId: string): Promise<boolean> {
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    const data = doc.data() as Omit<Account, "id">;

    if (data.userId !== userId) {
      return false;
    }

    await docRef.update({
      archived: true,
      archivedAt: Date.now(),
      updatedAt: Date.now(),
    });

    AuditService.recordEvent({
      eventType: "account.archived",
      userId,
      resourceType: "account",
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

    const data = doc.data() as Omit<Account, "id">;

    if (data.userId !== userId) {
      return false;
    }

    await docRef.update({
      archived: false,
      archivedAt: FieldValue.delete(),
      updatedAt: Date.now(),
    });

    AuditService.recordEvent({
      eventType: "account.unarchived",
      userId,
      resourceType: "account",
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

    const data = doc.data() as Omit<Account, "id">;

    if (data.userId !== userId) {
      return false;
    }

    await AuditService.recordEvent({
      eventType: "account.deleted",
      userId,
      resourceType: "account",
      resourceId: id,
      metadata: {
        source: "web",
        previousValues: {
          name: data.name,
          accountType: data.accountType,
        },
      },
    }).catch(() => {});

    await docRef.delete();
    return true;
  }
}
