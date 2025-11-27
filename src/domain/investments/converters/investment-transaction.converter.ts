import type { FirestoreDataConverter } from "firebase/firestore";
import type { InvestmentTransaction } from "../types";

export const investmentTransactionConverter: FirestoreDataConverter<InvestmentTransaction> =
  {
    toFirestore: (transaction: InvestmentTransaction) => {
      const { id, ...data } = transaction;
      return data;
    },

    fromFirestore: (snapshot, options): InvestmentTransaction => {
      const data = snapshot.data(options);
      return {
        id: snapshot.id,
        userId: data.userId,
        investmentAccountId: data.investmentAccountId,
        positionId: data.positionId,
        ticker: data.ticker,
        transactionType: data.transactionType,
        quantity: data.quantity,
        price: data.price,
        amount: data.amount,
        fees: data.fees,
        currency: data.currency,
        date: data.date,
        notes: data.notes,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    },
  };

export function toFirestore(
  transaction: InvestmentTransaction,
): Omit<InvestmentTransaction, "id"> {
  const { id, ...data } = transaction;
  return data;
}

export function fromFirestore(id: string, data: any): InvestmentTransaction {
  return {
    id,
    userId: data.userId,
    investmentAccountId: data.investmentAccountId,
    positionId: data.positionId,
    ticker: data.ticker,
    transactionType: data.transactionType,
    quantity: data.quantity,
    price: data.price,
    amount: data.amount,
    fees: data.fees,
    currency: data.currency,
    date: data.date,
    notes: data.notes,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
