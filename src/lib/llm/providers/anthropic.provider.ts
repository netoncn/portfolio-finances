import "server-only";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { logger } from "@/lib/logger";
import { BaseLLMProvider } from "../base-provider";
import type {
  LLMGenerationOptions,
  LLMGenerationResult,
  LLMMessage,
  LLMProviderConfig,
} from "../types";

export class AnthropicProvider extends BaseLLMProvider {
  readonly type = "anthropic" as const;
  private client: ReturnType<typeof createAnthropic>;

  constructor(config: LLMProviderConfig) {
    super(config);
    this.client = createAnthropic({
      apiKey: config.apiKey,
    });
  }

  async generateText(
    messages: LLMMessage[],
    options?: LLMGenerationOptions,
  ): Promise<LLMGenerationResult> {
    if (!this.isAvailable()) {
      throw new Error("Anthropic provider is not configured");
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
      logger.error("Anthropic generation error", error as Error);
      throw error;
    }
  }

  async generateJSON<T = unknown>(
    messages: LLMMessage[],
    options?: LLMGenerationOptions,
  ): Promise<T> {
    if (!this.isAvailable()) {
      throw new Error("Anthropic provider is not configured");
    }

    try {
      const mergedOptions = this.mergeOptions(options);

      const enhancedMessages: LLMMessage[] = [
        {
          role: "system",
          content:
            "You are a helpful assistant that always responds with valid JSON only. Return ONLY the JSON object without any markdown formatting, code blocks, or additional text.",
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
        maxRetries: 3,
      });

      return this.parseJSON<T>(result.text);
    } catch (error) {
      logger.error("Anthropic JSON generation error", error as Error);
      throw error;
    }
  }
}
