import { z } from "zod";

export const goalStatusEnum = z.enum([
  "active",
  "completed",
  "canceled",
  "paused",
]);

export const goalPriorityEnum = z.enum(["low", "medium", "high"]);

export const goalCategoryEnum = z.enum([
  "emergency_fund",
  "vacation",
  "house",
  "car",
  "education",
  "retirement",
  "investment",
  "debt_payoff",
  "wedding",
  "business",
  "other",
]);

export const goalSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  targetAmount: z
    .number()
    .int()
    .positive("Target amount must be positive")
    .min(1, "Target amount is required"),
  currentAmount: z.number().int().min(0, "Current amount cannot be negative"),
  category: goalCategoryEnum,
  priority: goalPriorityEnum,
  status: goalStatusEnum,
  targetDate: z.number().optional(),
  startDate: z.number(),
  completedDate: z.number().optional(),
  icon: z.string().max(10).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  notes: z.string().max(1000, "Notes are too long").optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const createGoalSchema = z.object({
  userId: z.string(),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  targetAmount: z
    .number()
    .int()
    .positive("Target amount must be positive")
    .min(1, "Target amount is required"),
  currentAmount: z
    .number()
    .int()
    .min(0, "Current amount cannot be negative")
    .default(0),
  category: goalCategoryEnum,
  priority: goalPriorityEnum.default("medium"),
  targetDate: z.number().optional(),
  icon: z.string().max(10).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  notes: z.string().max(1000, "Notes are too long").optional(),
});

export const updateGoalSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name is too long")
    .optional(),
  description: z.string().max(500, "Description is too long").optional(),
  targetAmount: z
    .number()
    .int()
    .positive("Target amount must be positive")
    .optional(),
  currentAmount: z
    .number()
    .int()
    .min(0, "Current amount cannot be negative")
    .optional(),
  category: goalCategoryEnum.optional(),
  priority: goalPriorityEnum.optional(),
  status: goalStatusEnum.optional(),
  targetDate: z.number().optional(),
  icon: z.string().max(10).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  notes: z.string().max(1000, "Notes are too long").optional(),
});

export const updateGoalProgressSchema = z.object({
  id: z.string(),
  userId: z.string(),
  currentAmount: z.number().int().min(0, "Current amount cannot be negative"),
  notes: z.string().max(1000, "Notes are too long").optional(),
});
