import "server-only";

import { AuditService } from "@/domain/audit/services/audit.service";
import { PointsContextService } from "@/domain/points/ai";
import type { PointsToolName } from "@/domain/points/ai/points-tools.types";
import { isValidPointsToolName } from "@/domain/points/ai/points-tools.types";
import { logger } from "@/lib/logger";
import type {
  AllToolName,
  ToolExecutionContext,
  ToolResult,
} from "./base.types";
import { executeAccountTool } from "./executors/account.executor";
import { executeBudgetTool } from "./executors/budget.executor";
import { executeCategoryTool } from "./executors/category.executor";
import { executeInsightTool } from "./executors/spending-cut.executor";
import { executeTransactionTool } from "./executors/transaction.executor";
import {
  isAccountToolName,
  isBudgetToolName,
  isCategoryToolName,
  isInsightToolName,
  isTransactionToolName,
  isValidToolName,
} from "./index";
import { checkRateLimit, recordCallEnd, recordCallStart } from "./rate-limiter";
import { sanitizeToolInput, validateToolInput } from "./validation";

const TOOL_TIMEOUT_MS = 30_000; // 30 seconds default timeout
const EXPENSIVE_TOOL_TIMEOUT_MS = 60_000; // 60 seconds for expensive operations

// Tools that require longer timeouts
const EXPENSIVE_TOOLS = new Set([
  "search_transactions",
  "get_investment_performance",
  "get_spending_trend",
]);

export interface ToolRouterResult {
  toolName: string;
  success: boolean;
  data?: unknown;
  error?: ToolError;
  metadata: {
    executionTimeMs: number;
    validationPassed: boolean;
    rateLimitRemaining?: number;
  };
}

export interface ToolError {
  code: ToolErrorCode;
  message: string;
  details?: unknown;
}

export type ToolErrorCode =
  | "UNKNOWN_TOOL"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "EXECUTION_ERROR"
  | "TIMEOUT"
  | "UNAUTHORIZED"
  | "INTERNAL_ERROR";

export interface ToolCallRequest {
  name: string;
  input: Record<string, unknown>;
}

