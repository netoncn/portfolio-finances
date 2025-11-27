import "server-only";
import type { Category } from "@/domain/categories/types/category";
import type { Transaction } from "@/domain/transactions/types/transaction";
import type { CategorySpending, TopSpending } from "../types/insight";

export class SpendingAnalyzerService {
  static calculateCategorySpending(
    transactions: Transaction[],
    _categories: Category[],
  ): Record<string, number> {
    const spending: Record<string, number> = {};

    for (const transaction of transactions) {
      if (transaction.type === "expense" && transaction.categoryId) {
        spending[transaction.categoryId] =
          (spending[transaction.categoryId] || 0) +
          Math.abs(transaction.amount);
      }
    }

    return spending;
  }

  static getTopSpending(
    currentTransactions: Transaction[],
    previousTransactions: Transaction[],
    categories: Category[],
    limit = 5,
  ): TopSpending[] {
    const currentSpending = SpendingAnalyzerService.calculateCategorySpending(
      currentTransactions,
      categories,
    );

    const previousSpending = SpendingAnalyzerService.calculateCategorySpending(
      previousTransactions,
      categories,
    );

    const totalSpending = Object.values(currentSpending).reduce(
      (sum, amount) => sum + amount,
      0,
    );

    const topCategories = Object.entries(currentSpending)
      .map(([categoryId, amount]) => {
        const category = categories.find((c) => c.id === categoryId);
        const previousAmount = previousSpending[categoryId] || 0;
        const change = amount - previousAmount;
        const changePercentage =
          previousAmount > 0 ? (change / previousAmount) * 100 : 0;

        let trend: "up" | "down" | "stable" = "stable";
        if (changePercentage > 10) trend = "up";
        else if (changePercentage < -10) trend = "down";

        return {
          categoryId,
          categoryName: category?.name || "Unknown",
          categoryIcon: category?.icon,
          amount,
          percentage: totalSpending > 0 ? (amount / totalSpending) * 100 : 0,
          transactionCount: currentTransactions.filter(
            (t) => t.categoryId === categoryId && t.type === "expense",
          ).length,
          trend,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);

    return topCategories;
  }

  static analyzeCategorySpending(
    currentTransactions: Transaction[],
    previousTransactions: Transaction[],
    categories: Category[],
  ): CategorySpending[] {
    const currentSpending = SpendingAnalyzerService.calculateCategorySpending(
      currentTransactions,
      categories,
    );

    const previousSpending = SpendingAnalyzerService.calculateCategorySpending(
      previousTransactions,
      categories,
    );

    const analysis: CategorySpending[] = [];

    const allCategoryIds = new Set([
      ...Object.keys(currentSpending),
      ...Object.keys(previousSpending),
    ]);

    for (const categoryId of allCategoryIds) {
      const category = categories.find((c) => c.id === categoryId);
      const currentAmount = currentSpending[categoryId] || 0;
      const previousAmount = previousSpending[categoryId] || 0;
      const variationAmount = currentAmount - previousAmount;
      const variation =
        previousAmount > 0 ? (variationAmount / previousAmount) * 100 : 0;

      const categoryTransactions = currentTransactions.filter(
        (t) => t.categoryId === categoryId && t.type === "expense",
      );

      const transactionCount = categoryTransactions.length;
      const averageTransaction =
        transactionCount > 0 ? currentAmount / transactionCount : 0;

      analysis.push({
        categoryId,
        categoryName: category?.name || "Unknown",
        categoryIcon: category?.icon,
        currentMonth: currentAmount,
        previousMonth: previousAmount,
        variation,
        variationAmount,
        transactionCount,
        averageTransaction,
      });
    }

    return analysis.sort((a, b) => b.currentMonth - a.currentMonth);
  }

  static calculateVariations(
    currentTransactions: Transaction[],
    previousTransactions: Transaction[],
    categories: Category[],
  ): {
    vsLastMonth: {
      total: number;
      percentage: number;
      byCategory: Record<string, number>;
    };
  } {
    const currentTotal = currentTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const previousTotal = previousTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalChange = currentTotal - previousTotal;
    const percentageChange =
      previousTotal > 0 ? (totalChange / previousTotal) * 100 : 0;

    const currentByCategory = SpendingAnalyzerService.calculateCategorySpending(
      currentTransactions,
      categories,
    );
    const previousByCategory =
      SpendingAnalyzerService.calculateCategorySpending(
        previousTransactions,
        categories,
      );

    const byCategoryChanges: Record<string, number> = {};
    const allCategories = new Set([
      ...Object.keys(currentByCategory),
      ...Object.keys(previousByCategory),
    ]);

    for (const categoryId of allCategories) {
      const current = currentByCategory[categoryId] || 0;
      const previous = previousByCategory[categoryId] || 0;
      byCategoryChanges[categoryId] = current - previous;
    }

    return {
      vsLastMonth: {
        total: totalChange,
        percentage: percentageChange,
        byCategory: byCategoryChanges,
      },
    };
  }

  static detectAnomalies(
    transactions: Transaction[],
    categories: Category[],
    thresholdMultiplier = 2.5,
  ): Array<{
    categoryId: string;
    categoryName: string;
    amount: number;
    average: number;
    deviation: number;
  }> {
    const categoryTransactions: Record<string, number[]> = {};

    for (const transaction of transactions) {
      if (transaction.type === "expense" && transaction.categoryId) {
        if (!categoryTransactions[transaction.categoryId]) {
          categoryTransactions[transaction.categoryId] = [];
        }
        categoryTransactions[transaction.categoryId].push(
          Math.abs(transaction.amount),
        );
      }
    }

    const anomalies: Array<{
      categoryId: string;
      categoryName: string;
      amount: number;
      average: number;
      deviation: number;
    }> = [];

    for (const [categoryId, amounts] of Object.entries(categoryTransactions)) {
      if (amounts.length < 3) continue;

      const average = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
      const variance =
        amounts.reduce((sum, a) => sum + (a - average) ** 2, 0) /
        amounts.length;
      const stdDev = Math.sqrt(variance);

      const threshold = average + stdDev * thresholdMultiplier;
      const anomalousAmounts = amounts.filter((a) => a > threshold);

      if (anomalousAmounts.length > 0) {
        const category = categories.find((c) => c.id === categoryId);
        const maxAmount = Math.max(...anomalousAmounts);

        anomalies.push({
          categoryId,
          categoryName: category?.name || "Unknown",
          amount: maxAmount,
          average,
          deviation: ((maxAmount - average) / average) * 100,
        });
      }
    }

    return anomalies.sort((a, b) => b.deviation - a.deviation);
  }

  static calculateSavingsRate(transactions: Transaction[]): {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    savingsRate: number;
  } {
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpenses,
      netBalance,
      savingsRate,
    };
  }
}
