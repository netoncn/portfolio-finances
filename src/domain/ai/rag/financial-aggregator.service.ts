import "server-only";

import { AccountService } from "@/domain/accounts/services/account.service";
import type { Account } from "@/domain/accounts/types/account";
import { BudgetService } from "@/domain/budgets/services/budget.service";
import { CategoryService } from "@/domain/categories/services/category.service";
import { GoalService } from "@/domain/goals/services/goal.service";
import type { Goal } from "@/domain/goals/types/goal";
import { PointsContextService } from "@/domain/points/ai";
import { TransactionService } from "@/domain/transactions/services/transaction.service";
import type { Transaction } from "@/domain/transactions/types/transaction";
import { serverCache } from "@/lib/cache/memory-cache";
import type {
  AccountContext,
  BudgetContext,
  CategoryAggregate,
  FinancialInsight,
  GoalContext,
  MerchantAggregate,
  MonthlyAggregate,
  RAGFinancialContext,
  SpendingAlert,
} from "./rag.types";
import { RAGCacheKeys, RAGCacheTTL } from "./rag.types";

function getMonthKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthRange(monthKey: string): { start: number; end: number } {
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(year, month - 1, 1).getTime();
  const end = new Date(year, month, 0, 23, 59, 59, 999).getTime();
  return { start, end };
}

function calculateTrend(
  current: number,
  previous: number,
): { direction: "up" | "down" | "stable"; percent: number } {
  if (previous === 0) {
    return { direction: current > 0 ? "up" : "stable", percent: 0 };
  }
  const percent = ((current - previous) / previous) * 100;
  if (percent > 5) return { direction: "up", percent };
  if (percent < -5) return { direction: "down", percent };
  return { direction: "stable", percent };
}

export class FinancialAggregatorService {
  static async buildRAGContext(userId: string): Promise<RAGFinancialContext> {
    const cached = serverCache.get<RAGFinancialContext>(
      RAGCacheKeys.fullContext(userId),
    );
    if (cached) {
      return cached;
    }

    const now = Date.now();
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;
    const currentMonth = getMonthKey(now);

    const [transactions, categories, budgets, accounts, goals, pointsContext] =
      await Promise.all([
        TransactionService.listByDateRange(userId, ninetyDaysAgo, now),
        CategoryService.listByUser(userId),
        BudgetService.listActiveByUser(userId).catch(() => []),
        AccountService.listByUser(userId).catch(() => []),
        GoalService.listActiveByUser(userId).catch(() => []),
        PointsContextService.buildPointsContext(userId).catch(() => undefined),
      ]);

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const monthlyData =
      FinancialAggregatorService.buildMonthlyAggregates(transactions);

    const currentPeriod = FinancialAggregatorService.buildCurrentPeriod(
      transactions,
      currentMonth,
    );

    const historicalSummary =
      FinancialAggregatorService.buildHistoricalSummary(monthlyData);

    const { topCategories, categoryTrends } =
      FinancialAggregatorService.buildCategoryAggregates(
        transactions,
        categoryMap,
        currentMonth,
      );

    const { topMerchants, frequentTransactions } =
      FinancialAggregatorService.buildMerchantAggregates(
        transactions,
        categoryMap,
      );

    const { budgetContexts, budgetSummary } =
      await FinancialAggregatorService.buildBudgetContext(
        budgets,
        transactions,
        categoryMap,
      );

    const { accountContexts, accountsSummary } =
      FinancialAggregatorService.buildAccountContext(accounts, transactions);

    const { goalContexts, goalsSummary } =
      FinancialAggregatorService.buildGoalContext(goals);

    const insights = FinancialAggregatorService.generateInsights(
      currentPeriod,
      historicalSummary,
      topCategories,
      budgetContexts,
    );

    const alerts = FinancialAggregatorService.generateAlerts(
      budgetContexts,
      transactions,
      categoryMap,
    );

    const context: RAGFinancialContext = {
      userId,
      generatedAt: now,
      dataRange: {
        start: ninetyDaysAgo,
        end: now,
        label: "Últimos 90 dias",
      },
      currentPeriod,
      historicalSummary,
      topCategories,
      categoryTrends,
      topMerchants,
      frequentTransactions,
      budgets: budgetContexts,
      budgetSummary,
      goals: goalContexts,
      goalsSummary,
      accounts: accountContexts,
      accountsSummary,
      insights,
      alerts,
      pointsContext,
    };

    serverCache.set(
      RAGCacheKeys.fullContext(userId),
      context,
      RAGCacheTTL.fullContext,
    );

    return context;
  }

