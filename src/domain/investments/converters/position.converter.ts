import type { FirestoreDataConverter } from "firebase/firestore";
import type { Position } from "../types";

export const positionConverter: FirestoreDataConverter<Position> = {
  toFirestore: (position: Position) => {
    const { id, ...data } = position;
    return data;
  },

  fromFirestore: (snapshot, options): Position => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      userId: data.userId,
      investmentAccountId: data.investmentAccountId,
      ticker: data.ticker,
      assetType: data.assetType,
      assetName: data.assetName,
      quantity: data.quantity,
      averagePrice: data.averagePrice,
      currency: data.currency,
      notes: data.notes,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
};

export function toFirestore(position: Position): Omit<Position, "id"> {
  const { id, ...data } = position;
  return data;
}

export function fromFirestore(id: string, data: any): Position {
  return {
    id,
    userId: data.userId,
    investmentAccountId: data.investmentAccountId,
    ticker: data.ticker,
    assetType: data.assetType,
    assetName: data.assetName,
    quantity: data.quantity,
    averagePrice: data.averagePrice,
    currency: data.currency,
    notes: data.notes,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
