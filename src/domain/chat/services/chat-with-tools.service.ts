import "server-only";

import { FinancialAggregatorService } from "@/domain/ai/rag/financial-aggregator.service";
import type { RAGFinancialContext } from "@/domain/ai/rag/rag.types";
import { RAGContextSerializerService } from "@/domain/ai/rag/rag-context-serializer.service";
import { ALL_TOOLS_SCHEMAS } from "@/domain/ai/tools";
import { ToolRouterService } from "@/domain/ai/tools/tool-router.service";
import { AIServiceWrapper } from "@/domain/ai-usage";
import {
  createRequestTelemetry,
  createToolCallTelemetry,
} from "@/domain/ai-usage/services/telemetry-builder";
import type { ToolCallTelemetry } from "@/domain/ai-usage/types/telemetry";
import { POINTS_TOOLS_SCHEMAS } from "@/domain/points/ai/points-tools.types";
import type { LLMMessage, LLMToolCall, LLMToolDefinition } from "@/lib/llm";
import { LLMProviderFactory } from "@/lib/llm";
import { PrivacyService } from "@/lib/privacy";
import { getUserLocale } from "@/services/locale";
import type { ChatMessage } from "../types/chat";

export interface ToolCallInfo {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: "pending" | "running" | "success" | "error";
  result?: unknown;
  error?: string;
  executionTimeMs?: number;
}

export interface ChatWithToolsResult {
  text: string;
  toolCalls: ToolCallInfo[];
  totalTokens?: number;
}

export interface StreamChunk {
  type: "text" | "tool_start" | "tool_result" | "done";
  text?: string;
  toolCall?: ToolCallInfo;
  result?: ChatWithToolsResult;
}

const MAX_TOOL_ITERATIONS = 5; // Max rounds of tool calls
const _TOOL_EXECUTION_TIMEOUT_MS = 30000;

