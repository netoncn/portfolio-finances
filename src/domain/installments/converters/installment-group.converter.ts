import type { FirestoreDataConverter } from "firebase/firestore";
import type { InstallmentGroup } from "../types/installment-group";

export const installmentGroupConverter: FirestoreDataConverter<InstallmentGroup> =
  {
    toFirestore: (installmentGroup: InstallmentGroup) => {
      const { id, ...data } = installmentGroup;
      return data;
    },

    fromFirestore: (snapshot, options): InstallmentGroup => {
      const data = snapshot.data(options);
      return {
        id: snapshot.id,
        userId: data.userId,
        merchant: data.merchant,
        purchaseDate: data.purchaseDate,
        installmentCount: data.installmentCount,
        originalAmount: data.originalAmount,
        interestTotal: data.interestTotal,
        feesTotal: data.feesTotal,
        cardAccountId: data.cardAccountId,
        firstDueDate: data.firstDueDate,
        statementStartMonth: data.statementStartMonth,
        plan: data.plan,
        notes: data.notes,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    },
  };

export function toFirestore(
  installmentGroup: InstallmentGroup,
): Omit<InstallmentGroup, "id"> {
  const { id, ...data } = installmentGroup;
  return data;
}

export function fromFirestore(id: string, data: any): InstallmentGroup {
  return {
    id,
    userId: data.userId,
    merchant: data.merchant,
    purchaseDate: data.purchaseDate,
    installmentCount: data.installmentCount,
    originalAmount: data.originalAmount,
    interestTotal: data.interestTotal,
    feesTotal: data.feesTotal,
    cardAccountId: data.cardAccountId,
    firstDueDate: data.firstDueDate,
    statementStartMonth: data.statementStartMonth,
    plan: data.plan,
    notes: data.notes,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
