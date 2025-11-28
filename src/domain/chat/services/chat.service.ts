import "server-only";
import { FinancialAggregatorService } from "@/domain/ai/rag/financial-aggregator.service";
import type { RAGFinancialContext } from "@/domain/ai/rag/rag.types";
import { RAGContextSerializerService } from "@/domain/ai/rag/rag-context-serializer.service";
import { AIServiceWrapper } from "@/domain/ai-usage";
import { BudgetService } from "@/domain/budgets/services/budget.service";
import { CategoryService } from "@/domain/categories/services/category.service";
import { PointsContextService } from "@/domain/points/ai";
import { TransactionService } from "@/domain/transactions/services/transaction.service";
import { type LLMMessage, LLMProviderFactory } from "@/lib/llm";
import { logger } from "@/lib/logger";
import { PrivacyService } from "@/lib/privacy";
import { getUserLocale } from "@/services/locale";
import type { ChatMessage, FinancialContext } from "../types/chat";

export class ChatService {
  static async buildFinancialContext(
    userId: string,
    month: string,
  ): Promise<FinancialContext> {
    try {
      // Parse month (YYYY-MM)
      const [year, monthNum] = month.split("-").map(Number);
      const periodStart = new Date(year, monthNum - 1, 1).getTime();
      const periodEnd = new Date(year, monthNum, 0, 23, 59, 59, 999).getTime();

      const [transactions, categories, budgets, pointsContext] =
        await Promise.all([
          TransactionService.listByUser(userId),
          CategoryService.listByUser(userId),
          BudgetService.listByUser(userId).catch(() => []),
          PointsContextService.buildPointsContext(userId).catch(() => ""),
        ]);

      const monthTransactions = transactions.filter(
        (t) => t.date >= periodStart && t.date <= periodEnd,
      );

      const totalIncome =
        monthTransactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + Math.abs(t.amount), 0) / 100;

      const totalExpenses =
        monthTransactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Math.abs(t.amount), 0) / 100;

      const netBalance = totalIncome - totalExpenses;
      const savingsRate =
        totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

      const categorySpending: Record<
        string,
        { amount: number; count: number }
      > = {};

      for (const transaction of monthTransactions) {
        if (transaction.type === "expense" && transaction.categoryId) {
          if (!categorySpending[transaction.categoryId]) {
            categorySpending[transaction.categoryId] = { amount: 0, count: 0 };
          }
          categorySpending[transaction.categoryId].amount +=
            Math.abs(transaction.amount) / 100; // Convert from cents
          categorySpending[transaction.categoryId].count += 1;
        }
      }

      const topCategories = Object.entries(categorySpending)
        .map(([categoryId, data]) => {
          const category = categories.find((c) => c.id === categoryId);
          return {
            name: category?.name || "Unknown",
            amount: data.amount,
            percentage:
              totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
            count: data.count,
          };
        })
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      const budgetStatus = budgets
        .filter((b) => b.period === "monthly")
        .map((budget) => {
          const totalSpent = Object.entries(categorySpending)
            .filter(([categoryId]) => budget.categoryIds.includes(categoryId))
            .reduce((sum, [, data]) => sum + data.amount, 0);

          return {
            name: budget.name,
            spent: totalSpent,
            limit: budget.amount,
            percentage: (totalSpent / budget.amount) * 100,
            remaining: budget.amount - totalSpent,
          };
        });

