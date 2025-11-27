import type { FirestoreDataConverter } from "firebase/firestore";
import type { PointsBalance } from "../types/points";

export const pointsBalanceConverter: FirestoreDataConverter<PointsBalance> = {
  toFirestore: (balance: PointsBalance) => {
    const { id, ...data } = balance;
    return data;
  },

  fromFirestore: (snapshot, options): PointsBalance => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      userId: data.userId,
      programId: data.programId,
      points: data.points,
      earnedAt: data.earnedAt,
      expiresAt: data.expiresAt,
      source: data.source,
      promoTag: data.promoTag,
      status: data.status,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
};

export function toFirestore(balance: PointsBalance): Omit<PointsBalance, "id"> {
  const { id, ...data } = balance;
  return data;
}

export function fromFirestore(id: string, data: any): PointsBalance {
  return {
    id,
    userId: data.userId,
    programId: data.programId,
    points: data.points,
    earnedAt: data.earnedAt,
    expiresAt: data.expiresAt,
    source: data.source,
    promoTag: data.promoTag,
    status: data.status,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
