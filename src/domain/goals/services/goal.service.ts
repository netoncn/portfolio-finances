import "server-only";
import { AuditService } from "@/domain/audit/services/audit.service";
import { adminDb } from "@/lib/firebase/firestore.admin";
import { removeUndefinedFields } from "@/lib/firebase/helpers";
import type {
  CreateGoalDTO,
  UpdateGoalDTO,
  UpdateGoalProgressDTO,
} from "../dto/goal.dto";
import { calculateProgress } from "../helpers/goal.helper";
import type { Goal, GoalProgress, GoalSummary } from "../types/goal";

const COLLECTION = "goals";

export class GoalService {
  static async create(dto: CreateGoalDTO): Promise<Goal> {
    const now = Date.now();
    const docRef = adminDb.collection(COLLECTION).doc();

    const goalData = removeUndefinedFields({
      ...dto,
      currentAmount: dto.currentAmount ?? 0,
      status: "active",
      startDate: now,
      createdAt: now,
      updatedAt: now,
    }) as Omit<Goal, "id">;

    await docRef.set(goalData);

    const goal: Goal = {
      id: docRef.id,
      ...goalData,
    };

    await AuditService.recordEvent({
      eventType: "goal.created",
      userId: dto.userId,
      resourceType: "goal",
      resourceId: docRef.id,
      metadata: {
        source: "web",
        newValues: {
          name: dto.name,
          targetAmount: dto.targetAmount,
          category: dto.category,
          priority: dto.priority,
        },
      },
    }).catch((error) => {
      console.error("Failed to record audit event:", error);
    });

    return goal;
  }

  static async getById(id: string, userId: string): Promise<Goal | null> {
    const doc = await adminDb.collection(COLLECTION).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<Goal, "id">;

    if (data.userId !== userId) {
      return null;
    }

    return {
      id: doc.id,
      ...data,
    };
  }

  static async listByUser(userId: string): Promise<Goal[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Goal[];
  }

  static async listActiveByUser(userId: string): Promise<Goal[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("status", "==", "active")
      .orderBy("priority", "desc")
      .orderBy("targetDate", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Goal[];
  }

  static async update(dto: UpdateGoalDTO): Promise<Goal | null> {
    const { id, userId, ...updates } = dto;

    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<Goal, "id">;

    if (data.userId !== userId) {
      return null;
    }

    const changedFields: string[] = [];
    const previousValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    for (const key of Object.keys(updates)) {
      const typedKey = key as keyof typeof updates;
      if (data[typedKey] !== updates[typedKey]) {
        changedFields.push(key);
        previousValues[key] = data[typedKey];
        newValues[key] = updates[typedKey];
      }
    }

    const updatableupdates = updates as Partial<Goal>;
    if (
      updatableupdates.status === "completed" &&
      data.status !== "completed"
    ) {
      updatableupdates.completedDate = Date.now();
    }

    const updatedData = removeUndefinedFields({
      ...updates,
      updatedAt: Date.now(),
    });

    await docRef.update(updatedData);

    const updatedDoc = await docRef.get();
    const updatedGoal = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as Goal;

    if (changedFields.length > 0) {
      await AuditService.recordEvent({
        eventType: "goal.updated",
        userId,
        resourceType: "goal",
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

    return updatedGoal;
  }

  static async updateProgress(
    dto: UpdateGoalProgressDTO,
  ): Promise<Goal | null> {
    const { id, userId, currentAmount, notes } = dto;

    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<Goal, "id">;

    if (data.userId !== userId) {
      return null;
    }

    const updates: Partial<Goal> = {
      currentAmount,
      updatedAt: Date.now(),
    };

    if (currentAmount >= data.targetAmount && data.status === "active") {
      updates.status = "completed";
      updates.completedDate = Date.now();
    }

    if (notes) {
      updates.notes = notes;
    }

    await docRef.update(updates);

    const updatedDoc = await docRef.get();
    const updatedGoal = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as Goal;

    await AuditService.recordEvent({
      eventType: "goal.progress_updated",
      userId,
      resourceType: "goal",
      resourceId: id,
      metadata: {
        source: "web",
        previousAmount: data.currentAmount,
        newAmount: currentAmount,
        targetAmount: data.targetAmount,
        percentageComplete: (currentAmount / data.targetAmount) * 100,
      },
    }).catch((error) => {
      console.error("Failed to record audit event:", error);
    });

    return updatedGoal;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    const data = doc.data() as Omit<Goal, "id">;

    if (data.userId !== userId) {
      return false;
    }

    await docRef.delete();

    await AuditService.recordEvent({
      eventType: "goal.deleted",
      userId,
      resourceType: "goal",
      resourceId: id,
      metadata: {
        source: "web",
        deletedValues: {
          name: data.name,
          targetAmount: data.targetAmount,
          currentAmount: data.currentAmount,
        },
      },
    }).catch((error) => {
      console.error("Failed to record audit event:", error);
    });

    return true;
  }

  static calculateProgress(goal: Goal): GoalProgress {
    return calculateProgress(goal);
  }

  static async getSummary(userId: string): Promise<GoalSummary> {
    const goals = await GoalService.listByUser(userId);

    const activeGoals = goals.filter((g) => g.status === "active");
    const completedGoals = goals.filter((g) => g.status === "completed");

    const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalCurrentAmount = goals.reduce(
      (sum, g) => sum + g.currentAmount,
      0,
    );
    const totalRemainingAmount = totalTargetAmount - totalCurrentAmount;
    const overallProgress =
      totalTargetAmount > 0
        ? (totalCurrentAmount / totalTargetAmount) * 100
        : 0;

    return {
      totalGoals: goals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      totalTargetAmount,
      totalCurrentAmount,
      totalRemainingAmount,
      overallProgress: Math.min(overallProgress, 100),
    };
  }
}
