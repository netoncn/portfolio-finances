"use client";

import { Bot, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ChatMessage as ChatMessageType } from "@/domain/chat/types/chat";
import { ToolCallDisplay } from "./ToolCallDisplay";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  if (!isUser && !isAssistant) {
    return null;
  }

  const hasToolCalls = message.toolCalls && message.toolCalls.length > 0;
  const hasContent = message.content.trim().length > 0;

  return (
    <div
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} mb-4`}
    >
      <Avatar className="h-8 w-8 mt-1">
        <AvatarFallback
          className={
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[80%]`}
      >
        {isAssistant && hasToolCalls && (
          <ToolCallDisplay
            toolCalls={message.toolCalls!}
            className="mb-2 w-full"
          />
        )}

        {(hasContent || message.isStreaming) && (
          <div
            className={`rounded-lg px-4 py-2 ${
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
              {message.isStreaming && !hasContent && (
                <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
              )}
            </p>
          </div>
        )}

        <span className="text-xs text-muted-foreground mt-1">
          {new Date(message.timestamp).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
