import type { BaseEntity, Currency } from "@/types/common";

export type AccountType =
  | "card_credit"
  | "card_debit"
  | "prepaid"
  | "wallet_cash"
  | "bank_checking"
  | "bank_savings";

export type CardBrand =
  | "visa"
  | "mastercard"
  | "amex"
  | "elo"
  | "hipercard"
  | "vr"
  | "sodexo"
  | "alelo"
  | "other";

export interface Account extends BaseEntity {
  name: string;
  accountType: AccountType;
  currency: Currency;
  icon?: string;
  issuer?: string;
  last4?: string;
  cardBrand?: CardBrand;
  benefits?: {
    airline?: string;
    lounge?: boolean;
    cashback?: number;
    fxFee?: number;
    notes?: string;
  };
  billing?: {
    closingDay: number;
    dueDay: number;
    creditLimit?: number;
    availableCredit?: number;
  };
  archived?: boolean;
  archivedAt?: number;
}
