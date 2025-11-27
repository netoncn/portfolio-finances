import "server-only";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { logger } from "@/lib/logger";
import { BaseLLMProvider } from "../base-provider";
import type {
  LLMGenerationOptions,
  LLMGenerationResult,
  LLMMessage,
  LLMProviderConfig,
} from "../types";

export class GoogleProvider extends BaseLLMProvider {
  readonly type = "google" as const;
  private client: ReturnType<typeof createGoogleGenerativeAI>;

  constructor(config: LLMProviderConfig) {
    super(config);
    this.client = createGoogleGenerativeAI({
      apiKey: config.apiKey,
    });
  }

  async generateText(
    messages: LLMMessage[],
    options?: LLMGenerationOptions,
  ): Promise<LLMGenerationResult> {
    if (!this.isAvailable()) {
      throw new Error("Google provider is not configured");
    }

    try {
      const mergedOptions = this.mergeOptions(options);

      const geminiMessages = messages
        .filter((msg) => msg.role !== "system")
        .map((msg) => ({
          role:
            msg.role === "assistant"
              ? ("assistant" as const)
              : ("user" as const),
          content: msg.content,
        }));

      const systemMessage = messages.find((msg) => msg.role === "system");
      if (
        systemMessage &&
        geminiMessages.length > 0 &&
        geminiMessages[0].role === "user"
      ) {
        geminiMessages[0] = {
          ...geminiMessages[0],
          content: `${systemMessage.content}\n\n${geminiMessages[0].content}`,
        };
      }

      const result = await generateText({
        model: this.client(mergedOptions.model),
        messages: geminiMessages,
        temperature: mergedOptions.temperature,
        topP: mergedOptions.topP,
        // Note: Gemini doesn't support frequency/presence penalty
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
      logger.error("Google generation error", error as Error);
      throw error;
    }
  }

  async generateJSON<T = unknown>(
    messages: LLMMessage[],
    options?: LLMGenerationOptions,
  ): Promise<T> {
    if (!this.isAvailable()) {
      throw new Error("Google provider is not configured");
    }

    try {
      const mergedOptions = this.mergeOptions(options);

      const enhancedMessages: LLMMessage[] = [
        {
          role: "system",
          content:
            "You are a helpful assistant that always responds with valid JSON only. Return ONLY the JSON object without any markdown, code blocks, or additional text.",
        },
        ...messages,
      ];

      const geminiMessages = enhancedMessages
        .filter((msg) => msg.role !== "system")
        .map((msg) => ({
          role:
            msg.role === "assistant"
              ? ("assistant" as const)
              : ("user" as const),
          content: msg.content,
        }));

      const systemMessage = enhancedMessages.find(
        (msg) => msg.role === "system",
      );
      if (
        systemMessage &&
        geminiMessages.length > 0 &&
        geminiMessages[0].role === "user"
      ) {
        geminiMessages[0] = {
          ...geminiMessages[0],
          content: `${systemMessage.content}\n\n${geminiMessages[0].content}`,
        };
      }

      const result = await generateText({
        model: this.client(mergedOptions.model),
        messages: geminiMessages,
        temperature: mergedOptions.temperature,
        topP: mergedOptions.topP,
        maxRetries: 3,
      });

      return this.parseJSON<T>(result.text);
    } catch (error) {
      logger.error("Google JSON generation error", error as Error);
      throw error;
    }
  }
}
