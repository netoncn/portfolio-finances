// DTOs
export type {
  CreateGoalDTO,
  UpdateGoalDTO,
  UpdateGoalProgressDTO,
} from "./dto/goal.dto";

// Helpers (can be used in both client and server)
export { calculateProgress } from "./helpers/goal.helper";

// Schemas
export {
  createGoalSchema,
  goalCategoryEnum,
  goalPriorityEnum,
  goalSchema,
  goalStatusEnum,
  updateGoalProgressSchema,
  updateGoalSchema,
} from "./schemas/goal.schema";
// Server-side exports (import directly from file in API routes)
// export { fromFirestore, goalConverter, toFirestore } from "./converters/goal.converter";
// export { GoalService } from "./services/goal.service";
export type {
  Goal,
  GoalCategory,
  GoalPriority,
  GoalProgress,
  GoalStatus,
  GoalSummary,
} from "./types/goal";
