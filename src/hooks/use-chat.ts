"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type {
  ChatMessage,
  ChatResponse,
  FinancialContext,
} from "@/domain/chat/types/chat";

interface ChatApiResponse {
  success: boolean;
  data: ChatResponse;
}

async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  month?: string,
): Promise<ChatResponse> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      history,
      month,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send message");
  }

  const json: ChatApiResponse = await response.json();
  return json.data;
}

export function useChat(month?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [context, setContext] = useState<FinancialContext | null>(null);

  const mutation = useMutation({
    mutationFn: (message: string) => sendChatMessage(message, messages, month),
    onMutate: async (message: string) => {
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);
    },
    onSuccess: (response) => {
      const assistantMessage: ChatMessage = {
        id: `assistant-${response.timestamp}`,
        role: "assistant",
        content: response.message,
        timestamp: response.timestamp,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (response.context) {
        setContext(response.context);
      }
    },
    onError: (error) => {
      setMessages((prev) => prev.slice(0, -1));

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `I'm sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  const sendMessage = (message: string) => {
    mutation.mutate(message);
  };

  const clearChat = () => {
    setMessages([]);
    setContext(null);
  };

  return {
    messages,
    context,
    sendMessage,
    clearChat,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function formatMonth(month: string): string {
  const [year, monthNum] = month.split("-");
  const date = new Date(Number(year), Number(monthNum) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