  private static buildMonthlyAggregates(
    transactions: Transaction[],
  ): MonthlyAggregate[] {
    const monthlyMap = new Map<
      string,
      { income: number; expenses: number; count: number }
    >();

    for (const tx of transactions) {
      const monthKey = getMonthKey(tx.date);
      const existing = monthlyMap.get(monthKey) || {
        income: 0,
        expenses: 0,
        count: 0,
      };

      if (tx.type === "income") {
        existing.income += Math.abs(tx.amount);
      } else if (tx.type === "expense") {
        existing.expenses += Math.abs(tx.amount);
      }
      existing.count += 1;

      monthlyMap.set(monthKey, existing);
    }

    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        netBalance: data.income - data.expenses,
        savingsRate:
          data.income > 0
            ? ((data.income - data.expenses) / data.income) * 100
            : 0,
        transactionCount: data.count,
      }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }

  private static buildCurrentPeriod(
    transactions: Transaction[],
    currentMonth: string,
  ): RAGFinancialContext["currentPeriod"] {
    const { start, end } = getMonthRange(currentMonth);
    const monthTransactions = transactions.filter(
      (t) => t.date >= start && t.date <= end,
    );

    const income = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const expenses = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netBalance = income - expenses;
    const savingsRate = income > 0 ? (netBalance / income) * 100 : 0;

    return {
      month: currentMonth,
      income,
      expenses,
      netBalance,
      savingsRate,
      transactionCount: monthTransactions.length,
    };
  }

  private static buildHistoricalSummary(
    monthlyData: MonthlyAggregate[],
  ): RAGFinancialContext["historicalSummary"] {
    if (monthlyData.length === 0) {
      return {
        avgMonthlyIncome: 0,
        avgMonthlyExpenses: 0,
        avgSavingsRate: 0,
        incomeStability: "stable",
        expensesTrend: "stable",
        monthlyData,
      };
    }

    const avgMonthlyIncome =
      monthlyData.reduce((sum, m) => sum + m.income, 0) / monthlyData.length;
    const avgMonthlyExpenses =
      monthlyData.reduce((sum, m) => sum + m.expenses, 0) / monthlyData.length;
    const avgSavingsRate =
      monthlyData.reduce((sum, m) => sum + m.savingsRate, 0) /
      monthlyData.length;

    const incomeStdDev = FinancialAggregatorService.calculateStdDev(
      monthlyData.map((m) => m.income),
    );
    const incomeCoeffVar =
      avgMonthlyIncome > 0 ? (incomeStdDev / avgMonthlyIncome) * 100 : 0;

    let incomeStability: "stable" | "variable" | "growing" | "declining";
    if (monthlyData.length >= 2) {
      const recentIncome = monthlyData.slice(
        0,
        Math.ceil(monthlyData.length / 2),
      );
      const olderIncome = monthlyData.slice(Math.ceil(monthlyData.length / 2));
      const recentAvg =
        recentIncome.reduce((s, m) => s + m.income, 0) / recentIncome.length;
      const olderAvg =
        olderIncome.reduce((s, m) => s + m.income, 0) / olderIncome.length;

      if (recentAvg > olderAvg * 1.1) incomeStability = "growing";
      else if (recentAvg < olderAvg * 0.9) incomeStability = "declining";
      else if (incomeCoeffVar > 30) incomeStability = "variable";
      else incomeStability = "stable";
    } else {
      incomeStability = "stable";
    }

    let expensesTrend: "increasing" | "decreasing" | "stable" = "stable";
    if (monthlyData.length >= 2) {
      const recentExpenses = monthlyData.slice(
        0,
        Math.ceil(monthlyData.length / 2),
      );
      const olderExpenses = monthlyData.slice(
        Math.ceil(monthlyData.length / 2),
      );
      const recentAvg =
        recentExpenses.reduce((s, m) => s + m.expenses, 0) /
        recentExpenses.length;
      const olderAvg =
        olderExpenses.reduce((s, m) => s + m.expenses, 0) /
        olderExpenses.length;

      if (recentAvg > olderAvg * 1.1) expensesTrend = "increasing";
      else if (recentAvg < olderAvg * 0.9) expensesTrend = "decreasing";
    }

    return {
      avgMonthlyIncome,
      avgMonthlyExpenses,
      avgSavingsRate,
      incomeStability,
      expensesTrend,
      monthlyData,
    };
  }

  private static buildCategoryAggregates(
    transactions: Transaction[],
    categoryMap: Map<string, string>,
    currentMonth: string,
  ): {
    topCategories: CategoryAggregate[];
    categoryTrends: RAGFinancialContext["categoryTrends"];
  } {
    const expenses = transactions.filter((t) => t.type === "expense");
    const totalExpenses = expenses.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0,
    );

    const { start: currentStart, end: currentEnd } =
      getMonthRange(currentMonth);

    const prevMonth = new Date(currentStart);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevMonthKey = getMonthKey(prevMonth.getTime());
    const { start: prevStart, end: prevEnd } = getMonthRange(prevMonthKey);

    const categoryData = new Map<
      string,
      { total: number; count: number; current: number; previous: number }
    >();

    for (const tx of expenses) {
      const categoryId = tx.categoryId || "uncategorized";
      const existing = categoryData.get(categoryId) || {
        total: 0,
        count: 0,
        current: 0,
        previous: 0,
      };

      existing.total += Math.abs(tx.amount);
      existing.count += 1;

      if (tx.date >= currentStart && tx.date <= currentEnd) {
        existing.current += Math.abs(tx.amount);
      } else if (tx.date >= prevStart && tx.date <= prevEnd) {
        existing.previous += Math.abs(tx.amount);
      }

      categoryData.set(categoryId, existing);
    }

    const topCategories: CategoryAggregate[] = Array.from(
      categoryData.entries(),
    )
      .map(([categoryId, data]) => {
        const trend = calculateTrend(data.current, data.previous);
        return {
          categoryId,
          categoryName: categoryMap.get(categoryId) || "Sem categoria",
          totalSpent: data.total,
          transactionCount: data.count,
          avgTransaction: data.count > 0 ? data.total / data.count : 0,
          percentOfTotal:
            totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
          trend: trend.direction,
          trendPercent: trend.percent,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    const categoryTrends = Array.from(categoryData.entries())
      .filter(([_, data]) => data.current > 0 || data.previous > 0)
      .map(([categoryId, data]) => ({
        categoryName: categoryMap.get(categoryId) || "Sem categoria",
        currentMonth: data.current,
        previousMonth: data.previous,
        change: data.current - data.previous,
        changePercent:
          data.previous > 0
            ? ((data.current - data.previous) / data.previous) * 100
            : 0,
      }))
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 5);

    return { topCategories, categoryTrends };
  }

  private static buildMerchantAggregates(
    transactions: Transaction[],
    categoryMap: Map<string, string>,
  ): {
    topMerchants: MerchantAggregate[];
    frequentTransactions: RAGFinancialContext["frequentTransactions"];
  } {
    const expenses = transactions.filter((t) => t.type === "expense");

    const merchantData = new Map<
      string,
      { total: number; count: number; categoryId?: string; lastDate: number }
    >();

    for (const tx of expenses) {
      const merchant = tx.merchant || tx.description || "Desconhecido";
      const existing = merchantData.get(merchant) || {
        total: 0,
        count: 0,
        categoryId: tx.categoryId,
        lastDate: 0,
      };

      existing.total += Math.abs(tx.amount);
      existing.count += 1;
      existing.lastDate = Math.max(existing.lastDate, tx.date);

      merchantData.set(merchant, existing);
    }

    const topMerchants: MerchantAggregate[] = Array.from(merchantData.entries())
      .map(([merchant, data]) => ({
        merchant,
        totalSpent: data.total,
        transactionCount: data.count,
        avgTransaction: data.count > 0 ? data.total / data.count : 0,
        categoryName: data.categoryId
          ? categoryMap.get(data.categoryId)
          : undefined,
        lastTransaction: data.lastDate,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    const descriptionCounts = new Map<
      string,
      { amount: number; count: number; categoryId?: string }
    >();

    for (const tx of expenses) {
      const key = `${tx.description}:${Math.round(tx.amount / 1000) * 1000}`; // Group similar amounts
      const existing = descriptionCounts.get(key) || {
        amount: Math.abs(tx.amount),
        count: 0,
        categoryId: tx.categoryId,
      };
      existing.count += 1;
      descriptionCounts.set(key, existing);
    }

    const frequentTransactions = Array.from(descriptionCounts.entries())
      .filter(([_, data]) => data.count >= 2) // At least 2 occurrences
      .map(([key, data]) => ({
        description: key.split(":")[0],
        amount: data.amount,
        frequency: data.count,
        categoryName: data.categoryId
          ? categoryMap.get(data.categoryId)
          : undefined,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    return { topMerchants, frequentTransactions };
  }

  private static async buildBudgetContext(
    budgets: Awaited<ReturnType<typeof BudgetService.listActiveByUser>>,
    transactions: Transaction[],
    categoryMap: Map<string, string>,
  ): Promise<{
    budgetContexts: BudgetContext[];
    budgetSummary: RAGFinancialContext["budgetSummary"];
  }> {
    const now = new Date();
    const currentMonth = getMonthKey(now.getTime());
    const { start, end } = getMonthRange(currentMonth);

    const monthExpenses = transactions.filter(
      (t) => t.type === "expense" && t.date >= start && t.date <= end,
    );

    const categorySpending = new Map<string, number>();
    for (const tx of monthExpenses) {
      if (tx.categoryId) {
        const current = categorySpending.get(tx.categoryId) || 0;
        categorySpending.set(tx.categoryId, current + Math.abs(tx.amount));
      }
    }

    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    const daysRemaining = daysInMonth - now.getDate();
    const daysElapsed = daysInMonth - daysRemaining;

    const budgetContexts: BudgetContext[] = budgets.map((budget) => {
      const spent = budget.categoryIds.reduce(
        (sum, catId) => sum + (categorySpending.get(catId) || 0),
        0,
      );
      const remaining = budget.amount - spent;
      const percentUsed = (spent / budget.amount) * 100;

      const dailyRate = daysElapsed > 0 ? spent / daysElapsed : 0;
      const projectedTotal = dailyRate * daysInMonth;

      let status: "on_track" | "warning" | "exceeded";
      if (percentUsed >= 100) status = "exceeded";
      else if (percentUsed >= 80) status = "warning";
      else status = "on_track";

      return {
        budgetId: budget.id,
        name: budget.name,
        limit: budget.amount,
        spent,
        remaining,
        percentUsed,
        status,
        daysRemaining,
        projectedTotal,
        categories: budget.categoryIds.map(
          (id) => categoryMap.get(id) || "Unknown",
        ),
        historicalAvg: spent, // Simplified - could calculate from historical data
      };
    });

    const totalBudgeted = budgetContexts.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = budgetContexts.reduce((sum, b) => sum + b.spent, 0);
    const exceededCount = budgetContexts.filter(
      (b) => b.status === "exceeded",
    ).length;
    const warningCount = budgetContexts.filter(
      (b) => b.status === "warning",
    ).length;

    let overallStatus: "on_track" | "warning" | "exceeded";
    if (exceededCount > 0) overallStatus = "exceeded";
    else if (warningCount > 0) overallStatus = "warning";
    else overallStatus = "on_track";

    return {
      budgetContexts,
      budgetSummary: {
        totalBudgeted,
        totalSpent,
        overallStatus,
        exceededCount,
        warningCount,
      },
    };
  }

  private static buildAccountContext(
    accounts: Account[],
    transactions: Transaction[],
  ): {
    accountContexts: AccountContext[];
    accountsSummary: RAGFinancialContext["accountsSummary"];
  } {
    const now = new Date();
    const currentMonth = getMonthKey(now.getTime());
    const { start, end } = getMonthRange(currentMonth);

    const monthTransactions = transactions.filter(
      (t) => t.date >= start && t.date <= end,
    );

    const accountContexts: AccountContext[] = accounts.map((account) => {
      const accountTx = monthTransactions.filter(
        (t) => t.accountId === account.id,
      );
      const income = accountTx
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const expenses = accountTx
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const context: AccountContext = {
        accountId: account.id,
        name: account.name,
        type: account.accountType,
        typeLabel: FinancialAggregatorService.getAccountTypeLabel(
          account.accountType,
        ),
        monthlyIncome: income,
        monthlyExpenses: expenses,
        transactionCount: accountTx.length,
      };

      if (account.accountType === "card_credit" && account.billing) {
        const creditLimit = account.billing.creditLimit || 0;
        const availableCredit = account.billing.availableCredit || creditLimit;
        const currentBalance = creditLimit - availableCredit;

        context.creditLimit = creditLimit;
        context.currentBalance = currentBalance;
        context.availableCredit = availableCredit;
        context.utilizationPercent =
          creditLimit > 0 ? (currentBalance / creditLimit) * 100 : 0;
      }

      return context;
    });

    const creditCards = accountContexts.filter(
      (a) => a.creditLimit !== undefined,
    );
    const totalCreditLimit = creditCards.reduce(
      (sum, a) => sum + (a.creditLimit || 0),
      0,
    );
    const totalCreditUsed = creditCards.reduce(
      (sum, a) => sum + (a.currentBalance || 0),
      0,
    );
    const avgUtilization =
      totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0;

    return {
      accountContexts,
      accountsSummary: {
        totalAccounts: accounts.length,
        totalCreditLimit,
        totalCreditUsed,
        avgUtilization,
      },
    };
  }

  private static buildGoalContext(goals: Goal[]): {
    goalContexts: GoalContext[];
    goalsSummary: RAGFinancialContext["goalsSummary"];
  } {
    const now = Date.now();

    const goalContexts: GoalContext[] = goals.map((goal) => {
      const remainingAmount = goal.targetAmount - goal.currentAmount;
      const progressPercent = (goal.currentAmount / goal.targetAmount) * 100;

      let status: "on_track" | "behind" | "ahead" | "completed" = "on_track";
      if (goal.status === "completed") {
        status = "completed";
      } else if (goal.targetDate) {
        const totalDuration = goal.targetDate - goal.startDate;
        const elapsedDuration = now - goal.startDate;
        const expectedProgress = (elapsedDuration / totalDuration) * 100;

        if (progressPercent >= 100) {
          status = "completed";
        } else if (progressPercent >= expectedProgress + 10) {
          status = "ahead";
        } else if (progressPercent < expectedProgress - 10) {
          status = "behind";
        }
      }

      let monthlyTarget = 0;
      let daysRemaining: number | undefined;
      if (goal.targetDate && goal.targetDate > now) {
        daysRemaining = Math.ceil(
          (goal.targetDate - now) / (24 * 60 * 60 * 1000),
        );
        const monthsRemaining = daysRemaining / 30;
        monthlyTarget =
          monthsRemaining > 0
            ? remainingAmount / monthsRemaining
            : remainingAmount;
      }

      const monthsElapsed = Math.max(
        1,
        (now - goal.startDate) / (30 * 24 * 60 * 60 * 1000),
      );
      const currentMonthlyAvg = goal.currentAmount / monthsElapsed;

      return {
        goalId: goal.id,
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        remainingAmount,
        progressPercent,
        status,
        deadline: goal.targetDate
          ? new Date(goal.targetDate).toISOString().split("T")[0]
          : undefined,
        daysRemaining,
        monthlyTarget,
        currentMonthlyAvg,
      };
    });

    const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSavedAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const overallProgress =
      totalTargetAmount > 0 ? (totalSavedAmount / totalTargetAmount) * 100 : 0;
    const onTrackCount = goalContexts.filter(
      (g) => g.status === "on_track" || g.status === "ahead",
    ).length;
    const behindCount = goalContexts.filter(
      (g) => g.status === "behind",
    ).length;

    return {
      goalContexts,
      goalsSummary: {
        totalTargetAmount,
        totalSavedAmount,
        overallProgress,
        onTrackCount,
        behindCount,
      },
    };
  }

  private static generateInsights(
    currentPeriod: RAGFinancialContext["currentPeriod"],
    historicalSummary: RAGFinancialContext["historicalSummary"],
    topCategories: CategoryAggregate[],
    budgets: BudgetContext[],
  ): FinancialInsight[] {
    const insights: FinancialInsight[] = [];

    if (currentPeriod.savingsRate > 20) {
      insights.push({
        type: "achievement",
        priority: "medium",
        category: "savings",
        title: "Ótima taxa de economia",
        description: `Você está economizando ${currentPeriod.savingsRate.toFixed(1)}% da sua renda este mês.`,
      });
    } else if (currentPeriod.savingsRate < 0) {
      insights.push({
        type: "warning",
        priority: "high",
        category: "savings",
        title: "Gastos excedem receita",
        description: "Seus gastos estão maiores que sua receita este mês.",
      });
    }

    if (historicalSummary.expensesTrend === "increasing") {
      insights.push({
        type: "trend",
        priority: "medium",
        category: "expenses",
        title: "Gastos em alta",
        description: "Seus gastos têm aumentado nos últimos meses.",
      });
    } else if (historicalSummary.expensesTrend === "decreasing") {
      insights.push({
        type: "achievement",
        priority: "low",
        category: "expenses",
        title: "Gastos em queda",
        description: "Parabéns! Seus gastos têm diminuído nos últimos meses.",
      });
    }

    for (const cat of topCategories.slice(0, 3)) {
      if (cat.trend === "up" && cat.trendPercent > 20) {
        insights.push({
          type: "trend",
          priority: "medium",
          category: "category",
          title: `Aumento em ${cat.categoryName}`,
          description: `Gastos com ${cat.categoryName} aumentaram ${cat.trendPercent.toFixed(0)}% este mês.`,
          data: { categoryId: cat.categoryId, percent: cat.trendPercent },
        });
      }
    }

    const exceededBudgets = budgets.filter((b) => b.status === "exceeded");
    if (exceededBudgets.length > 0) {
      insights.push({
        type: "warning",
        priority: "high",
        category: "budget",
        title: `${exceededBudgets.length} orçamento(s) excedido(s)`,
        description: `Os orçamentos ${exceededBudgets.map((b) => b.name).join(", ")} foram excedidos.`,
      });
    }

    return insights;
  }

  private static generateAlerts(
    budgets: BudgetContext[],
    transactions: Transaction[],
    categoryMap: Map<string, string>,
  ): SpendingAlert[] {
    const alerts: SpendingAlert[] = [];

    for (const budget of budgets) {
      if (budget.status === "exceeded") {
        alerts.push({
          type: "budget_exceeded",
          severity: "critical",
          message: `Orçamento "${budget.name}" excedido em ${((budget.spent - budget.limit) / 100).toFixed(2)}`,
          amount: budget.spent - budget.limit,
        });
      } else if (budget.status === "warning") {
        alerts.push({
          type: "budget_exceeded",
          severity: "warning",
          message: `Orçamento "${budget.name}" está em ${budget.percentUsed.toFixed(0)}% do limite`,
          amount: budget.remaining,
        });
      }
    }

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentExpenses = transactions
      .filter((t) => t.type === "expense" && t.date >= sevenDaysAgo)
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

    for (const tx of recentExpenses.slice(0, 3)) {
      if (Math.abs(tx.amount) >= 50000) {
        // 500 reais in centavos
        alerts.push({
          type: "large_transaction",
          severity: "info",
          message: `Transação grande: ${tx.description}`,
          amount: Math.abs(tx.amount),
          categoryName: tx.categoryId
            ? categoryMap.get(tx.categoryId)
            : undefined,
          date: new Date(tx.date).toISOString(),
        });
      }
    }

    return alerts;
  }

  private static calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map((value) => (value - avg) ** 2);
    const avgSquareDiff =
      squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  }

  private static getAccountTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      card_credit: "Cartão de Crédito",
      card_debit: "Cartão de Débito",
      prepaid: "Pré-pago",
      wallet_cash: "Dinheiro",
      bank_checking: "Conta Corrente",
      bank_savings: "Poupança",
    };
    return labels[type] || type;
  }

  static invalidateUserCache(userId: string): number {
    return serverCache.deletePattern(RAGCacheKeys.userPattern(userId));
  }
}
