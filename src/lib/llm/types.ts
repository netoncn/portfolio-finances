export type LLMProviderType = "openai" | "anthropic" | "google";

export type MessageRole = "system" | "user" | "assistant" | "tool";

export interface LLMToolParameter {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  enum?: string[];
  items?: LLMToolParameter;
  properties?: Record<string, LLMToolParameter>;
  required?: string[];
  minimum?: number;
  maximum?: number;
  default?: unknown;
}

export interface LLMToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, LLMToolParameter>;
    required?: string[];
  };
}

export interface LLMToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface LLMToolResult {
  toolCallId: string;
  toolName: string;
  result: unknown;
  isError?: boolean;
}

export interface LLMMessage {
  role: MessageRole;
  content: string;
  toolCalls?: LLMToolCall[];
  toolCallId?: string;
  toolName?: string;
}

export interface LLMGenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  tools?: LLMToolDefinition[];
  toolChoice?: "auto" | "none" | "required" | { name: string };
}

export interface LLMGenerationResult {
  text: string;
  finishReason?: string;
  toolCalls?: LLMToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: LLMProviderType;
}

export type LLMStreamChunkType =
  | "text"
  | "tool_call_start"
  | "tool_call_delta"
  | "tool_call_end"
  | "finish";

export interface LLMStreamChunk {
  type: LLMStreamChunkType;
  text?: string;
  toolCall?: Partial<LLMToolCall>;
  finishReason?: string;
}

export interface LLMStreamResult {
  stream: AsyncIterable<LLMStreamChunk>;
  response: Promise<LLMGenerationResult>;
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

  streamText?(
    messages: LLMMessage[],
    options?: LLMGenerationOptions,
  ): Promise<LLMStreamResult>;
}
