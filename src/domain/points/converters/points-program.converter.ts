import type { FirestoreDataConverter } from "firebase/firestore";
import type { PointsProgram } from "../types/points";

export const pointsProgramConverter: FirestoreDataConverter<PointsProgram> = {
  toFirestore: (program: PointsProgram) => {
    const { id, ...data } = program;
    return data;
  },

  fromFirestore: (snapshot, options): PointsProgram => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      userId: data.userId,
      program: data.program,
      memberId: data.memberId,
      linkedAccounts: data.linkedAccounts,
      notes: data.notes,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
};

export function toFirestore(program: PointsProgram): Omit<PointsProgram, "id"> {
  const { id, ...data } = program;
  return data;
}

export function fromFirestore(id: string, data: any): PointsProgram {
  return {
    id,
    userId: data.userId,
    program: data.program,
    memberId: data.memberId,
    linkedAccounts: data.linkedAccounts,
    notes: data.notes,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
