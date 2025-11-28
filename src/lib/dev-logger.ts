import { isDevelopment } from "@/config/env";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  source?: string;
}

const MAX_LOGS = 500;
const logs: LogEntry[] = [];

let logIdCounter = 0;

function generateId(): string {
  return `log_${Date.now()}_${++logIdCounter}`;
}

export function addLog(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  source?: string,
): void {
  if (!isDevelopment()) return;

  const entry: LogEntry = {
    id: generateId(),
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    source,
  };

  logs.unshift(entry);

  // Keep only the last MAX_LOGS entries
  if (logs.length > MAX_LOGS) {
    logs.pop();
  }
}

export function getLogs(options?: {
  level?: LogLevel;
  limit?: number;
  source?: string;
  search?: string;
}): LogEntry[] {
  if (!isDevelopment()) return [];

  let filtered = [...logs];

  if (options?.level) {
    filtered = filtered.filter((log) => log.level === options.level);
  }

  if (options?.source) {
    filtered = filtered.filter((log) => log.source === options.source);
  }

  if (options?.search) {
    const searchLower = options.search.toLowerCase();
    filtered = filtered.filter(
      (log) =>
        log.message.toLowerCase().includes(searchLower) ||
        JSON.stringify(log.context || {})
          .toLowerCase()
          .includes(searchLower),
    );
  }

  if (options?.limit) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

export function clearLogs(): void {
  if (!isDevelopment()) return;
  logs.length = 0;
}

export function getLogStats(): {
  total: number;
  byLevel: Record<LogLevel, number>;
  sources: string[];
} {
  if (!isDevelopment()) {
    return {
      total: 0,
      byLevel: { debug: 0, info: 0, warn: 0, error: 0 },
      sources: [],
    };
  }

  const byLevel: Record<LogLevel, number> = {
    debug: 0,
    info: 0,
    warn: 0,
    error: 0,
  };
  const sourcesSet = new Set<string>();

  for (const log of logs) {
    byLevel[log.level]++;
    if (log.source) {
      sourcesSet.add(log.source);
    }
  }

  return {
    total: logs.length,
    byLevel,
    sources: Array.from(sourcesSet),
  };
}

// Dev logger helpers
export const devLog = {
  debug: (
    message: string,
    context?: Record<string, unknown>,
    source?: string,
  ) => addLog("debug", message, context, source),
  info: (message: string, context?: Record<string, unknown>, source?: string) =>
    addLog("info", message, context, source),
  warn: (message: string, context?: Record<string, unknown>, source?: string) =>
    addLog("warn", message, context, source),
  error: (
    message: string,
    context?: Record<string, unknown>,
    source?: string,
  ) => addLog("error", message, context, source),
};
