import "server-only";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { logger } from "@/lib/logger";
import { BaseLLMProvider } from "../base-provider";
import type {
  LLMGenerationOptions,
  LLMGenerationResult,
  LLMMessage,
  LLMProviderConfig,
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

  async generateText(
    messages: LLMMessage[],
    options?: LLMGenerationOptions,
  ): Promise<LLMGenerationResult> {
    if (!this.isAvailable()) {
      throw new Error("OpenAI provider is not configured");
    }

    try {
      const mergedOptions = this.mergeOptions(options);

      const result = await generateText({
        model: this.client(mergedOptions.model),
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: mergedOptions.temperature,
        topP: mergedOptions.topP,
        frequencyPenalty: mergedOptions.frequencyPenalty,
        presencePenalty: mergedOptions.presencePenalty,
        maxRetries: 3,
      });

      const usage = result.usage as any;
      return {
        text: result.text,
        finishReason: result.finishReason,
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
        messages: enhancedMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
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
}
