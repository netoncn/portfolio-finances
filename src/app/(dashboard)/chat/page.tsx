"use client";

import {
  MessageSquare,
  Sparkles,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMonth, getCurrentMonth, useChat } from "@/hooks/use-chat";
import { formatCurrency } from "@/lib/utils";

export default function ChatPage() {
  const t = useTranslations("chat");
  const currentMonth = getCurrentMonth();
  const { messages, context, sendMessage, clearChat, isLoading } =
    useChat(currentMonth);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const suggestedQuestions = t.raw("suggestions") as string[];

  return (
    <div className="container mx-auto py-6 px-4 h-[calc(100vh-4rem)]">
      <div className="flex flex-col h-full max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t("title")}</h1>
              <p className="text-sm text-muted-foreground">
                {t("subtitle")} {formatMonth(currentMonth)}
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {t("clear")}
            </Button>
          )}
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden mb-4">
          <CardContent className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="mb-6">
                  <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
                    <Sparkles className="h-12 w-12 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">
                    {t("emptyState.title")}
                  </h2>
                  <p className="text-muted-foreground max-w-md">
                    {t("emptyState.description")}
                  </p>
                </div>

                {context && (
                  <div className="grid gap-4 md:grid-cols-3 w-full max-w-2xl mb-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-blue-600" />
                          {t("context.balance")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(context.summary.netBalance * 100)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {context.summary.savingsRate.toFixed(1)}%{" "}
                          {t("context.savingsRate")}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          {t("context.income")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          +{formatCurrency(context.summary.totalIncome * 100)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("context.thisMonth")}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                          {t("context.expenses")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                          -{formatCurrency(context.summary.totalExpenses * 100)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {context.summary.transactionCount}{" "}
                          {t("context.transactions")}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className="w-full max-w-2xl">
                  <p className="text-sm font-medium mb-3 text-left">
                    {t("emptyState.examples.title")}
                  </p>
                  <div className="grid gap-2">
                    {suggestedQuestions.map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="justify-start text-left h-auto py-3 px-4"
                        onClick={() => sendMessage(question)}
                        disabled={isLoading}
                      >
                        <MessageSquare className="h-4 w-4 mr-2 shrink-0" />
                        <span className="text-sm">{question}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </CardContent>
        </Card>

        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          placeholder={t("placeholder")}
        />
      </div>
    </div>
  );
}
