export type ChatRole = "user" | "assistant" | "system";

export type ToolCallStatus = "pending" | "running" | "success" | "error";

export interface ToolCallInfo {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: ToolCallStatus;
  result?: unknown;
  error?: string;
  executionTimeMs?: number;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
  toolCalls?: ToolCallInfo[];
  isStreaming?: boolean;
}

export interface FinancialContext {
  month: string;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    savingsRate: number;
    transactionCount: number;
  };
  topCategories: Array<{
    name: string;
    amount: number;
    percentage: number;
    count: number;
  }>;
  budgets: Array<{
    name: string;
    spent: number;
    limit: number;
    percentage: number;
    remaining: number;
  }>;
  recentTransactions: Array<{
    description: string;
    amount: number;
    category: string;
    date: string;
  }>;
  insights?: {
    trends: string[];
    alerts: string[];
  };
  pointsContext?: string;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  month?: string; // YYYY-MM format, defaults to current month
}

export interface ChatResponse {
  message: string;
  context?: FinancialContext;
  timestamp: number;
}