      const recentTransactions = monthTransactions
        .sort((a, b) => b.date - a.date)
        .slice(0, 10)
        .map((t) => {
          const category = categories.find((c) => c.id === t.categoryId);

          const sanitized = PrivacyService.sanitizeTransaction({
            description: t.description,
            merchant: t.merchant,
            tags: t.tags,
          });

          return {
            description: sanitized.description,
            amount: t.amount / 100, // Convert from cents
            category: category?.name || "Uncategorized",
            date: new Date(t.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
          };
        });

      return {
        month,
        summary: {
          totalIncome,
          totalExpenses,
          netBalance,
          savingsRate,
          transactionCount: monthTransactions.length,
        },
        topCategories,
        budgets: budgetStatus,
        recentTransactions,
        pointsContext: pointsContext || undefined,
      };
    } catch (error) {
      logger.error("Failed to build financial context", error as Error);
      throw error;
    }
  }

  static async processMessage(
    userId: string,
    userMessage: string,
    context: FinancialContext,
    history: ChatMessage[] = [],
  ): Promise<string> {
    try {
      if (!LLMProviderFactory.isAnyProviderAvailable()) {
        return "I'm sorry, but the AI service is currently unavailable. Please check your configuration.";
      }

      const locale = await getUserLocale();

      const systemPrompt = ChatService.buildSystemPrompt(context, locale);

      const messages: LLMMessage[] = [
        {
          role: "system",
          content: systemPrompt,
        },
      ];

      const recentHistory = history.slice(-5);
      for (const msg of recentHistory) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }

      const sanitizedMessage = PrivacyService.sanitizeChatMessage({
        content: userMessage,
        role: "user",
      });

      messages.push({
        role: "user",
        content: sanitizedMessage.content,
      });

      const result = await AIServiceWrapper.generateText(
        userId,
        "chat",
        messages,
        {
          temperature: 0.7,
        },
        {
          month: context.month,
          historyLength: recentHistory.length,
        },
      );

      return result.text;
    } catch (error) {
      logger.error("Failed to process chat message", error as Error);
      throw error;
    }
  }

  private static buildSystemPrompt(
    context: FinancialContext,
    locale: string,
  ): string {
    const {
      month,
      summary,
      topCategories,
      budgets,
      recentTransactions,
      pointsContext,
    } = context;

    const monthName = new Date(`${month}-01`).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    const languageInstruction =
      locale === "pt-BR"
        ? "You MUST respond in Brazilian Portuguese (pt-BR). All your responses should be in Portuguese."
        : "You should respond in English.";

    const currencySymbol = locale === "pt-BR" ? "R$" : "$";

    let prompt = `You are a helpful financial assistant. You help users understand their financial situation and answer questions about their spending, income, and budgets.

IMPORTANT LANGUAGE INSTRUCTION:
${languageInstruction}

Current Month: ${monthName}

FINANCIAL SUMMARY:
- Total Income: ${currencySymbol}${summary.totalIncome.toFixed(2)}
- Total Expenses: ${currencySymbol}${summary.totalExpenses.toFixed(2)}
- Net Balance: ${currencySymbol}${summary.netBalance.toFixed(2)}
- Savings Rate: ${summary.savingsRate.toFixed(1)}%
- Total Transactions: ${summary.transactionCount}

TOP SPENDING CATEGORIES:
`;

    for (const category of topCategories) {
      prompt += `- ${category.name}: ${currencySymbol}${category.amount.toFixed(2)} (${category.percentage.toFixed(1)}%, ${category.count} transactions)\n`;
    }

    if (budgets.length > 0) {
      prompt += `\nBUDGET STATUS:\n`;
      for (const budget of budgets) {
        const status =
          budget.percentage >= 100
            ? "⚠️ EXCEEDED"
            : budget.percentage >= 80
              ? "⚠️ WARNING"
              : "✓ On Track";
        prompt += `- ${budget.name}: ${currencySymbol}${budget.spent.toFixed(2)} / ${currencySymbol}${budget.limit.toFixed(2)} (${budget.percentage.toFixed(0)}%) - ${status}\n`;
      }
    }

    if (recentTransactions.length > 0) {
      prompt += `\nRECENT TRANSACTIONS:\n`;
      for (const tx of recentTransactions.slice(0, 5)) {
        const sign = tx.amount >= 0 ? "+" : "-";
        prompt += `- ${tx.date}: ${tx.description} - ${sign}${currencySymbol}${Math.abs(tx.amount).toFixed(2)} (${tx.category})\n`;
      }
    }

    if (pointsContext) {
      prompt += pointsContext;
    }

    prompt += `\nGUIDELINES:
- Answer questions clearly and concisely in the user's language (${locale})
- Use the financial data provided above to give accurate answers
- When discussing money, always format as currency with the ${currencySymbol} symbol and 2 decimal places
- If asked about specific transactions or categories not in the data, politely indicate you can only see the summary data provided
- Provide helpful insights and suggestions when appropriate
- If the user asks about a different time period, remind them you currently only have data for ${monthName}
- For points/miles questions, use the POINTS & MILES data above; recommend using points before expiration and highlight good bonus offers
- Be conversational and friendly, but professional
- Keep responses concise (2-4 sentences unless more detail is specifically requested)`;

    return prompt;
  }

  static async buildRAGContext(userId: string): Promise<RAGFinancialContext> {
    return FinancialAggregatorService.buildRAGContext(userId);
  }

  static async processMessageWithRAG(
    userId: string,
    userMessage: string,
    history: ChatMessage[] = [],
  ): Promise<string> {
    try {
      if (!LLMProviderFactory.isAnyProviderAvailable()) {
        return "I'm sorry, but the AI service is currently unavailable. Please check your configuration.";
      }

      const locale = await getUserLocale();

      const ragContext = await ChatService.buildRAGContext(userId);

      const systemPrompt = ChatService.buildRAGSystemPrompt(ragContext, locale);

      const messages: LLMMessage[] = [
        {
          role: "system",
          content: systemPrompt,
        },
      ];

      const recentHistory = history.slice(-5);
      for (const msg of recentHistory) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }

      const sanitizedMessage = PrivacyService.sanitizeChatMessage({
        content: userMessage,
        role: "user",
      });

      messages.push({
        role: "user",
        content: sanitizedMessage.content,
      });

      const result = await AIServiceWrapper.generateText(
        userId,
        "chat",
        messages,
        {
          temperature: 0.7,
        },
        {
          month: ragContext.currentPeriod.month,
          historyLength: recentHistory.length,
          ragEnabled: true,
        },
      );

      return result.text;
    } catch (error) {
      logger.error("Failed to process chat message with RAG", error as Error);
      throw error;
    }
  }

  private static buildRAGSystemPrompt(
    context: RAGFinancialContext,
    locale: string,
  ): string {
    const languageInstruction =
      locale === "pt-BR"
        ? "You MUST respond in Brazilian Portuguese (pt-BR). All your responses should be in Portuguese."
        : "You should respond in English.";

    const currencySymbol = locale === "pt-BR" ? "R$" : "$";

    const serializedContext = RAGContextSerializerService.serialize(context, {
      locale,
      currencySymbol,
    });

    return `You are a helpful financial assistant. You help users understand their financial situation and answer questions about their spending, income, budgets, goals, and investments.

IMPORTANT LANGUAGE INSTRUCTION:
${languageInstruction}

${serializedContext}

GUIDELINES:
- Answer questions clearly and concisely in the user's language (${locale})
- Use the financial data provided above to give accurate, personalized answers
- When discussing money, always format as currency with the ${currencySymbol} symbol and 2 decimal places
- Reference specific insights, trends, and patterns from the data when relevant
- Proactively highlight important alerts or warnings if they relate to the user's question
- For budget questions, consider historical averages and projections
- For goal questions, provide progress updates and suggestions to stay on track
- For points/miles questions, recommend using points before expiration and highlight good bonus offers
- Be conversational and friendly, but professional
- Keep responses concise (2-4 sentences unless more detail is specifically requested)
- If you don't have enough data to answer a question, explain what data you have access to`;
  }

  static invalidateRAGCache(userId: string): void {
    FinancialAggregatorService.invalidateUserCache(userId);
  }
}
