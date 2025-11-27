import "server-only";
import { BudgetService } from "@/domain/budgets/services/budget.service";
import type { Budget } from "@/domain/budgets/types/budget";
import { CategoryService } from "@/domain/categories/services/category.service";
import { TransactionService } from "@/domain/transactions/services/transaction.service";
import type { Transaction } from "@/domain/transactions/types/transaction";
import { logger } from "@/lib/logger";
import { getUserLocale } from "@/services/locale";
import type {
  AIInsightContext,
  Alert,
  CategorySpending,
  Insight,
  InsightGenerationRequest,
  MonthlyInsights,
  TopSpending,
} from "../types/insight";
import { AIInsightsService } from "./ai-insights.service";
import { SpendingAnalyzerService } from "./spending-analyzer.service";

export class InsightsService {
  static async generateMonthlyInsights(
    request: InsightGenerationRequest,
  ): Promise<MonthlyInsights> {
    const { userId, month, includeAI = true } = request;

    try {
      // Parse month (YYYY-MM)
      const [year, monthNum] = month.split("-").map(Number);
      const periodStart = new Date(year, monthNum - 1, 1).getTime();
      const periodEnd = new Date(year, monthNum, 0, 23, 59, 59, 999).getTime();

      const prevMonthStart = new Date(year, monthNum - 2, 1).getTime();
      const prevMonthEnd = new Date(
        year,
        monthNum - 1,
        0,
        23,
        59,
        59,
        999,
      ).getTime();

      const [currentTransactions, previousTransactions, categories, budgets] =
        await Promise.all([
          TransactionService.listByUser(userId),
          TransactionService.listByUser(userId),
          CategoryService.listByUser(userId),
          BudgetService.listByUser(userId).catch(() => []),
        ]);

      const currentPeriodTxs = currentTransactions.filter(
        (t) => t.date >= periodStart && t.date <= periodEnd,
      );

      const previousPeriodTxs = previousTransactions.filter(
        (t) => t.date >= prevMonthStart && t.date <= prevMonthEnd,
      );

      const summary =
        SpendingAnalyzerService.calculateSavingsRate(currentPeriodTxs);

      const topSpending = SpendingAnalyzerService.getTopSpending(
        currentPeriodTxs,
        previousPeriodTxs,
        categories,
        5,
      );

      const categoryBreakdown = SpendingAnalyzerService.analyzeCategorySpending(
        currentPeriodTxs,
        previousPeriodTxs,
        categories,
      );

      const variations = SpendingAnalyzerService.calculateVariations(
        currentPeriodTxs,
        previousPeriodTxs,
        categories,
      );

      const vsAverage = InsightsService.calculateAverageComparison(
        currentTransactions,
        periodStart,
        periodEnd,
      );

      const alerts = await InsightsService.generateAlerts(
        userId,
        month,
        currentPeriodTxs,
        budgets,
        categoryBreakdown,
      );

      let insights: Insight[] = [];
      if (includeAI) {
        const aiContext = InsightsService.buildAIContext(
          summary,
          SpendingAnalyzerService.calculateSavingsRate(previousPeriodTxs),
          topSpending,
          categoryBreakdown,
          budgets,
          month,
        );

        const aiInsights = await AIInsightsService.generateInsights(
          userId,
          month,
          aiContext,
        );

        insights = aiInsights.map((insight, index) => ({
          id: `insight-${month}-${index}`,
          userId,
          month,
          type: insight.type,
          severity: insight.severity,
          title: insight.title,
          description: insight.description,
          actionable: insight.actionable,
          actionText: insight.actionText,
          dismissed: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }));
      }

      return {
        userId,
        month,
        period: {
          start: periodStart,
          end: periodEnd,
        },
        summary: {
          ...summary,
          transactionCount: currentPeriodTxs.length,
        },
        topSpending,
        categoryBreakdown,
        variations: {
          ...variations,
          vsAverage,
        },
        insights,
        alerts,
        generatedAt: Date.now(),
      };
    } catch (error) {
      logger.error("Failed to generate monthly insights", error as Error);
      throw error;
    }
  }

