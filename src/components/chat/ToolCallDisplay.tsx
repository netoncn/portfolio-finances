"use client";

import { CheckCircle2, Loader2, Wrench, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ToolCallInfo, ToolCallStatus } from "@/domain/chat/types/chat";
import { cn } from "@/lib/utils";

interface ToolCallDisplayProps {
  toolCalls: ToolCallInfo[];
  className?: string;
}

function StatusIcon({ status }: { status: ToolCallStatus }) {
  switch (status) {
    case "pending":
    case "running":
      return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
    case "success":
      return <CheckCircle2 className="h-3 w-3 text-green-500" />;
    case "error":
      return <XCircle className="h-3 w-3 text-red-500" />;
    default:
      return null;
  }
}

export function ToolCallDisplay({
  toolCalls,
  className,
}: ToolCallDisplayProps) {
  const t = useTranslations("chat.tools");

  if (toolCalls.length === 0) return null;

  const getToolLabel = (toolName: string): string => {
    const key = `labels.${toolName}`;
    return t.has(key) ? t(key) : toolName;
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {toolCalls.map((tc) => (
        <div
          key={tc.id}
          className={cn(
            "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs",
            "bg-muted/50 border border-muted",
            tc.status === "error" &&
              "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950",
            tc.status === "success" &&
              "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950",
          )}
        >
          <Wrench className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground font-medium truncate">
            {getToolLabel(tc.name)}
          </span>
          <StatusIcon status={tc.status} />
          {tc.executionTimeMs !== undefined && tc.status === "success" && (
            <span className="text-muted-foreground/70 ml-auto">
              {tc.executionTimeMs}ms
            </span>
          )}
          {tc.error && (
            <span
              className="text-red-600 text-xs truncate ml-auto"
              title={tc.error}
            >
              {tc.error.length > 30 ? `${tc.error.slice(0, 30)}...` : tc.error}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

interface ToolCallsCollapsedProps {
  toolCalls: ToolCallInfo[];
  className?: string;
}

export function ToolCallsCollapsed({
  toolCalls,
  className,
}: ToolCallsCollapsedProps) {
  const t = useTranslations("chat.tools");

  if (toolCalls.length === 0) return null;

  const successCount = toolCalls.filter((tc) => tc.status === "success").length;
  const errorCount = toolCalls.filter((tc) => tc.status === "error").length;
  const runningCount = toolCalls.filter(
    (tc) => tc.status === "running" || tc.status === "pending",
  ).length;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md px-2.5 py-1 text-xs",
        "bg-muted/30 border border-muted text-muted-foreground",
        className,
      )}
    >
      <Wrench className="h-3 w-3 shrink-0" />
      <span>{t("used", { count: toolCalls.length })}</span>
      {runningCount > 0 && (
        <span className="flex items-center gap-1 text-blue-600">
          <Loader2 className="h-3 w-3 animate-spin" />
          {runningCount}
        </span>
      )}
      {successCount > 0 && (
        <span className="flex items-center gap-1 text-green-600">
          <CheckCircle2 className="h-3 w-3" />
          {successCount}
        </span>
      )}
      {errorCount > 0 && (
        <span className="flex items-center gap-1 text-red-600">
          <XCircle className="h-3 w-3" />
          {errorCount}
        </span>
      )}
    </div>
  );
}
