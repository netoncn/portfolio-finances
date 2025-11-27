import "server-only";
import type { FirestoreDataConverter } from "firebase-admin/firestore";
import type { Budget } from "../types/budget";

export const budgetConverter: FirestoreDataConverter<Budget> = {
  toFirestore: (budget: Budget) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = budget;
    return data;
  },

  fromFirestore: (snapshot) => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      userId: data.userId,
      name: data.name,
      amount: data.amount,
      period: data.period,
      categoryIds: data.categoryIds || [],
      startDate: data.startDate,
      endDate: data.endDate,
      spent: data.spent || 0,
      alertThreshold: data.alertThreshold,
      status: data.status || "active",
      icon: data.icon,
      color: data.color,
      notes: data.notes,
      rollover: data.rollover || false,
      lastCalculatedAt: data.lastCalculatedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as Budget;
  },
};

export function toFirestore(budget: Budget): Omit<Budget, "id"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...data } = budget;
  return data;
}

export function fromFirestore(id: string, data: any): Budget {
  return {
    id,
    userId: data.userId,
    name: data.name,
    amount: data.amount,
    period: data.period,
    categoryIds: data.categoryIds || [],
    startDate: data.startDate,
    endDate: data.endDate,
    spent: data.spent || 0,
    alertThreshold: data.alertThreshold,
    status: data.status || "active",
    icon: data.icon,
    color: data.color,
    notes: data.notes,
    rollover: data.rollover || false,
    lastCalculatedAt: data.lastCalculatedAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  } as Budget;
}
