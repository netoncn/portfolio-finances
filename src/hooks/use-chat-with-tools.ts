"use client";

import { useCallback, useState } from "react";
import type { ChatMessage, ToolCallInfo } from "@/domain/chat/types/chat";

interface StreamChunk {
  type: "text" | "tool_start" | "tool_result" | "done";
  text?: string;
  toolCall?: ToolCallInfo;
  result?: {
    text: string;
    toolCalls: ToolCallInfo[];
  };
}

export function useChatWithTools() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(
    async (userInput: string) => {
      if (!userInput.trim() || isLoading) return;

      setIsLoading(true);
      setError(null);

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: userInput,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);

      const assistantId = `assistant-${Date.now()}`;
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        toolCalls: [],
        isStreaming: true,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const history = messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        }));

        const response = await fetch("/api/chat/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userInput,
            history,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let currentText = "";
        let currentToolCalls: ToolCallInfo[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);

              if (data === "[DONE]") {
                continue;
              }

              try {
                const chunk: StreamChunk = JSON.parse(data);

                switch (chunk.type) {
                  case "text":
                    if (chunk.text) {
                      currentText += chunk.text;
                      setMessages((prev) =>
                        prev.map((m) =>
                          m.id === assistantId
                            ? { ...m, content: currentText }
                            : m,
                        ),
                      );
                    }
                    break;

                  case "tool_start":
                    if (chunk.toolCall) {
                      currentToolCalls = [...currentToolCalls, chunk.toolCall];
                      setMessages((prev) =>
                        prev.map((m) =>
                          m.id === assistantId
                            ? { ...m, toolCalls: currentToolCalls }
                            : m,
                        ),
                      );
                    }
                    break;

                  case "tool_result":
                    if (chunk.toolCall) {
                      currentToolCalls = currentToolCalls.map((tc) =>
                        tc.id === chunk.toolCall?.id
                          ? { ...tc, ...chunk.toolCall }
                          : tc,
                      );
                      setMessages((prev) =>
                        prev.map((m) =>
                          m.id === assistantId
                            ? { ...m, toolCalls: currentToolCalls }
                            : m,
                        ),
                      );
                    }
                    break;

                  case "done":
                    if (chunk.result) {
                      setMessages((prev) =>
                        prev.map((m) =>
                          m.id === assistantId
                            ? {
                                ...m,
                                content: chunk.result?.text || currentText,
                                toolCalls:
                                  chunk.result?.toolCalls || currentToolCalls,
                                isStreaming: false,
                              }
                            : m,
                        ),
                      );
                    }
                    break;
                }
              } catch (e) {
                console.error("Failed to parse SSE data:", e);
              }
            }
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, isStreaming: false } : m,
          ),
        );
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    "I'm sorry, I encountered an error. Please try again.",
                  isStreaming: false,
                }
              : m,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    sendMessage,
    clearChat,
    isLoading,
    error,
  };
}
