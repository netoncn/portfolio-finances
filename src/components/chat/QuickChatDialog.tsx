"use client";

import { MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMonth, getCurrentMonth, useChat } from "@/hooks/use-chat";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";

interface QuickChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickChatDialog({ open, onOpenChange }: QuickChatDialogProps) {
  const t = useTranslations("chat");
  const currentMonth = getCurrentMonth();
  const { messages, sendMessage, isLoading } = useChat(currentMonth);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {t("subtitle")} {formatMonth(currentMonth)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 min-h-[300px] max-h-[50vh]">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="mb-4">
                <div className="inline-flex p-3 bg-primary/10 rounded-full mb-3">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {t("emptyState.title")}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {t("emptyState.description")}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <ChatInput
            onSend={sendMessage}
            isLoading={isLoading}
            placeholder={t("placeholder")}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
