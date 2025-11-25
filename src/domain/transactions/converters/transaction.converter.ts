import type { FirestoreDataConverter } from "firebase/firestore";
import type { Transaction } from "../types/transaction";

export const transactionConverter: FirestoreDataConverter<Transaction> = {
  toFirestore: (transaction: Transaction) => {
    const { id, ...data } = transaction;
    return data;
  },

  fromFirestore: (snapshot, options): Transaction => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      userId: data.userId,
      accountId: data.accountId,
      accountType: data.accountType,
      cardBrand: data.cardBrand,
      date: data.date,
      description: data.description,
      merchant: data.merchant,
      amount: data.amount,
      type: data.type,
      categoryId: data.categoryId,
      tags: data.tags,
      installmentGroupId: data.installmentGroupId,
      installmentNumber: data.installmentNumber,
      installmentCount: data.installmentCount,
      purchaseDate: data.purchaseDate,
      dueDate: data.dueDate,
      statementMonth: data.statementMonth,
      interestAmount: data.interestAmount,
      feesAmount: data.feesAmount,
      status: data.status,
      llm: data.llm,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
};

export function toFirestore(transaction: Transaction): Omit<Transaction, "id"> {
  const { id, ...data } = transaction;
  return data;
}

export function fromFirestore(id: string, data: any): Transaction {
  return {
    id,
    userId: data.userId,
    accountId: data.accountId,
    accountType: data.accountType,
    cardBrand: data.cardBrand,
    date: data.date,
    description: data.description,
    merchant: data.merchant,
    amount: data.amount,
    type: data.type,
    categoryId: data.categoryId,
    tags: data.tags,
    installmentGroupId: data.installmentGroupId,
    installmentNumber: data.installmentNumber,
    installmentCount: data.installmentCount,
    purchaseDate: data.purchaseDate,
    dueDate: data.dueDate,
    statementMonth: data.statementMonth,
    interestAmount: data.interestAmount,
    feesAmount: data.feesAmount,
    status: data.status,
    llm: data.llm,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
