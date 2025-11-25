import type { BaseEntity } from "@/types/common";
import type { CategoryType } from "./category";

export type RuleConditionType =
  | "description_contains"
  | "description_matches"
  | "amount_greater_than"
  | "amount_less_than"
  | "amount_equals"
  | "amount_between"
  | "merchant_equals"
  | "merchant_contains";

export interface RuleCondition {
  type: RuleConditionType;
  value: string | number | [number, number];
  caseSensitive?: boolean;
}

export type RuleActionType = "assign_category" | "add_tags" | "set_merchant";

export interface RuleAction {
  type: RuleActionType;
  value: string | string[];
}

export type RulePriority = "low" | "medium" | "high";

export interface MappingRule extends BaseEntity {
  userId: string;
  name: string;
  description?: string;
  categoryType?: CategoryType;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: RulePriority;
  enabled: boolean;
  usageCount?: number;
  lastUsedAt?: Date;
}

export interface RuleMatchResult {
  rule: MappingRule;
  actions: RuleAction[];
  confidence: number;
}
