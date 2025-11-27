import type { FirestoreDataConverter } from "firebase/firestore";
import type { Category } from "../types/category";

export const categoryConverter: FirestoreDataConverter<Category> = {
  toFirestore: (category: Category) => {
    const { id, ...data } = category;
    return data;
  },

  fromFirestore: (snapshot, options): Category => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      userId: data.userId,
      name: data.name,
      type: data.type,
      icon: data.icon,
      color: data.color,
      parentId: data.parentId,
      keywords: data.keywords,
      budgetLimit: data.budgetLimit,
      isSystem: data.isSystem,
      order: data.order,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
};

export function toFirestore(category: Category): Omit<Category, "id"> {
  const { id, ...data } = category;
  return data;
}

export function fromFirestore(id: string, data: any): Category {
  return {
    id,
    userId: data.userId,
    name: data.name,
    type: data.type,
    icon: data.icon,
    color: data.color,
    parentId: data.parentId,
    keywords: data.keywords,
    budgetLimit: data.budgetLimit,
    isSystem: data.isSystem,
    order: data.order,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
