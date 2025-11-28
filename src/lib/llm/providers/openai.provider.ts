import "server-only";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, streamText, tool } from "ai";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { BaseLLMProvider } from "../base-provider";
import type {
  LLMGenerationOptions,
  LLMGenerationResult,
  LLMMessage,
  LLMProviderConfig,
  LLMStreamChunk,
  LLMStreamResult,
  LLMToolCall,
  LLMToolDefinition,
} from "../types";

export class OpenAIProvider extends BaseLLMProvider {
  readonly type = "openai" as const;
  private client: ReturnType<typeof createOpenAI>;

  constructor(config: LLMProviderConfig) {
    super(config);
    this.client = createOpenAI({
      apiKey: config.apiKey,
    });
  }

  private toAIMessages(
    messages: LLMMessage[],
  ): Array<{ role: "system" | "user" | "assistant"; content: string }> {
    return messages
      .filter((msg) => msg.role !== "tool")
      .map((msg) => ({
        role: msg.role as "system" | "user" | "assistant",
        content: msg.content,
      }));
  }

  private buildZodSchema(
    param: LLMToolDefinition["parameters"]["properties"][string],
  ): z.ZodTypeAny {
    switch (param.type) {
      case "string":
        return param.enum
          ? z.enum(param.enum as [string, ...string[]])
          : z.string().describe(param.description);
      case "number":
        return z.number().describe(param.description);
      case "boolean":
        return z.boolean().describe(param.description);
      default:
        return z.any().describe(param.description);
    }
  }

  private toAITools(
    tools?: LLMToolDefinition[],
  ): Record<string, any> | undefined {
    if (!tools || tools.length === 0) return undefined;

    const result: Record<string, any> = {};
    for (const toolDef of tools) {
      const schemaProperties: Record<string, z.ZodTypeAny> = {};
      const required = toolDef.parameters.required || [];

      for (const [key, param] of Object.entries(
        toolDef.parameters.properties,
      )) {
        const zodType = this.buildZodSchema(param);
        schemaProperties[key] = required.includes(key)
          ? zodType
          : zodType.optional();
      }

      result[toolDef.name] = tool({
        description: toolDef.description,
        inputSchema: z.object(schemaProperties),
      });
    }
    return result;
  }

  async generateText(
    messages: LLMMessage[],
    options?: LLMGenerationOptions,
  ): Promise<LLMGenerationResult> {
    if (!this.isAvailable()) {
      throw new Error("OpenAI provider is not configured");
    }

    try {
      const mergedOptions = this.mergeOptions(options);
      const aiMessages = this.toAIMessages(messages);
      const tools = this.toAITools(mergedOptions.tools);

      const result = await generateText({
        model: this.client(mergedOptions.model),
        messages: aiMessages,
        tools,
        toolChoice: mergedOptions.toolChoice as any,
        temperature: mergedOptions.temperature,
        topP: mergedOptions.topP,
        frequencyPenalty: mergedOptions.frequencyPenalty,
        presencePenalty: mergedOptions.presencePenalty,
        maxRetries: 3,
      });

      const toolCalls: LLMToolCall[] = (result.toolCalls || []).map(
        (tc: any) => ({
          id: tc.toolCallId,
          name: tc.toolName,
          arguments: tc.args as Record<string, unknown>,
        }),
      );

      const usage = result.usage as any;
      return {
        text: result.text,
        finishReason: result.finishReason,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        usage: usage
          ? {
              promptTokens: usage.promptTokens || 0,
              completionTokens: usage.completionTokens || 0,
              totalTokens: usage.totalTokens || 0,
            }
          : undefined,
        model: mergedOptions.model,
        provider: this.type,
      };
    } catch (error) {
      logger.error("OpenAI generation error", error as Error);
      throw error;
    }
  }

  async generateJSON<T = unknown>(
    messages: LLMMessage[],
    options?: LLMGenerationOptions,
  ): Promise<T> {
    if (!this.isAvailable()) {
      throw new Error("OpenAI provider is not configured");
    }

    try {
      const mergedOptions = this.mergeOptions(options);

      const enhancedMessages: LLMMessage[] = [
        {
          role: "system",
          content:
            "You are a helpful assistant that always responds with valid JSON only. Do not include any text before or after the JSON.",
        },
        ...messages,
      ];

      const result = await generateText({
        model: this.client(mergedOptions.model),
        messages: this.toAIMessages(enhancedMessages),
        temperature: mergedOptions.temperature,
        topP: mergedOptions.topP,
        frequencyPenalty: mergedOptions.frequencyPenalty,
        presencePenalty: mergedOptions.presencePenalty,
        maxRetries: 3,
      });

      return this.parseJSON<T>(result.text);
    } catch (error) {
      logger.error("OpenAI JSON generation error", error as Error);
      throw error;
    }
  }

  async streamText(
    messages: LLMMessage[],
    options?: LLMGenerationOptions,
  ): Promise<LLMStreamResult> {
    if (!this.isAvailable()) {
      throw new Error("OpenAI provider is not configured");
    }

    const mergedOptions = this.mergeOptions(options);
    const aiMessages = this.toAIMessages(messages);
    const tools = this.toAITools(mergedOptions.tools);

    const result = streamText({
      model: this.client(mergedOptions.model),
      messages: aiMessages,
      tools,
      toolChoice: mergedOptions.toolChoice as any,
      temperature: mergedOptions.temperature,
      topP: mergedOptions.topP,
      frequencyPenalty: mergedOptions.frequencyPenalty,
      presencePenalty: mergedOptions.presencePenalty,
      maxRetries: 3,
    });
    const modelName = mergedOptions.model;

    async function* streamGenerator(): AsyncGenerator<LLMStreamChunk> {
      for await (const part of result.fullStream) {
        if (part.type === "text-delta") {
          yield {
            type: "text",
            text: part.text,
          };
        } else if (part.type === "tool-call") {
          const toolCall = part as any;
          yield {
            type: "tool_call_end",
            toolCall: {
              id: toolCall.toolCallId,
              name: toolCall.toolName,
              arguments: toolCall.args as Record<string, unknown>,
            },
          };
        } else if (part.type === "finish") {
          yield {
            type: "finish",
            finishReason: part.finishReason,
          };
        }
      }
    }

    const responsePromise = (async (): Promise<LLMGenerationResult> => {
      let fullText = "";
      const collectedToolCalls: LLMToolCall[] = [];

      for await (const part of result.fullStream) {
        if (part.type === "text-delta") {
          fullText += part.text;
        } else if (part.type === "tool-call") {
          const toolCall = part as any;
          collectedToolCalls.push({
            id: toolCall.toolCallId,
            name: toolCall.toolName,
            arguments: toolCall.args as Record<string, unknown>,
          });
        }
      }

      return {
        text: fullText,
        finishReason: "stop",
        toolCalls:
          collectedToolCalls.length > 0 ? collectedToolCalls : undefined,
        usage: undefined,
        model: modelName,
        provider: this.type,
      };
    })();

    return {
      stream: streamGenerator(),
      response: responsePromise,
    };
  }
}
