import type { FirestoreDataConverter } from "firebase/firestore";
import type { Account } from "../types/account";

export const accountConverter: FirestoreDataConverter<Account> = {
  toFirestore: (account: Account) => {
    const { id, ...data } = account;
    return data;
  },

  fromFirestore: (snapshot, options): Account => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      userId: data.userId,
      name: data.name,
      accountType: data.accountType,
      currency: data.currency,
      icon: data.icon,
      issuer: data.issuer,
      last4: data.last4,
      cardBrand: data.cardBrand,
      benefits: data.benefits,
      billing: data.billing,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
};

export function toFirestore(account: Account): Omit<Account, "id"> {
  const { id, ...data } = account;
  return data;
}

export function fromFirestore(id: string, data: any): Account {
  return {
    id,
    userId: data.userId,
    name: data.name,
    accountType: data.accountType,
    currency: data.currency,
    icon: data.icon,
    issuer: data.issuer,
    last4: data.last4,
    cardBrand: data.cardBrand,
    benefits: data.benefits,
    billing: data.billing,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
