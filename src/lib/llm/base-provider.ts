import "server-only";
import { logger } from "@/lib/logger";
import type {
  ILLMProvider,
  LLMGenerationOptions,
  LLMGenerationResult,
  LLMMessage,
  LLMProviderConfig,
  LLMProviderType,
} from "./types";

export abstract class BaseLLMProvider implements ILLMProvider {
  protected config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  abstract readonly type: LLMProviderType;

  isAvailable(): boolean {
    return !!this.config.apiKey && !!this.config.model;
  }

  abstract generateText(
    messages: LLMMessage[],
    options?: LLMGenerationOptions,
  ): Promise<LLMGenerationResult>;

  async generateJSON<T = unknown>(
    messages: LLMMessage[],
    options?: LLMGenerationOptions,
  ): Promise<T> {
    try {
      const result = await this.generateText(messages, options);
      return this.parseJSON<T>(result.text);
    } catch (error) {
      logger.error(`Failed to generate JSON with ${this.type}`, error as Error);
      throw error;
    }
  }

  protected parseJSON<T>(text: string): T {
    try {
      const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      const objectMatch = text.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        return JSON.parse(objectMatch[0]);
      }

      const arrayMatch = text.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        return JSON.parse(arrayMatch[0]);
      }

      return JSON.parse(text);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to parse JSON from LLM response", err);
      logger.error("Raw response", new Error(text));
      throw new Error("Invalid JSON response from LLM");
    }
  }

  protected mergeOptions(
    options?: LLMGenerationOptions,
  ): Required<LLMGenerationOptions> {
    return {
      model: options?.model || this.config.model,
      temperature:
        options?.temperature ?? this.config.defaultOptions?.temperature ?? 0.3,
      maxTokens:
        options?.maxTokens ?? this.config.defaultOptions?.maxTokens ?? 500,
      topP: options?.topP ?? this.config.defaultOptions?.topP ?? 1,
      frequencyPenalty:
        options?.frequencyPenalty ??
        this.config.defaultOptions?.frequencyPenalty ??
        0,
      presencePenalty:
        options?.presencePenalty ??
        this.config.defaultOptions?.presencePenalty ??
        0,
      stop: options?.stop ?? this.config.defaultOptions?.stop ?? [],
    };
  }
}
