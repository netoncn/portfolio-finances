import "server-only";
import { AuditService } from "@/domain/audit/services/audit.service";
import { adminDb } from "@/lib/firebase/firestore.admin";
import { removeUndefinedFields } from "@/lib/firebase/helpers";
import type { CreateCategoryDTO, UpdateCategoryDTO } from "../dto/category.dto";
import { type Category, DEFAULT_CATEGORIES } from "../types/category";

const COLLECTION = "categories";

export class CategoryService {
  static async create(dto: CreateCategoryDTO): Promise<Category> {
    const now = Date.now();
    const docRef = adminDb.collection(COLLECTION).doc();

    let order = dto.order;
    if (order === undefined) {
      const snapshot = await adminDb
        .collection(COLLECTION)
        .where("userId", "==", dto.userId)
        .orderBy("order", "desc")
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const maxOrder = snapshot.docs[0].data().order;
        order = typeof maxOrder === "number" ? maxOrder + 1 : 0;
      } else {
        order = 0;
      }
    }

    const categoryData = removeUndefinedFields({
      ...dto,
      order,
      createdAt: now,
      updatedAt: now,
    }) as Omit<Category, "id">;

    await docRef.set(categoryData);

    const category: Category = {
      id: docRef.id,
      ...categoryData,
    };

    await AuditService.recordEvent({
      eventType: "category.created",
      userId: dto.userId,
      resourceType: "category",
      resourceId: docRef.id,
      metadata: {
        source: "web",
        newValues: {
          name: dto.name,
          type: dto.type,
          isSystem: dto.isSystem,
        },
      },
    }).catch((error) => {
      console.error("Failed to record audit event:", error);
    });

    return category;
  }

  static async listByUser(userId: string): Promise<Category[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .orderBy("order", "asc")
      .orderBy("createdAt", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Category[];
  }

  static async listByUserAndType(
    userId: string,
    type: string,
  ): Promise<Category[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("type", "==", type)
      .orderBy("order", "asc")
      .orderBy("createdAt", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Category[];
  }

  static async getById(id: string, userId: string): Promise<Category | null> {
    const doc = await adminDb.collection(COLLECTION).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<Category, "id">;

    if (data.userId !== userId) {
      return null;
    }

    return {
      id: doc.id,
      ...data,
    };
  }

  static async update(dto: UpdateCategoryDTO): Promise<Category | null> {
    const { id, userId, ...updates } = dto;

    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as Omit<Category, "id">;

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
    const updatedCategory = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as Category;

    if (changedFields.length > 0) {
      await AuditService.recordEvent({
        eventType: "category.updated",
        userId,
        resourceType: "category",
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

    return updatedCategory;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    const data = doc.data() as Omit<Category, "id">;

    if (data.userId !== userId) {
      return false;
    }

    if (data.isSystem) {
      throw new Error("Cannot delete system categories");
    }

    await docRef.delete();

    await AuditService.recordEvent({
      eventType: "category.deleted",
      userId,
      resourceType: "category",
      resourceId: id,
      metadata: {
        source: "web",
        previousValues: {
          name: data.name,
          type: data.type,
        },
      },
    }).catch((error) => {
      console.error("Failed to record audit event:", error);
    });

    return true;
  }

  static async createDefaultCategories(userId: string): Promise<Category[]> {
    const now = Date.now();
    const batch = adminDb.batch();
    const categories: Category[] = [];

    for (const [index, defaultCategory] of DEFAULT_CATEGORIES.entries()) {
      const docRef = adminDb.collection(COLLECTION).doc();
      const categoryData = {
        ...defaultCategory,
        userId,
        isSystem: true,
        order: index,
        createdAt: now,
        updatedAt: now,
      };

      batch.set(docRef, categoryData);

      categories.push({
        id: docRef.id,
        ...categoryData,
      });
    }

    await batch.commit();

    await AuditService.recordEvent({
      eventType: "category.bulk_created",
      userId,
      resourceType: "category",
      resourceId: "default",
      metadata: {
        source: "system",
        count: DEFAULT_CATEGORIES.length,
      },
    }).catch((error) => {
      console.error("Failed to record audit event:", error);
    });

    return categories;
  }

  static async search(userId: string, query: string): Promise<Category[]> {
    const categories = await CategoryService.listByUser(userId);
    const lowerQuery = query.toLowerCase();

    return categories.filter((category) => {
      const matchesName = category.name.toLowerCase().includes(lowerQuery);
      const matchesKeywords = category.keywords?.some((keyword) =>
        keyword.toLowerCase().includes(lowerQuery),
      );
      return matchesName || matchesKeywords;
    });
  }

  static async getSubcategories(
    parentId: string,
    userId: string,
  ): Promise<Category[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("parentId", "==", parentId)
      .orderBy("order", "asc")
      .orderBy("createdAt", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Category[];
  }

  static async updateOrder(
    userId: string,
    categoryOrders: Array<{ id: string; order: number }>,
  ): Promise<void> {
    const batch = adminDb.batch();
    const now = Date.now();

    for (const { id, order } of categoryOrders) {
      const docRef = adminDb.collection(COLLECTION).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        continue;
      }

      const data = doc.data() as Omit<Category, "id">;

      if (data.userId !== userId) {
        continue;
      }

      batch.update(docRef, {
        order,
        updatedAt: now,
      });
    }

    await batch.commit();
  }
}
