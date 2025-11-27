import "server-only";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import { AnthropicProvider } from "./providers/anthropic.provider";
import { GoogleProvider } from "./providers/google.provider";
import { OpenAIProvider } from "./providers/openai.provider";
import type { ILLMProvider, LLMProviderType } from "./types";

export class LLMProviderFactory {
  private static instance: ILLMProvider | null = null;

  static getProvider(): ILLMProvider {
    if (LLMProviderFactory.instance) {
      return LLMProviderFactory.instance;
    }

    const providerType = env.server.LLM_PROVIDER;
    LLMProviderFactory.instance =
      LLMProviderFactory.createProvider(providerType);

    if (!LLMProviderFactory.instance.isAvailable()) {
      logger.warn(
        `LLM provider ${providerType} is configured but not available. Check API keys.`,
      );
    }

    logger.info(`LLM provider initialized: ${providerType}`);
    return LLMProviderFactory.instance;
  }

  static createProvider(type: LLMProviderType): ILLMProvider {
    switch (type) {
      case "openai":
        return new OpenAIProvider({
          apiKey: env.server.OPENAI_API_KEY || "",
          model: env.server.OPENAI_MODEL,
          defaultOptions: {
            temperature: 0.3,
            maxTokens: 500,
          },
        });

      case "anthropic":
        return new AnthropicProvider({
          apiKey: env.server.ANTHROPIC_API_KEY || "",
          model: env.server.ANTHROPIC_MODEL,
          defaultOptions: {
            temperature: 0.3,
            maxTokens: 500,
          },
        });

      case "google":
        return new GoogleProvider({
          apiKey: env.server.GOOGLE_AI_API_KEY || "",
          model: env.server.GOOGLE_MODEL,
          defaultOptions: {
            temperature: 0.3,
            maxTokens: 500,
          },
        });

      default:
        throw new Error(`Unsupported LLM provider: ${type}`);
    }
  }

  static isAnyProviderAvailable(): boolean {
    try {
      const provider = LLMProviderFactory.getProvider();
      return provider.isAvailable();
    } catch {
      return false;
    }
  }

  static reset(): void {
    LLMProviderFactory.instance = null;
  }

  static getAvailableProviders(): LLMProviderType[] {
    const providers: LLMProviderType[] = [];

    if (env.server.OPENAI_API_KEY) {
      providers.push("openai");
    }

    if (env.server.ANTHROPIC_API_KEY) {
      providers.push("anthropic");
    }

    if (env.server.GOOGLE_AI_API_KEY) {
      providers.push("google");
    }

    return providers;
  }
}
