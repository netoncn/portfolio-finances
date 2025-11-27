import type { FirestoreDataConverter } from "firebase/firestore";
import type { InvestmentAccount } from "../types";

export const investmentAccountConverter: FirestoreDataConverter<InvestmentAccount> =
  {
    toFirestore: (account: InvestmentAccount) => {
      const { id, ...data } = account;
      return data;
    },

    fromFirestore: (snapshot, options): InvestmentAccount => {
      const data = snapshot.data(options);
      return {
        id: snapshot.id,
        userId: data.userId,
        name: data.name,
        broker: data.broker,
        accountNumber: data.accountNumber,
        accountType: data.accountType,
        currency: data.currency,
        archived: data.archived,
        archivedAt: data.archivedAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    },
  };

export function toFirestore(
  account: InvestmentAccount,
): Omit<InvestmentAccount, "id"> {
  const { id, ...data } = account;
  return data;
}

export function fromFirestore(id: string, data: any): InvestmentAccount {
  return {
    id,
    userId: data.userId,
    name: data.name,
    broker: data.broker,
    accountNumber: data.accountNumber,
    accountType: data.accountType,
    currency: data.currency,
    archived: data.archived,
    archivedAt: data.archivedAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
