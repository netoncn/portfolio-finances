import type { FirestoreDataConverter } from "firebase/firestore";
import type { PointsOperation } from "../types/points";

export const pointsOperationConverter: FirestoreDataConverter<PointsOperation> =
  {
    toFirestore: (operation: PointsOperation) => {
      const { id, ...data } = operation;
      return data;
    },

    fromFirestore: (snapshot, options): PointsOperation => {
      const data = snapshot.data(options);
      return {
        id: snapshot.id,
        userId: data.userId,
        programId: data.programId,
        date: data.date,
        type: data.type,
        pointsDelta: data.pointsDelta,
        partnerOrAirline: data.partnerOrAirline,
        rateOrBonus: data.rateOrBonus,
        relatedPurchase: data.relatedPurchase,
        notes: data.notes,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    },
  };

export function toFirestore(
  operation: PointsOperation,
): Omit<PointsOperation, "id"> {
  const { id, ...data } = operation;
  return data;
}

export function fromFirestore(id: string, data: any): PointsOperation {
  return {
    id,
    userId: data.userId,
    programId: data.programId,
    date: data.date,
    type: data.type,
    pointsDelta: data.pointsDelta,
    partnerOrAirline: data.partnerOrAirline,
    rateOrBonus: data.rateOrBonus,
    relatedPurchase: data.relatedPurchase,
    notes: data.notes,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
