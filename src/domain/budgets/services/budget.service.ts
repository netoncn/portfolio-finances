import "server-only";
import { AuditService } from "@/domain/audit/services/audit.service";
import { adminDb } from "@/lib/firebase/firestore.admin";
import { removeUndefinedFields } from "@/lib/firebase/helpers";
import type {
  CreateBudgetDTO,
  UpdateBudgetDTO,
  UpdateBudgetSpentDTO,
} from "../dto/budget.dto";
import type { Budget, BudgetSummary } from "../types/budget";

const COLLECTION = "budgets";

export class BudgetService {
  static async create(dto: CreateBudgetDTO): Promise<Budget> {
    const now = Date.now();
    const docRef = adminDb.collection(COLLECTION).doc();

    const budgetData = removeUndefinedFields({
      ...dto,
      spent: 0,
      status: dto.status || "active",
      createdAt: now,
      updatedAt: now,
    }) as Omit<Budget, "id">;

    await docRef.set(budgetData);

    const budget: Budget = {
      id: docRef.id,
      ...budgetData,
    };

    await AuditService.recordEvent({
      eventType: "budget.created",
      userId: dto.userId,
      resourceType: "budget",
      resourceId: docRef.id,
      metadata: {
        source: "web",
        newValues: {
          name: dto.name,
          amount: dto.amount,
          period: dto.period,
          categoryIds: dto.categoryIds,
        },
      },
    }).catch((error) => {
      console.error("Failed to record audit event:", error);
    });

    return budget;
  }

  static async listByUser(userId: string): Promise<Budget[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Budget[];
  }

  static async listActiveByUser(userId: string): Promise<Budget[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("status", "==", "active")
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Budget[];
  }

  static async listByPeriod(userId: string, period: string): Promise<Budget[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("period", "==", period)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Budget[];
  }

  static async getById(id: string, userId: string): Promise<Budget | null> {
    const doc = await adminDb.collection(COLLECTION).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<Budget, "id">;

    if (data.userId !== userId) {
      return null;
    }

    return {
      id: doc.id,
      ...data,
    };
  }

  static async update(dto: UpdateBudgetDTO): Promise<Budget | null> {
    const { id, userId, ...updates } = dto;

    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<Budget, "id">;

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

    const updatedData = removeUndefinedFields({
      ...updates,
      updatedAt: Date.now(),
    });

    await docRef.update(updatedData);

    const updatedDoc = await docRef.get();
    const updatedBudget = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as Budget;

    if (changedFields.length > 0) {
      await AuditService.recordEvent({
        eventType: "budget.updated",
        userId,
        resourceType: "budget",
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

    return updatedBudget;
  }

  static async updateSpent(dto: UpdateBudgetSpentDTO): Promise<Budget | null> {
    const { id, userId, spent, lastCalculatedAt } = dto;

    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<Budget, "id">;

    if (data.userId !== userId) {
      return null;
    }

    await docRef.update({
      spent,
      lastCalculatedAt,
      updatedAt: Date.now(),
    });

    const updatedDoc = await docRef.get();
    return {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as Budget;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    const data = doc.data() as Omit<Budget, "id">;

    if (data.userId !== userId) {
      return false;
    }

    await docRef.delete();

    await AuditService.recordEvent({
      eventType: "budget.deleted",
      userId,
      resourceType: "budget",
      resourceId: id,
      metadata: {
        source: "web",
        previousValues: {
          name: data.name,
          amount: data.amount,
          period: data.period,
        },
      },
    }).catch((error) => {
      console.error("Failed to record audit event:", error);
    });

    return true;
  }

  static async getSummary(userId: string): Promise<BudgetSummary[]> {
    const budgets = await BudgetService.listActiveByUser(userId);
    const now = Date.now();

    return budgets.map((budget) => {
      const remaining = budget.amount - budget.spent;
      const percentageUsed = (budget.spent / budget.amount) * 100;
      const isOverBudget = budget.spent > budget.amount;

      let daysRemaining: number | undefined;
      if (budget.endDate) {
        const msRemaining = budget.endDate - now;
        daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
      }

      return {
        budgetId: budget.id,
        budgetName: budget.name,
        amount: budget.amount,
        spent: budget.spent,
        remaining,
        percentageUsed,
        isOverBudget,
        daysRemaining,
        categoryIds: budget.categoryIds,
      };
    });
  }

  static async getBudgetsNeedingAlerts(userId: string): Promise<Budget[]> {
    const budgets = await BudgetService.listActiveByUser(userId);

    return budgets.filter((budget) => {
      if (!budget.alertThreshold) {
        return false;
      }

      const percentageUsed = budget.spent / budget.amount;
      return percentageUsed >= budget.alertThreshold;
    });
  }

  static async getBudgetsByCategories(
    userId: string,
    categoryIds: string[],
  ): Promise<Budget[]> {
    const budgets = await BudgetService.listActiveByUser(userId);

    return budgets.filter((budget) => {
      if (budget.categoryIds.length === 0) {
        return true;
      }

      return budget.categoryIds.some((catId) => categoryIds.includes(catId));
    });
  }
}
