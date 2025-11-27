export type LLMProviderType = "openai" | "anthropic" | "google";

export type MessageRole = "system" | "user" | "assistant";

export interface LLMMessage {
  role: MessageRole;
  content: string;
}

export interface LLMGenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

export interface LLMGenerationResult {
  text: string;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: LLMProviderType;
}

export interface LLMProviderConfig {
  apiKey: string;
  model: string;
  defaultOptions?: Partial<LLMGenerationOptions>;
}

export interface ILLMProvider {
  readonly type: LLMProviderType;

  isAvailable(): boolean;

  generateText(
    messages: LLMMessage[],
    options?: LLMGenerationOptions,
  ): Promise<LLMGenerationResult>;

  generateJSON<T = unknown>(
    messages: LLMMessage[],
    options?: LLMGenerationOptions,
  ): Promise<T>;
}
