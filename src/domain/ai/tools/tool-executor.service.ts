import "server-only";

import { PointsContextService } from "@/domain/points/ai";
import type { PointsToolName } from "@/domain/points/ai/points-tools.types";
import { isValidPointsToolName } from "@/domain/points/ai/points-tools.types";
import type {
  AllToolName,
  ToolExecutionContext,
  ToolResult,
} from "./base.types";
import {
  isAccountToolName,
  isBudgetToolName,
  isCategoryToolName,
  isGoalToolName,
  isInvestmentToolName,
  isTransactionToolName,
} from "./index";

export interface ToolExecutionResult {
  toolName: string;
  success: boolean;
  data?: unknown;
  error?: string;
  executionTime: number;
}

export class ToolExecutorService {
  static async executeTool(
    context: ToolExecutionContext,
    toolName: string,
    input: Record<string, unknown>,
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      let result: ToolResult<unknown>;

      if (isValidPointsToolName(toolName)) {
        result = await PointsContextService.executeTool(
          context.userId,
          toolName as PointsToolName,
          input,
        );
      } else if (isTransactionToolName(toolName)) {
        result = await ToolExecutorService.executeTransactionTool(
          context,
          toolName,
          input,
        );
      } else if (isBudgetToolName(toolName)) {
        result = await ToolExecutorService.executeBudgetTool(
          context,
          toolName,
          input,
        );
      } else if (isCategoryToolName(toolName)) {
        result = await ToolExecutorService.executeCategoryTool(
          context,
          toolName,
          input,
        );
      } else if (isAccountToolName(toolName)) {
        result = await ToolExecutorService.executeAccountTool(
          context,
          toolName,
          input,
        );
      } else if (isInvestmentToolName(toolName)) {
        result = await ToolExecutorService.executeInvestmentTool(
          context,
          toolName,
          input,
        );
      } else if (isGoalToolName(toolName)) {
        result = await ToolExecutorService.executeGoalTool(
          context,
          toolName,
          input,
        );
      } else {
        result = { success: false, error: `Unknown tool: ${toolName}` };
      }

      return {
        toolName,
        success: result.success,
        data: result.success ? result.data : undefined,
        error: result.success ? undefined : result.error,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        toolName,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        executionTime: Date.now() - startTime,
      };
    }
  }

  static async executeTools(
    context: ToolExecutionContext,
    toolCalls: Array<{ name: string; input: Record<string, unknown> }>,
  ): Promise<ToolExecutionResult[]> {
    return Promise.all(
      toolCalls.map((call) =>
        ToolExecutorService.executeTool(context, call.name, call.input),
      ),
    );
  }

  private static async executeTransactionTool(
    _context: ToolExecutionContext,
    toolName: AllToolName,
    _input: Record<string, unknown>,
  ): Promise<ToolResult<unknown>> {
    // TODO: Implement with TransactionService
    // This is a placeholder for the actual implementation
    return {
      success: false,
      error: `Transaction tool ${toolName} not yet implemented`,
    };
  }

  private static async executeBudgetTool(
    _context: ToolExecutionContext,
    toolName: AllToolName,
    _input: Record<string, unknown>,
  ): Promise<ToolResult<unknown>> {
    // TODO: Implement with BudgetService
    return {
      success: false,
      error: `Budget tool ${toolName} not yet implemented`,
    };
  }

  private static async executeCategoryTool(
    _context: ToolExecutionContext,
    toolName: AllToolName,
    _input: Record<string, unknown>,
  ): Promise<ToolResult<unknown>> {
    // TODO: Implement with CategoryService
    return {
      success: false,
      error: `Category tool ${toolName} not yet implemented`,
    };
  }

  private static async executeAccountTool(
    _context: ToolExecutionContext,
    toolName: AllToolName,
    _input: Record<string, unknown>,
  ): Promise<ToolResult<unknown>> {
    // TODO: Implement with AccountService
    return {
      success: false,
      error: `Account tool ${toolName} not yet implemented`,
    };
  }

  private static async executeInvestmentTool(
    _context: ToolExecutionContext,
    toolName: AllToolName,
    _input: Record<string, unknown>,
  ): Promise<ToolResult<unknown>> {
    // TODO: Implement with Investment services
    return {
      success: false,
      error: `Investment tool ${toolName} not yet implemented`,
    };
  }

  private static async executeGoalTool(
    _context: ToolExecutionContext,
    toolName: AllToolName,
    _input: Record<string, unknown>,
  ): Promise<ToolResult<unknown>> {
    // TODO: Implement with GoalService
    return {
      success: false,
      error: `Goal tool ${toolName} not yet implemented`,
    };
  }
}
