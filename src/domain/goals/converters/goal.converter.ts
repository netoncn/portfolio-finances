import "server-only";
import type { FirestoreDataConverter } from "firebase-admin/firestore";
import type { Goal } from "../types/goal";

export const goalConverter: FirestoreDataConverter<Goal> = {
  toFirestore: (goal: Goal) => {
    const { id: _id, ...data } = goal;
    return data;
  },
  fromFirestore: (snapshot) => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...data,
    } as Goal;
  },
};

export function toFirestore(goal: Goal): Omit<Goal, "id"> {
  const { id: _id, ...data } = goal;
  return data;
}

export function fromFirestore(
  id: string,
  data: FirebaseFirestore.DocumentData,
): Goal {
  return {
    id,
    ...data,
  } as Goal;
}
