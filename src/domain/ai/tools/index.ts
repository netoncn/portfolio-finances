export * from "./account.tools";
export * from "./base.types";
export * from "./budget.tools";
export * from "./category.tools";
export * from "./goal.tools";
export * from "./investment.tools";
export * from "./rate-limiter";
export * from "./spending-cut.tools";
export * from "./transaction.tools";
export * from "./validation";

import { ACCOUNT_TOOLS_SCHEMAS, isAccountToolName } from "./account.tools";
import type { AllToolName, ToolCategory, ToolDefinition } from "./base.types";
import { BUDGET_TOOLS_SCHEMAS, isBudgetToolName } from "./budget.tools";
import { CATEGORY_TOOLS_SCHEMAS, isCategoryToolName } from "./category.tools";
import { GOAL_TOOLS_SCHEMAS, isGoalToolName } from "./goal.tools";
import {
  INVESTMENT_TOOLS_SCHEMAS,
  isInvestmentToolName,
} from "./investment.tools";
import {
  isInsightToolName,
  SPENDING_CUT_TOOLS_SCHEMAS,
} from "./spending-cut.tools";
import {
  isTransactionToolName,
  TRANSACTION_TOOLS_SCHEMAS,
} from "./transaction.tools";

export const ALL_TOOLS_SCHEMAS: ToolDefinition[] = [
  ...TRANSACTION_TOOLS_SCHEMAS,
  ...BUDGET_TOOLS_SCHEMAS,
  ...CATEGORY_TOOLS_SCHEMAS,
  ...ACCOUNT_TOOLS_SCHEMAS,
  ...INVESTMENT_TOOLS_SCHEMAS,
  ...GOAL_TOOLS_SCHEMAS,
  ...SPENDING_CUT_TOOLS_SCHEMAS,
];

export const TOOLS_BY_CATEGORY: Record<ToolCategory, ToolDefinition[]> = {
  transactions: TRANSACTION_TOOLS_SCHEMAS,
  budgets: BUDGET_TOOLS_SCHEMAS,
  categories: CATEGORY_TOOLS_SCHEMAS,
  accounts: ACCOUNT_TOOLS_SCHEMAS,
  investments: INVESTMENT_TOOLS_SCHEMAS,
  goals: GOAL_TOOLS_SCHEMAS,
  points: [], // Points tools are in domain/points/ai
  insights: SPENDING_CUT_TOOLS_SCHEMAS,
};

export function getToolsForCategories(
  categories: ToolCategory[],
): ToolDefinition[] {
  return categories.flatMap((category) => TOOLS_BY_CATEGORY[category] || []);
}

export function getToolCategory(toolName: AllToolName): ToolCategory | null {
  if (isTransactionToolName(toolName)) return "transactions";
  if (isBudgetToolName(toolName)) return "budgets";
  if (isCategoryToolName(toolName)) return "categories";
  if (isAccountToolName(toolName)) return "accounts";
  if (isInvestmentToolName(toolName)) return "investments";
  if (isGoalToolName(toolName)) return "goals";
  if (isInsightToolName(toolName)) return "insights";
  return null;
}

export function isValidToolName(name: string): name is AllToolName {
  return (
    isTransactionToolName(name) ||
    isBudgetToolName(name) ||
    isCategoryToolName(name) ||
    isAccountToolName(name) ||
    isInvestmentToolName(name) ||
    isGoalToolName(name) ||
    isInsightToolName(name)
  );
}

export function getToolByName(name: AllToolName): ToolDefinition | undefined {
  return ALL_TOOLS_SCHEMAS.find((tool) => tool.name === name);
}

export function toOpenAIFunctions(tools: ToolDefinition[]): Array<{
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: ToolDefinition["parameters"];
  };
}> {
  return tools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

export function toAnthropicTools(tools: ToolDefinition[]): Array<{
  name: string;
  description: string;
  input_schema: ToolDefinition["parameters"];
}> {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters,
  }));
}

export const TOOLS_SUMMARY = {
  total: ALL_TOOLS_SCHEMAS.length,
  byCategory: {
    transactions: TRANSACTION_TOOLS_SCHEMAS.length,
    budgets: BUDGET_TOOLS_SCHEMAS.length,
    categories: CATEGORY_TOOLS_SCHEMAS.length,
    accounts: ACCOUNT_TOOLS_SCHEMAS.length,
    investments: INVESTMENT_TOOLS_SCHEMAS.length,
    goals: GOAL_TOOLS_SCHEMAS.length,
    insights: SPENDING_CUT_TOOLS_SCHEMAS.length,
  },
} as const;
