import type { Currency } from "@/types/common";
import type { AccountType, CardBrand } from "../types/account";

export interface AccountBenefitsDTO {
  airline?: string;
  lounge?: boolean;
  /** Cashback percentage (0-1) */
  cashback?: number;
  /** Foreign exchange fee percentage (0-1) */
  fxFee?: number;
  notes?: string;
}

export interface AccountBillingDTO {
  /** Closing day (1-28) */
  closingDay: number;
  /** Due day (1-28), must be different from closingDay */
  dueDay: number;
  creditLimit?: number;
  /** Must be <= creditLimit */
  availableCredit?: number;
}

interface BaseAccountDTO {
  userId: string;
  name: string;
  currency: Currency;
  icon?: string;
  issuer?: string;
}

export interface CreateCreditCardAccountDTO extends BaseAccountDTO {
  accountType: "card_credit";
  cardBrand: CardBrand;
  last4?: string;
  benefits?: AccountBenefitsDTO;
  billing: AccountBillingDTO;
}

export interface CreateDebitOrPrepaidAccountDTO extends BaseAccountDTO {
  accountType: "card_debit" | "prepaid";
  cardBrand: CardBrand;
  last4?: string;
  benefits?: Pick<AccountBenefitsDTO, "cashback" | "fxFee" | "notes">;
  billing?: never;
}

export interface CreateBankAccountDTO extends BaseAccountDTO {
  accountType: "wallet_cash" | "bank_checking" | "bank_savings";
  cardBrand?: never;
  last4?: never;
  benefits?: never;
  billing?: never;
}

export type CreateAccountDTO =
  | CreateCreditCardAccountDTO
  | CreateDebitOrPrepaidAccountDTO
  | CreateBankAccountDTO;

export interface UpdateAccountDTO {
  id: string;
  userId: string;
  name?: string;
  accountType?: AccountType;
  currency?: Currency;
  icon?: string;
  issuer?: string;
  last4?: string;
  cardBrand?: CardBrand;
  benefits?: AccountBenefitsDTO;
  billing?: AccountBillingDTO;
}