export class ChatWithToolsService {
  static async processMessage(
    userId: string,
    userMessage: string,
    history: ChatMessage[] = [],
    sessionId?: string,
  ): Promise<ChatWithToolsResult> {
    const locale = await getUserLocale();
    const allToolCalls: ToolCallInfo[] = [];
    const telemetryToolCalls: ToolCallTelemetry[] = [];

    const telemetry = createRequestTelemetry(userId, "chat_with_tools");
    if (sessionId) {
      telemetry.withSessionId(sessionId);
    }

    try {
      const ragContext =
        await FinancialAggregatorService.buildRAGContext(userId);

      const systemPrompt = ChatWithToolsService.buildSystemPrompt(
        ragContext,
        locale,
      );

      const tools = ChatWithToolsService.getAllTools();

      const messages: LLMMessage[] = [
        { role: "system", content: systemPrompt },
      ];

      for (const msg of history.slice(-5)) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }

      const sanitized = PrivacyService.sanitizeChatMessage({
        content: userMessage,
        role: "user",
      });
      messages.push({ role: "user", content: sanitized.content });

      telemetry.withMessageCount(messages.length);

      let iterations = 0;
      let finalText = "";
      let totalPromptTokens = 0;
      let totalCompletionTokens = 0;

      while (iterations < MAX_TOOL_ITERATIONS) {
        iterations++;

        telemetry.startLLMGeneration();
        const result = await ChatWithToolsService.generateWithTools(
          userId,
          messages,
          tools,
          ragContext.currentPeriod.month,
        );
        telemetry.endLLMGeneration();

        if (result.usage) {
          totalPromptTokens += result.usage.promptTokens;
          totalCompletionTokens += result.usage.completionTokens;
        }

        if (iterations === 1) {
          telemetry.withModel(result.provider, result.model);
        }

        if (result.toolCalls && result.toolCalls.length > 0) {
          messages.push({
            role: "assistant",
            content: result.text || "",
            toolCalls: result.toolCalls,
          });

          for (const toolCall of result.toolCalls) {
            const toolInfo: ToolCallInfo = {
              id: toolCall.id,
              name: toolCall.name,
              arguments: toolCall.arguments,
              status: "running",
            };
            allToolCalls.push(toolInfo);

            const tcTelemetry = createToolCallTelemetry(
              toolCall.id,
              toolCall.name,
            ).withArguments(toolCall.arguments);

            try {
              const toolResult = await ToolRouterService.executeTool(
                { userId, locale, month: ragContext.currentPeriod.month },
                toolCall.name,
                toolCall.arguments,
              );

              toolInfo.executionTimeMs = toolResult.metadata.executionTimeMs;

              if (toolResult.success) {
                toolInfo.status = "success";
                toolInfo.result = toolResult.data;
                telemetryToolCalls.push(tcTelemetry.success(toolResult.data));
              } else {
                toolInfo.status = "error";
                toolInfo.error =
                  toolResult.error?.message || "Tool execution failed";
                telemetryToolCalls.push(
                  tcTelemetry.failure(toolInfo.error, toolResult.error?.code),
                );
              }

              messages.push({
                role: "tool",
                content: JSON.stringify(
                  toolResult.success
                    ? toolResult.data
                    : { error: toolInfo.error },
                ),
                toolCallId: toolCall.id,
                toolName: toolCall.name,
              });
            } catch (error) {
              toolInfo.status = "error";
              toolInfo.error =
                error instanceof Error ? error.message : "Unknown error";
              telemetryToolCalls.push(tcTelemetry.failure(toolInfo.error));

              messages.push({
                role: "tool",
                content: JSON.stringify({ error: toolInfo.error }),
                toolCallId: toolCall.id,
                toolName: toolCall.name,
              });
            }
          }
          continue;
        }

        finalText = result.text;
        break;
      }

      telemetry
        .withTokens(totalPromptTokens, totalCompletionTokens)
        .addToolCalls(telemetryToolCalls)
        .withMetadata("iterations", iterations);

      await telemetry.success();

      return {
        text: finalText,
        toolCalls: allToolCalls,
        totalTokens: totalPromptTokens + totalCompletionTokens,
      };
    } catch (error) {
      telemetry.addToolCalls(telemetryToolCalls);
      await telemetry.failure(
        error instanceof Error ? error.message : "Unknown error",
      );
      throw error;
    }
  }

  static async *processMessageStream(
    userId: string,
    userMessage: string,
    history: ChatMessage[] = [],
  ): AsyncGenerator<StreamChunk> {
    const locale = await getUserLocale();
    const allToolCalls: ToolCallInfo[] = [];

    const ragContext = await FinancialAggregatorService.buildRAGContext(userId);

    const systemPrompt = ChatWithToolsService.buildSystemPrompt(
      ragContext,
      locale,
    );

    const tools = ChatWithToolsService.getAllTools();

    const messages: LLMMessage[] = [{ role: "system", content: systemPrompt }];

    for (const msg of history.slice(-5)) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    const sanitized = PrivacyService.sanitizeChatMessage({
      content: userMessage,
      role: "user",
    });
    messages.push({ role: "user", content: sanitized.content });

    let iterations = 0;
    let finalText = "";

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;

      const provider = LLMProviderFactory.getProvider();

      if (provider.streamText) {
        const streamResult = await provider.streamText(messages, {
          tools,
          temperature: 0.7,
          maxTokens: 2000,
        });

        let accumulatedText = "";
        const pendingToolCalls: LLMToolCall[] = [];

        for await (const chunk of streamResult.stream) {
          if (chunk.type === "text" && chunk.text) {
            accumulatedText += chunk.text;
            yield { type: "text", text: chunk.text };
          } else if (chunk.type === "tool_call_end" && chunk.toolCall) {
            pendingToolCalls.push(chunk.toolCall as LLMToolCall);
          }
        }

        if (pendingToolCalls.length > 0) {
          messages.push({
            role: "assistant",
            content: accumulatedText,
            toolCalls: pendingToolCalls,
          });

          for (const toolCall of pendingToolCalls) {
            const toolInfo: ToolCallInfo = {
              id: toolCall.id,
              name: toolCall.name,
              arguments: toolCall.arguments,
              status: "running",
            };
            allToolCalls.push(toolInfo);

            yield { type: "tool_start", toolCall: toolInfo };

            try {
              const startTime = Date.now();
              const toolResult = await ToolRouterService.executeTool(
                { userId, locale, month: ragContext.currentPeriod.month },
                toolCall.name,
                toolCall.arguments,
              );

              toolInfo.executionTimeMs = Date.now() - startTime;

              if (toolResult.success) {
                toolInfo.status = "success";
                toolInfo.result = toolResult.data;
              } else {
                toolInfo.status = "error";
                toolInfo.error =
                  toolResult.error?.message || "Tool execution failed";
              }

              yield { type: "tool_result", toolCall: toolInfo };

              messages.push({
                role: "tool",
                content: JSON.stringify(
                  toolResult.success
                    ? toolResult.data
                    : { error: toolInfo.error },
                ),
                toolCallId: toolCall.id,
                toolName: toolCall.name,
              });
            } catch (error) {
              toolInfo.status = "error";
              toolInfo.error =
                error instanceof Error ? error.message : "Unknown error";

              yield { type: "tool_result", toolCall: toolInfo };

              messages.push({
                role: "tool",
                content: JSON.stringify({ error: toolInfo.error }),
                toolCallId: toolCall.id,
                toolName: toolCall.name,
              });
            }
          }

          continue;
        }

        finalText = accumulatedText;
        break;
      } else {
        const result = await ChatWithToolsService.generateWithTools(
          userId,
          messages,
          tools,
          ragContext.currentPeriod.month,
        );

        if (result.toolCalls && result.toolCalls.length > 0) {
          messages.push({
            role: "assistant",
            content: result.text || "",
            toolCalls: result.toolCalls,
          });

          for (const toolCall of result.toolCalls) {
            const toolInfo: ToolCallInfo = {
              id: toolCall.id,
              name: toolCall.name,
              arguments: toolCall.arguments,
              status: "running",
            };
            allToolCalls.push(toolInfo);

            yield { type: "tool_start", toolCall: toolInfo };

            try {
              const startTime = Date.now();
              const toolResult = await ToolRouterService.executeTool(
                { userId, locale, month: ragContext.currentPeriod.month },
                toolCall.name,
                toolCall.arguments,
              );

              toolInfo.executionTimeMs = Date.now() - startTime;

              if (toolResult.success) {
                toolInfo.status = "success";
                toolInfo.result = toolResult.data;
              } else {
                toolInfo.status = "error";
                toolInfo.error =
                  toolResult.error?.message || "Tool execution failed";
              }

              yield { type: "tool_result", toolCall: toolInfo };

              messages.push({
                role: "tool",
                content: JSON.stringify(
                  toolResult.success
                    ? toolResult.data
                    : { error: toolInfo.error },
                ),
                toolCallId: toolCall.id,
                toolName: toolCall.name,
              });
            } catch (error) {
              toolInfo.status = "error";
              toolInfo.error =
                error instanceof Error ? error.message : "Unknown error";

              yield { type: "tool_result", toolCall: toolInfo };

              messages.push({
                role: "tool",
                content: JSON.stringify({ error: toolInfo.error }),
                toolCallId: toolCall.id,
                toolName: toolCall.name,
              });
            }
          }

          continue;
        }

        finalText = result.text;
        yield { type: "text", text: result.text };
        break;
      }
    }

    yield {
      type: "done",
      result: {
        text: finalText,
        toolCalls: allToolCalls,
      },
    };
  }

  private static async generateWithTools(
    userId: string,
    messages: LLMMessage[],
    tools: LLMToolDefinition[],
    month: string,
  ) {
    const result = await AIServiceWrapper.generateText(
      userId,
      "chat_with_tools",
      messages,
      {
        tools,
        temperature: 0.7,
        maxTokens: 2000,
      },
      { month, toolsEnabled: true },
    );

    return result;
  }

  private static buildSystemPrompt(
    context: RAGFinancialContext,
    locale: string,
  ): string {
    const languageInstruction =
      locale === "pt-BR"
        ? "You MUST respond in Brazilian Portuguese (pt-BR). All your responses should be in Portuguese."
        : "You should respond in English.";

    const currencySymbol = locale === "pt-BR" ? "R$" : "$";

    const serializedContext = RAGContextSerializerService.serialize(context, {
      locale,
      currencySymbol,
    });

    return `You are a helpful financial assistant with access to real-time financial data tools.

IMPORTANT LANGUAGE INSTRUCTION:
${languageInstruction}

${serializedContext}

AVAILABLE TOOLS:
You have access to tools that can query the user's financial data in real-time:
- Transaction tools: search transactions, get spending summaries, trends
- Budget tools: check budget status, alerts, recommendations
- Category tools: list categories, spending by category
- Account tools: account balances, credit card info
- Points/Miles tools: check points balances, expiring points, offers
- Goal tools: check goal progress

GUIDELINES:
- Use tools when you need current or specific data that isn't in the context above
- Answer questions clearly and concisely in the user's language (${locale})
- When discussing money, format as currency with ${currencySymbol} symbol
- If a tool fails, explain what happened and try an alternative approach
- Be conversational and friendly, but professional
- Keep responses concise unless more detail is requested`;
  }

  private static getAllTools(): LLMToolDefinition[] {
    const baseTools = ALL_TOOLS_SCHEMAS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object" as const,
        properties: Object.fromEntries(
          Object.entries(tool.parameters.properties).map(([key, value]) => [
            key,
            {
              type: value.type,
              description: value.description,
              enum: value.enum,
              items: value.items,
              properties: value.properties,
              minimum: value.minimum,
              maximum: value.maximum,
              default: value.default,
            },
          ]),
        ),
        required: tool.parameters.required,
      },
    }));

    const pointsTools = POINTS_TOOLS_SCHEMAS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object" as const,
        properties: Object.fromEntries(
          Object.entries(tool.parameters.properties).map(([key, value]) => {
            const param = value as any;
            return [
              key,
              {
                type: param.type || "string",
                description: param.description || "",
                enum: param.enum,
                minimum: param.minimum,
                maximum: param.maximum,
              },
            ];
          }),
        ),
        required: tool.parameters.required,
      },
    }));

    return [...baseTools, ...pointsTools];
  }
}
