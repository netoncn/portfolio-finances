import type { CategoryType } from "../types/category";

export interface CreateCategoryDTO {
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

export interface UpdateCategoryDTO {
  id: string;
  userId: string;
  name?: string;
  icon?: string;
  color?: string;
  keywords?: string[];
  budgetLimit?: number;
  order?: number;
}