export class ToolRouterService {
  static async executeTool(
    context: ToolExecutionContext,
    toolName: string,
    input: Record<string, unknown>,
  ): Promise<ToolRouterResult> {
    const startTime = Date.now();
    let validationPassed = false;

    try {
      // 1. Validate tool name
      if (!isValidToolName(toolName) && !isValidPointsToolName(toolName)) {
        return ToolRouterService.createErrorResult(toolName, startTime, false, {
          code: "UNKNOWN_TOOL",
          message: `Unknown tool: ${toolName}`,
        });
      }

      // 2. Check rate limits
      const rateLimitResult = checkRateLimit(context.userId, toolName);
      if (!rateLimitResult.allowed) {
        await ToolRouterService.logToolExecution(
          context,
          toolName,
          input,
          false,
          "RATE_LIMITED",
        );
        return ToolRouterService.createErrorResult(
          toolName,
          startTime,
          false,
          {
            code: "RATE_LIMITED",
            message: rateLimitResult.reason || "Rate limit exceeded",
            details: { retryAfterMs: rateLimitResult.retryAfterMs },
          },
          rateLimitResult.remaining,
        );
      }

      // 3. Validate input
      const validationResult = validateToolInput(toolName, input);
      if (!validationResult.valid) {
        await ToolRouterService.logToolExecution(
          context,
          toolName,
          input,
          false,
          "VALIDATION_ERROR",
        );
        return ToolRouterService.createErrorResult(
          toolName,
          startTime,
          false,
          {
            code: "VALIDATION_ERROR",
            message: "Input validation failed",
            details: validationResult.errors,
          },
          rateLimitResult.remaining,
        );
      }
      validationPassed = true;

      // 4. Sanitize input
      const sanitizedInput = sanitizeToolInput(toolName, input);

      // 5. Execute tool with timeout
      recordCallStart(context.userId, toolName);

      try {
        const timeout = EXPENSIVE_TOOLS.has(toolName)
          ? EXPENSIVE_TOOL_TIMEOUT_MS
          : TOOL_TIMEOUT_MS;

        const result = await ToolRouterService.executeWithTimeout(
          () =>
            ToolRouterService.routeToolExecution(
              context,
              toolName,
              sanitizedInput,
            ),
          timeout,
        );

        // 6. Log successful execution
        await ToolRouterService.logToolExecution(
          context,
          toolName,
          sanitizedInput,
          result.success,
          result.success ? "SUCCESS" : "EXECUTION_ERROR",
        );

        return {
          toolName,
          success: result.success,
          data: result.success ? result.data : undefined,
          error: result.success
            ? undefined
            : {
                code: "EXECUTION_ERROR",
                message: result.error || "Tool execution failed",
              },
          metadata: {
            executionTimeMs: Date.now() - startTime,
            validationPassed,
            rateLimitRemaining: rateLimitResult.remaining,
          },
        };
      } finally {
        recordCallEnd(context.userId, toolName);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      await ToolRouterService.logToolExecution(
        context,
        toolName,
        input,
        false,
        "INTERNAL_ERROR",
      );

      logger.error("Tool router error", error as Error, {
        toolName,
        userId: context.userId,
      });

      return ToolRouterService.createErrorResult(
        toolName,
        startTime,
        validationPassed,
        {
          code: "INTERNAL_ERROR",
          message: errorMessage,
        },
      );
    }
  }

  static async executeTools(
    context: ToolExecutionContext,
    toolCalls: ToolCallRequest[],
    options: { parallel?: boolean } = { parallel: true },
  ): Promise<ToolRouterResult[]> {
    if (options.parallel) {
      return Promise.all(
        toolCalls.map((call) =>
          ToolRouterService.executeTool(context, call.name, call.input),
        ),
      );
    }

    const results: ToolRouterResult[] = [];
    for (const call of toolCalls) {
      const result = await ToolRouterService.executeTool(
        context,
        call.name,
        call.input,
      );
      results.push(result);

      if (!result.success) {
        break;
      }
    }
    return results;
  }

  private static async routeToolExecution(
    context: ToolExecutionContext,
    toolName: string,
    input: Record<string, unknown>,
  ): Promise<ToolResult<unknown>> {
    if (isValidPointsToolName(toolName)) {
      return PointsContextService.executeTool(
        context.userId,
        toolName as PointsToolName,
        input,
      );
    }

    if (isTransactionToolName(toolName)) {
      return executeTransactionTool(context, toolName as AllToolName, input);
    }

    if (isBudgetToolName(toolName)) {
      return executeBudgetTool(context, toolName as AllToolName, input);
    }

    if (isCategoryToolName(toolName)) {
      return executeCategoryTool(context, toolName as AllToolName, input);
    }

    if (isAccountToolName(toolName)) {
      return executeAccountTool(context, toolName as AllToolName, input);
    }

    if (isInsightToolName(toolName)) {
      return executeInsightTool(context, toolName as AllToolName, input);
    }

    return {
      success: false,
      error: `Tool ${toolName} executor not yet implemented`,
    };
  }

  private static async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(new Error(`Tool execution timed out after ${timeoutMs}ms`)),
          timeoutMs,
        ),
      ),
    ]);
  }

  private static createErrorResult(
    toolName: string,
    startTime: number,
    validationPassed: boolean,
    error: ToolError,
    rateLimitRemaining?: number,
  ): ToolRouterResult {
    return {
      toolName,
      success: false,
      error,
      metadata: {
        executionTimeMs: Date.now() - startTime,
        validationPassed,
        rateLimitRemaining,
      },
    };
  }

  private static async logToolExecution(
    context: ToolExecutionContext,
    toolName: string,
    input: Record<string, unknown>,
    success: boolean,
    status: string,
  ): Promise<void> {
    const sanitizedInput = { ...input };
    for (const key of ["password", "secret", "token", "key"]) {
      if (key in sanitizedInput) {
        sanitizedInput[key] = "[REDACTED]";
      }
    }

    await AuditService.recordEvent({
      eventType: `ai_tool.${success ? "executed" : "failed"}`,
      userId: context.userId,
      resourceType: "ai_tool",
      resourceId: toolName,
      metadata: {
        source: "ai",
        toolName,
        status,
        input: sanitizedInput,
        month: context.month,
        locale: context.locale,
      },
    }).catch((error) => {
      logger.error("Failed to log tool execution", error as Error);
    });
  }
}
