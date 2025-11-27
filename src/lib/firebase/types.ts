import { Timestamp as FirestoreTimestamp } from "firebase/firestore";

/**
 * Timestamp universal que funciona em client e admin
 * Note: For server-side code, this will be the same as firebase-admin's Timestamp
 */
export type Timestamp = FirestoreTimestamp | any;

/**
 * Tipo base para documentos do Firestore
 */
export interface FirestoreDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Helpers para conversão de timestamps
 */
export const timestampHelpers = {
  toDate(timestamp: Timestamp): Date {
    return timestamp.toDate();
  },

  fromDate(date: Date): FirestoreTimestamp {
    return FirestoreTimestamp.fromDate(date);
  },

  now(): FirestoreTimestamp {
    return FirestoreTimestamp.now();
  },
};
