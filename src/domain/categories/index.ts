// DTOs
export type {
  CreateCategoryDTO,
  UpdateCategoryDTO,
} from "./dto/category.dto";
// Schemas
export {
  categorySchema,
  categoryTypeEnum,
  createCategorySchema,
  updateCategorySchema,
} from "./schemas/category.schema";
// Server-side exports (import directly from file in API routes)
// export { categoryConverter, fromFirestore, toFirestore } from "./converters/category.converter";
// export { CategoryService } from "./services/category.service";
export type { Category, CategoryType } from "./types/category";
export { DEFAULT_CATEGORIES } from "./types/category";
