import type { Account } from "@/domain/accounts/types/account";

export const mockAccount: Account = {
  id: "acc-001",
  userId: "user-001",
  name: "Nubank Crédito",
  accountType: "card_credit",
  currency: "BRL",
  issuer: "nubank",
  cardBrand: "mastercard",
  last4: "1234",
  archived: false,
  billing: {
    creditLimit: 1000000, // R$ 10.000,00
    availableCredit: 850000, // R$ 8.500,00
    closingDay: 5,
    dueDay: 12,
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const mockAccounts: Account[] = [
  mockAccount,
  {
    id: "acc-002",
    userId: "user-001",
    name: "Banco do Brasil",
    accountType: "bank_checking",
    currency: "BRL",
    issuer: "bb",
    archived: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "acc-003",
    userId: "user-001",
    name: "Carteira",
    accountType: "wallet_cash",
    currency: "BRL",
    archived: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export function createMockAccount(overrides: Partial<Account> = {}): Account {
  return {
    ...mockAccount,
    id: `acc-${Math.random().toString(36).substr(2, 9)}`,
    ...overrides,
  };
}
