import type { Category } from "@/domain/categories/types/category";

export const mockCategory: Category = {
  id: "cat-001",
  userId: "user-001",
  name: "Alimentação",
  type: "expense",
  icon: "🍔",
  keywords: ["supermercado", "restaurante", "ifood", "lanche"],
  isSystem: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const mockCategories: Category[] = [
  mockCategory,
  {
    id: "cat-002",
    userId: "user-001",
    name: "Salário",
    type: "income",
    icon: "💰",
    keywords: ["salario", "pagamento", "remuneracao"],
    isSystem: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "cat-003",
    userId: "user-001",
    name: "Streaming",
    type: "expense",
    icon: "📺",
    keywords: ["netflix", "spotify", "disney", "hbo", "prime"],
    isSystem: false,
    budgetLimit: 10000, // R$ 100,00
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "cat-004",
    userId: "user-001",
    name: "Transporte",
    type: "expense",
    icon: "🚗",
    keywords: ["uber", "99", "gasolina", "combustivel", "estacionamento"],
    isSystem: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export function createMockCategory(
  overrides: Partial<Category> = {},
): Category {
  return {
    ...mockCategory,
    id: `cat-${Math.random().toString(36).substr(2, 9)}`,
    ...overrides,
  };
}
