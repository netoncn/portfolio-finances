import "server-only";
import { BudgetService } from "@/domain/budgets/services/budget.service";
import type { Category } from "@/domain/categories/types/category";
import { TransactionService } from "@/domain/transactions/services/transaction.service";
import { CacheKeys, serverCache } from "@/lib/cache/memory-cache";
import type {
  BudgetOverview,
  CategoryChartData,
  DashboardKPIs,
  TrendDataPoint,
  UpcomingInstallment,
} from "../types/dashboard-kpis";

// Predefined color palette for categories
const CHART_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#6366f1", // indigo
  "#84cc16", // lime
];

export class DashboardKPIsService {
  static async calculateBudgetOverview(
    userId: string,
  ): Promise<BudgetOverview> {
    const budgets = await BudgetService.listByUser(userId);
    const activeBudgets = budgets.filter((b) => b.status === "active");

    const totalBudgeted = activeBudgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = activeBudgets.reduce((sum, b) => sum + b.spent, 0);

    const percentageUsed =
      totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

    const overBudgetCount = activeBudgets.filter(
      (b) => b.spent > b.amount,
    ).length;

    const nearLimitCount = activeBudgets.filter((b) => {
      const usage = b.amount > 0 ? (b.spent / b.amount) * 100 : 0;
      return usage >= 80 && usage < 100;
    }).length;

    return {
      totalBudgets: budgets.length,
      activeBudgets: activeBudgets.length,
      totalBudgeted,
      totalSpent,
      percentageUsed,
      overBudgetCount,
      nearLimitCount,
    };
  }

  static async getUpcomingInstallments(
    userId: string,
  ): Promise<UpcomingInstallment[]> {
    const now = Date.now();
    const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;

    const transactions = await TransactionService.listByUser(userId);

    const upcomingInstallments: UpcomingInstallment[] = [];

    for (const transaction of transactions) {
      if (
        !transaction.installmentCount ||
        transaction.installmentCount <= 1 ||
        transaction.status === "canceled"
      ) {
        continue;
      }

      const totalInstallments = transaction.installmentCount;
      const currentInstallment = transaction.installmentNumber || 1;

      for (let i = currentInstallment; i <= totalInstallments; i++) {
        let dueDate: number;
        if (transaction.dueDate && i === currentInstallment) {
          dueDate = transaction.dueDate;
        } else {
          const purchaseDate = transaction.purchaseDate || transaction.date;
          const installmentDate = new Date(purchaseDate);
          installmentDate.setMonth(
            installmentDate.getMonth() + (i - currentInstallment),
          );
          dueDate = installmentDate.getTime();
        }

        if (dueDate >= now && dueDate <= thirtyDaysFromNow) {
          const isPaid = i < currentInstallment;
          const isOverdue = !isPaid && dueDate < now;

          upcomingInstallments.push({
            transactionId: transaction.id,
            description: transaction.description,
            amount: transaction.amount,
            dueDate,
            installmentNumber: i,
            totalInstallments,
            categoryId: transaction.categoryId,
            categoryName: undefined, // Will be populated by API
            categoryIcon: undefined, // Will be populated by API
            accountId: transaction.accountId,
            accountName: undefined, // Will be populated by API
            isPaid,
            isOverdue,
          });
        }
      }
    }

    return upcomingInstallments.sort((a, b) => a.dueDate - b.dueDate);
  }

  static async calculateCategoryChart(
    userId: string,
    periodStart: number,
    periodEnd: number,
    categories: Category[],
  ): Promise<CategoryChartData[]> {
    const transactions = await TransactionService.listByDateRange(
      userId,
      periodStart,
      periodEnd,
    );

    const categoryMap = new Map<string, number>();
    let totalExpenses = 0;

    for (const transaction of transactions) {
      if (transaction.type === "expense" && transaction.status !== "canceled") {
        const categoryId = transaction.categoryId || "uncategorized";
        const currentAmount = categoryMap.get(categoryId) || 0;
        categoryMap.set(categoryId, currentAmount + transaction.amount);
        totalExpenses += transaction.amount;
      }
    }

    const categoryData: CategoryChartData[] = [];
    const categoryLookup = new Map(categories.map((c) => [c.id, c]));

    let colorIndex = 0;
    for (const [categoryId, amount] of categoryMap.entries()) {
      const category = categoryLookup.get(categoryId);
      const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;

      categoryData.push({
        categoryId,
        categoryName: category?.name || "Sem categoria",
        categoryIcon: category?.icon,
        amount,
        percentage,
        color:
          category?.color || CHART_COLORS[colorIndex % CHART_COLORS.length],
      });

      colorIndex++;
    }

    return categoryData.sort((a, b) => b.amount - a.amount);
  }

  static async calculateTrendChart(userId: string): Promise<TrendDataPoint[]> {
    const now = new Date();
    const trendData: TrendDataPoint[] = [];

    for (let i = 2; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = monthDate.getTime();
      const monthEnd = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      ).getTime();

      const transactions = await TransactionService.listByDateRange(
        userId,
        monthStart,
        monthEnd,
      );

      const income = transactions
        .filter((t) => t.type === "income" && t.status !== "canceled")
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = transactions
        .filter((t) => t.type === "expense" && t.status !== "canceled")
        .reduce((sum, t) => sum + t.amount, 0);

      const monthName = monthDate.toLocaleDateString("pt-BR", {
        month: "short",
      });
      const monthYear = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;

      trendData.push({
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        monthYear,
        income,
        expense,
        balance: income - expense,
      });
    }

    return trendData;
  }

  static async getDashboardKPIs(
    userId: string,
    periodStart: number,
    periodEnd: number,
    categories: Category[],
  ): Promise<DashboardKPIs> {
    const date = new Date(periodStart);
    const year = date.getFullYear();
    const month = date.getMonth();

    const cacheKey = CacheKeys.dashboardKPIs(userId, year, month);
    const cached = serverCache.get<DashboardKPIs>(cacheKey);

    if (cached) {
      return cached;
    }

    const transactions = await TransactionService.listByDateRange(
      userId,
      periodStart,
      periodEnd,
    );

    const income = transactions
      .filter((t) => t.type === "income" && t.status !== "canceled")
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === "expense" && t.status !== "canceled")
      .reduce((sum, t) => sum + t.amount, 0);

    const transactionCount = transactions.filter(
      (t) => t.status !== "canceled",
    ).length;

    const budgetOverview =
      await DashboardKPIsService.calculateBudgetOverview(userId);

    const upcomingInstallments =
      await DashboardKPIsService.getUpcomingInstallments(userId);

    const categoryChart = await DashboardKPIsService.calculateCategoryChart(
      userId,
      periodStart,
      periodEnd,
      categories,
    );

    const trendChart = await DashboardKPIsService.calculateTrendChart(userId);

    const kpis: DashboardKPIs = {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      transactionCount,
      budgetOverview,
      upcomingInstallments,
      categoryChart,
      trendChart,
      periodStart,
      periodEnd,
    };

    serverCache.set(cacheKey, kpis);

    return kpis;
  }
}
