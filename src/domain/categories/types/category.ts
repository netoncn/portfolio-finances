import type { BaseEntity } from "@/types/common";

export type CategoryType = "expense" | "income" | "transfer";

export interface Category extends BaseEntity {
  userId: string;
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  parentId?: string;
  keywords?: string[];
  budgetLimit?: number;
  isSystem?: boolean;
  order?: number;
}

export const DEFAULT_CATEGORIES: Omit<
  Category,
  "id" | "userId" | "createdAt" | "updatedAt"
>[] = [
  {
    name: "Food & Dining",
    type: "expense",
    icon: "🍽️",
    keywords: ["restaurant", "food", "dining", "grocery", "supermarket"],
  },
  {
    name: "Transportation",
    type: "expense",
    icon: "🚗",
    keywords: ["uber", "taxi", "gas", "fuel", "transport"],
  },
  {
    name: "Shopping",
    type: "expense",
    icon: "🛍️",
    keywords: ["store", "shop", "purchase", "buy"],
  },
  {
    name: "Bills & Utilities",
    type: "expense",
    icon: "💡",
    keywords: ["bill", "utility", "electric", "water", "internet"],
  },
  {
    name: "Entertainment",
    type: "expense",
    icon: "🎬",
    keywords: ["movie", "game", "netflix", "spotify", "entertainment"],
  },
  {
    name: "Healthcare",
    type: "expense",
    icon: "🏥",
    keywords: ["doctor", "hospital", "pharmacy", "medicine", "health"],
  },
  {
    name: "Education",
    type: "expense",
    icon: "📚",
    keywords: ["school", "course", "book", "education", "tuition"],
  },
  {
    name: "Travel",
    type: "expense",
    icon: "✈️",
    keywords: ["hotel", "flight", "travel", "vacation", "trip"],
  },
  {
    name: "Salary",
    type: "income",
    icon: "💰",
    keywords: ["salary", "wage", "payment", "payroll"],
  },
  {
    name: "Freelance",
    type: "income",
    icon: "💼",
    keywords: ["freelance", "contract", "consulting"],
  },
  {
    name: "Investment",
    type: "income",
    icon: "📈",
    keywords: ["dividend", "interest", "investment", "returns"],
  },
  {
    name: "Transfer",
    type: "transfer",
    icon: "🔄",
    keywords: ["transfer", "pix", "ted"],
  },
];
