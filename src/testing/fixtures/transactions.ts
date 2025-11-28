import type { Transaction } from "@/domain/transactions/types/transaction";

export const mockTransaction: Transaction = {
  id: "tx-001",
  userId: "user-001",
  description: "Supermercado Extra",
  amount: 15000, // R$ 150,00 in cents
  type: "expense",
  date: Date.now(),
  accountId: "acc-001",
  accountType: "card_credit",
  categoryId: "cat-001",
  status: "posted",
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const mockTransactions: Transaction[] = [
  mockTransaction,
  {
    id: "tx-002",
    userId: "user-001",
    description: "Salário",
    amount: 500000, // R$ 5.000,00
    type: "income",
    date: Date.now(),
    accountId: "acc-002",
    accountType: "bank_checking",
    categoryId: "cat-002",
    status: "posted",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "tx-003",
    userId: "user-001",
    description: "Netflix",
    amount: 3990, // R$ 39,90
    type: "expense",
    date: Date.now(),
    accountId: "acc-001",
    accountType: "card_credit",
    categoryId: "cat-003",
    status: "posted",
    merchant: "Netflix",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export function createMockTransaction(
  overrides: Partial<Transaction> = {},
): Transaction {
  return {
    ...mockTransaction,
    id: `tx-${Math.random().toString(36).substr(2, 9)}`,
    ...overrides,
  };
}

export function createMockTransactions(
  count: number,
  overrides: Partial<Transaction> = {},
): Transaction[] {
  return Array.from({ length: count }, (_, i) =>
    createMockTransaction({
      id: `tx-${i + 1}`,
      description: `Transaction ${i + 1}`,
      amount: Math.floor(Math.random() * 100000),
      ...overrides,
    }),
  );
}
