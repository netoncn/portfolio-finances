import type { FirestoreDataConverter } from "firebase/firestore";
import type { PointsOffer } from "../types/points";

export const pointsOfferConverter: FirestoreDataConverter<PointsOffer> = {
  toFirestore: (offer: PointsOffer) => {
    const { id, ...data } = offer;
    return data;
  },

  fromFirestore: (snapshot, options): PointsOffer => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      program: data.program,
      title: data.title,
      description: data.description,
      bonus: data.bonus,
      validUntil: data.validUntil,
      termsUrl: data.termsUrl,
    };
  },
};

export function toFirestore(offer: PointsOffer): Omit<PointsOffer, "id"> {
  const { id, ...data } = offer;
  return data;
}

export function fromFirestore(id: string, data: any): PointsOffer {
  return {
    id,
    program: data.program,
    title: data.title,
    description: data.description,
    bonus: data.bonus,
    validUntil: data.validUntil,
    termsUrl: data.termsUrl,
  };
}
