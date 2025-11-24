import type {
  Account,
  AccountType,
  CardBrand,
} from "@/domain/accounts/types/account";

export interface DenormalizedAccountFields {
  accountType: AccountType;
  cardBrand?: CardBrand;
}

export function extractDenormalizedFields(
  account: Account,
): DenormalizedAccountFields {
  return {
    accountType: account.accountType,
    cardBrand: account.cardBrand,
  };
}

export function validateDenormalizedFields(
  transaction: DenormalizedAccountFields,
  account: Account,
): boolean {
  return (
    transaction.accountType === account.accountType &&
    transaction.cardBrand === account.cardBrand
  );
}

export function needsDenormalizationRefresh(
  transaction: DenormalizedAccountFields,
  account: Account,
): boolean {
  return !validateDenormalizedFields(transaction, account);
}