  private static calculateAverageComparison(
    allTransactions: Transaction[],
    currentPeriodStart: number,
    currentPeriodEnd: number,
  ): {
    total: number;
    percentage: number;
  } {
    const currentExpenses = allTransactions
      .filter(
        (t) =>
          t.type === "expense" &&
          t.date >= currentPeriodStart &&
          t.date <= currentPeriodEnd,
      )
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const sixMonthsAgo = new Date(currentPeriodStart);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const historicalExpenses = allTransactions.filter(
      (t) =>
        t.type === "expense" &&
        t.date >= sixMonthsAgo.getTime() &&
        t.date < currentPeriodStart,
    );

    const monthlyTotals: number[] = [];
    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(currentPeriodStart);
      monthStart.setMonth(monthStart.getMonth() - (i + 1));
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);

      const monthTotal = historicalExpenses
        .filter(
          (t) => t.date >= monthStart.getTime() && t.date <= monthEnd.getTime(),
        )
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      if (monthTotal > 0) {
        monthlyTotals.push(monthTotal);
      }
    }

    const averageExpenses =
      monthlyTotals.length > 0
        ? monthlyTotals.reduce((sum, t) => sum + t, 0) / monthlyTotals.length
        : 0;

    const difference = currentExpenses - averageExpenses;
    const percentage =
      averageExpenses > 0 ? (difference / averageExpenses) * 100 : 0;

    return {
      total: difference,
      percentage,
    };
  }

  private static buildAIContext(
    currentMonth: ReturnType<
      typeof SpendingAnalyzerService.calculateSavingsRate
    >,
    previousMonth: ReturnType<
      typeof SpendingAnalyzerService.calculateSavingsRate
    >,
    topCategories: TopSpending[],
    categoryBreakdown: CategorySpending[],
    budgets: Budget[],
    _month: string,
  ): AIInsightContext {
    // Get significant changes (>20% variation)
    const significantChanges = categoryBreakdown
      .filter((cat) => Math.abs(cat.variation) > 20 && cat.previousMonth > 0)
      .map((cat) => ({
        category: cat.categoryName,
        change: cat.variationAmount,
        changePercentage: cat.variation,
      }))
      .slice(0, 5);

    const budgetContext = budgets
      .filter((b) => b.period === "monthly") // Filter monthly budgets
      .map((b) => {
        const totalSpent = categoryBreakdown
          .filter((cat) => b.categoryIds.includes(cat.categoryId))
          .reduce((sum, cat) => sum + cat.currentMonth, 0);

        return {
          category: b.name,
          spent: totalSpent,
          limit: b.amount,
          percentage: (totalSpent / b.amount) * 100,
        };
      });

    return {
      currentMonth,
      previousMonth,
      topCategories: topCategories.map((cat) => ({
        name: cat.categoryName,
        amount: cat.amount,
        percentage: cat.percentage,
      })),
      significantChanges,
      budgets: budgetContext,
    };
  }

  private static async generateAlerts(
    userId: string,
    month: string,
    transactions: Transaction[],
    budgets: Budget[],
    categoryBreakdown: CategorySpending[],
  ): Promise<Alert[]> {
    const alerts: Alert[] = [];

    const locale = await getUserLocale();
    const currencySymbol = locale === "pt-BR" ? "R$" : "$";

    // Budget alerts
    for (const budget of budgets.filter((b) => b.period === "monthly")) {
      const totalSpent = categoryBreakdown
        .filter((cat) => budget.categoryIds.includes(cat.categoryId))
        .reduce((sum, cat) => sum + cat.currentMonth, 0);

      const percentage = (totalSpent / budget.amount) * 100;

      if (percentage >= 100) {
        const title =
          locale === "pt-BR"
            ? `Orçamento de ${budget.name} Excedido`
            : `${budget.name} Budget Exceeded`;
        const message =
          locale === "pt-BR"
            ? `Você gastou ${currencySymbol}${(totalSpent / 100).toFixed(2)} de ${currencySymbol}${(budget.amount / 100).toFixed(2)} do orçamento (${percentage.toFixed(0)}%)`
            : `You've spent ${currencySymbol}${(totalSpent / 100).toFixed(2)} of your ${currencySymbol}${(budget.amount / 100).toFixed(2)} budget (${percentage.toFixed(0)}%)`;

        alerts.push({
          id: `alert-budget-${budget.id}`,
          userId,
          month,
          type: "budget_exceeded",
          severity: "alert",
          title,
          message,
          budgetId: budget.id,
          threshold: budget.amount,
          currentValue: totalSpent,
          acknowledged: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      } else if (percentage >= 80) {
        const title =
          locale === "pt-BR"
            ? `Alerta de Orçamento de ${budget.name}`
            : `${budget.name} Budget Alert`;
        const message =
          locale === "pt-BR"
            ? `Você usou ${percentage.toFixed(0)}% do seu orçamento`
            : `You've used ${percentage.toFixed(0)}% of your budget`;

        alerts.push({
          id: `alert-budget-warning-${budget.id}`,
          userId,
          month,
          type: "budget_exceeded",
          severity: "warning",
          title,
          message,
          budgetId: budget.id,
          threshold: budget.amount,
          currentValue: totalSpent,
          acknowledged: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    // Detect large transactions (>$500 or >R$500, which is 50000 cents)
    const largeThreshold = 50000; // 500 in currency (50000 cents)
    const largeTransactions = transactions.filter(
      (t) => t.type === "expense" && Math.abs(t.amount) > largeThreshold,
    );

    if (largeTransactions.length > 0) {
      const largest = largeTransactions.reduce((max, t) =>
        Math.abs(t.amount) > Math.abs(max.amount) ? t : max,
      );

      const categoryName =
        categoryBreakdown.find((c) => c.categoryId === largest.categoryId)
          ?.categoryName || (locale === "pt-BR" ? "Desconhecido" : "Unknown");

      const title =
        locale === "pt-BR"
          ? "Grande Transação Detectada"
          : "Large Transaction Detected";

      const message =
        locale === "pt-BR"
          ? `Uma transação de ${currencySymbol}${(Math.abs(largest.amount) / 100).toFixed(2)} foi registrada em ${categoryName}`
          : `A transaction of ${currencySymbol}${(Math.abs(largest.amount) / 100).toFixed(2)} was recorded in ${categoryName}`;

      alerts.push({
        id: `alert-large-tx-${largest.id}`,
        userId,
        month,
        type: "large_transaction",
        severity: "info",
        title,
        message,
        transactionId: largest.id,
        currentValue: Math.abs(largest.amount),
        acknowledged: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Detect unusual spending patterns (>50% increase)
    const unusualSpending = categoryBreakdown.filter(
      (cat) => cat.variation > 50 && cat.previousMonth > 0,
    );

    for (const category of unusualSpending.slice(0, 2)) {
      const title =
        locale === "pt-BR"
          ? `Gastos Incomuns em ${category.categoryName}`
          : `Unusual ${category.categoryName} Spending`;

      const message =
        locale === "pt-BR"
          ? `Seus gastos em ${category.categoryName} aumentaram ${category.variation.toFixed(0)}% este mês`
          : `Your ${category.categoryName} spending increased by ${category.variation.toFixed(0)}% this month`;

      alerts.push({
        id: `alert-unusual-${category.categoryId}`,
        userId,
        month,
        type: "unusual_spending",
        severity: "warning",
        title,
        message,
        categoryId: category.categoryId,
        threshold: category.previousMonth,
        currentValue: category.currentMonth,
        acknowledged: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return alerts;
  }
}
