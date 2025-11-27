import type { FirestoreDataConverter } from "firebase/firestore";
import type { Earning } from "../types";

export const earningConverter: FirestoreDataConverter<Earning> = {
  toFirestore: (earning: Earning) => {
    const { id, ...data } = earning;
    return data;
  },

  fromFirestore: (snapshot, options): Earning => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      userId: data.userId,
      investmentAccountId: data.investmentAccountId,
      positionId: data.positionId,
      ticker: data.ticker,
      earningType: data.earningType,
      amount: data.amount,
      amountPerShare: data.amountPerShare,
      quantity: data.quantity,
      paymentDate: data.paymentDate,
      exDate: data.exDate,
      recordDate: data.recordDate,
      currency: data.currency,
      taxWithheld: data.taxWithheld,
      notes: data.notes,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
};

export function toFirestore(earning: Earning): Omit<Earning, "id"> {
  const { id, ...data } = earning;
  return data;
}

export function fromFirestore(id: string, data: any): Earning {
  return {
    id,
    userId: data.userId,
    investmentAccountId: data.investmentAccountId,
    positionId: data.positionId,
    ticker: data.ticker,
    earningType: data.earningType,
    amount: data.amount,
    amountPerShare: data.amountPerShare,
    quantity: data.quantity,
    paymentDate: data.paymentDate,
    exDate: data.exDate,
    recordDate: data.recordDate,
    currency: data.currency,
    taxWithheld: data.taxWithheld,
    notes: data.notes,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
