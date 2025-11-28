import "server-only";

import { CategoryService } from "@/domain/categories/services/category.service";
import { TransactionService } from "@/domain/transactions/services/transaction.service";
import type {
  AllToolName,
  ToolExecutionContext,
  ToolResult,
} from "../base.types";
import { formatMoney } from "../base.types";
import type {
  GetLargestExpensesInput,
  GetSpendingByCategoryInput,
  GetSpendingTrendInput,
  GetTransactionsSummaryInput,
  SearchTransactionsInput,
} from "../transaction.tools";

function resolvePeriod(input: {
  period?: string;
  startDate?: string;
  endDate?: string;
}): { start: number; end: number; label: string } {
  const now = new Date();
  let start: Date;
  let end: Date;
  let label: string;

  if (input.period) {
    switch (input.period) {
      case "this_month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
        label = now.toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        });
        break;
      case "last_month":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        label = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
        ).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
        break;
      case "last_30_days":
        end = now;
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        label = "Últimos 30 dias";
        break;
      case "last_90_days":
        end = now;
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        label = "Últimos 90 dias";
        break;
      case "this_year":
        start = new Date(now.getFullYear(), 0, 1);
        end = now;
        label = now.getFullYear().toString();
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = now;
        label = "Período atual";
    }
  } else {
    start = input.startDate
      ? new Date(input.startDate)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    end = input.endDate ? new Date(input.endDate) : now;
    label = `${start.toLocaleDateString("pt-BR")} - ${end.toLocaleDateString("pt-BR")}`;
  }

  return {
    start: start.getTime(),
    end: end.getTime(),
    label,
  };
}

export async function executeTransactionTool(
  context: ToolExecutionContext,
  toolName: AllToolName,
  input: Record<string, unknown>,
): Promise<ToolResult<unknown>> {
  try {
    switch (toolName) {
      case "get_transactions_summary":
        return await getTransactionsSummary(
          context,
          input as GetTransactionsSummaryInput,
        );

      case "search_transactions":
        return await searchTransactions(
          context,
          input as SearchTransactionsInput,
        );

      case "get_spending_by_category":
        return await getSpendingByCategory(
          context,
          input as GetSpendingByCategoryInput,
        );

      case "get_spending_trend":
        return await getSpendingTrend(context, input as GetSpendingTrendInput);

      case "get_largest_expenses":
        return await getLargestExpenses(
          context,
          input as GetLargestExpensesInput,
        );

      default:
        return {
          success: false,
          error: `Unknown transaction tool: ${toolName}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function getTransactionsSummary(
  context: ToolExecutionContext,
  input: GetTransactionsSummaryInput,
): Promise<ToolResult<unknown>> {
  const { start, end, label } = resolvePeriod(input);

  let transactions = await TransactionService.listByDateRange(
    context.userId,
    start,
    end,
  );

  if (input.type) {
    transactions = transactions.filter((t) => t.type === input.type);
  }

  if (input.accountId) {
    transactions = transactions.filter((t) => t.accountId === input.accountId);
  }

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netBalance = income - expenses;
  const savingsRate = income > 0 ? (netBalance / income) * 100 : 0;
  const avgTransactionSize =
    transactions.length > 0
      ? transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) /
        transactions.length
      : 0;

  return {
    success: true,
    data: {
      period: {
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        label,
      },
      income: formatMoney(income),
      expenses: formatMoney(expenses),
      netBalance: formatMoney(netBalance),
      transactionCount: transactions.length,
      avgTransactionSize: formatMoney(Math.round(avgTransactionSize)),
      savingsRate: Math.round(savingsRate * 10) / 10,
    },
  };
}

async function searchTransactions(
  context: ToolExecutionContext,
  input: SearchTransactionsInput,
): Promise<ToolResult<unknown>> {
  const { start, end } = resolvePeriod(input);

  let transactions = await TransactionService.listByDateRange(
    context.userId,
    start,
    end,
  );

  const categories = await CategoryService.listByUser(context.userId);
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  if (input.query) {
    const query = input.query.toLowerCase();
    transactions = transactions.filter(
      (t) =>
        t.description?.toLowerCase().includes(query) ||
        t.merchant?.toLowerCase().includes(query),
    );
  }

  if (input.type) {
    transactions = transactions.filter((t) => t.type === input.type);
  }

  if (input.categoryId) {
    transactions = transactions.filter(
      (t) => t.categoryId === input.categoryId,
    );
  }

  if (input.accountId) {
    transactions = transactions.filter((t) => t.accountId === input.accountId);
  }

  if (input.minAmount !== undefined) {
    transactions = transactions.filter(
      (t) => Math.abs(t.amount) >= input.minAmount!,
    );
  }

  if (input.maxAmount !== undefined) {
    transactions = transactions.filter(
      (t) => Math.abs(t.amount) <= input.maxAmount!,
    );
  }

  const sortBy = input.sortBy || "date";
  const sortOrder = input.sortOrder || "desc";
  transactions.sort((a, b) => {
    const valueA = sortBy === "date" ? a.date : Math.abs(a.amount);
    const valueB = sortBy === "date" ? b.date : Math.abs(b.amount);
    return sortOrder === "desc" ? valueB - valueA : valueA - valueB;
  });

  const totalCount = transactions.length;

  const offset = input.offset || 0;
  const limit = input.limit || 20;
  const paginatedTransactions = transactions.slice(offset, offset + limit);

  const totalAmount = transactions.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0,
  );
  const avgAmount = totalCount > 0 ? totalAmount / totalCount : 0;

  return {
    success: true,
    data: {
      transactions: paginatedTransactions.map((t) => ({
        id: t.id,
        date: new Date(t.date).toISOString(),
        description: t.description,
        merchant: t.merchant,
        amount: formatMoney(t.amount),
        type: t.type,
        categoryName: t.categoryId ? categoryMap.get(t.categoryId) : undefined,
        tags: t.tags,
      })),
      totalCount,
      hasMore: offset + limit < totalCount,
      summary: {
        totalAmount: formatMoney(totalAmount),
        avgAmount: formatMoney(Math.round(avgAmount)),
      },
    },
  };
}

async function getSpendingByCategory(
  context: ToolExecutionContext,
  input: GetSpendingByCategoryInput,
): Promise<ToolResult<unknown>> {
  const { start, end, label } = resolvePeriod(input);

  const transactions = await TransactionService.listByDateRange(
    context.userId,
    start,
    end,
  );

  const categories = await CategoryService.listByUser(context.userId);
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const expenses = transactions.filter((t) => t.type === "expense");

  const categorySpending = new Map<
    string,
    { amount: number; count: number; subcategories: Map<string, number> }
  >();

  let uncategorized = 0;

  for (const tx of expenses) {
    const amount = Math.abs(tx.amount);
    if (!tx.categoryId) {
      uncategorized += amount;
      continue;
    }

    const category = categoryMap.get(tx.categoryId);
    if (!category) {
      uncategorized += amount;
      continue;
    }

    const parentId = category.parentId || category.id;
    const existing = categorySpending.get(parentId) || {
      amount: 0,
      count: 0,
      subcategories: new Map(),
    };

    existing.amount += amount;
    existing.count += 1;

    if (category.parentId && input.includeSubcategories) {
      const subAmount = existing.subcategories.get(tx.categoryId) || 0;
      existing.subcategories.set(tx.categoryId, subAmount + amount);
    }

    categorySpending.set(parentId, existing);
  }

  const totalExpenses = expenses.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0,
  );

  let categoryArray = Array.from(categorySpending.entries())
    .map(([categoryId, data]) => {
      const category = categoryMap.get(categoryId);
      return {
        categoryId,
        categoryName: category?.name || "Unknown",
        amount: formatMoney(data.amount),
        percentage:
          totalExpenses > 0
            ? Math.round((data.amount / totalExpenses) * 1000) / 10
            : 0,
        transactionCount: data.count,
        avgTransaction: formatMoney(Math.round(data.amount / data.count)),
        subcategories: input.includeSubcategories
          ? Array.from(data.subcategories.entries()).map(
              ([subId, subAmount]) => ({
                categoryId: subId,
                categoryName: categoryMap.get(subId)?.name || "Unknown",
                amount: formatMoney(subAmount),
                percentage:
                  data.amount > 0
                    ? Math.round((subAmount / data.amount) * 1000) / 10
                    : 0,
              }),
            )
          : undefined,
      };
    })
    .sort((a, b) => b.amount.value - a.amount.value);

  if (input.limit) {
    categoryArray = categoryArray.slice(0, input.limit);
  }

  return {
    success: true,
    data: {
      period: {
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        label,
      },
      totalExpenses: formatMoney(totalExpenses),
      categories: categoryArray,
      uncategorized: formatMoney(uncategorized),
    },
  };
}

async function getSpendingTrend(
  context: ToolExecutionContext,
  input: GetSpendingTrendInput,
): Promise<ToolResult<unknown>> {
  const periods = input.periods || 6;
  const granularity = input.granularity || "monthly";

  const now = new Date();
  const dataPoints: Array<{
    period: string;
    periodLabel: string;
    amount: number;
    transactionCount: number;
  }> = [];

  for (let i = periods - 1; i >= 0; i--) {
    let start: Date;
    let end: Date;
    let periodLabel: string;
    let period: string;

    if (granularity === "monthly") {
      start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      end = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        0,
        23,
        59,
        59,
        999,
      );
      periodLabel = start.toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });
      period = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
    } else if (granularity === "weekly") {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      start = weekStart;
      end = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      periodLabel = `Sem ${start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
      period = start.toISOString().split("T")[0];
    } else {
      start = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
      periodLabel = start.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
      period = start.toISOString().split("T")[0];
    }

    const transactions = await TransactionService.listByDateRange(
      context.userId,
      start.getTime(),
      end.getTime(),
    );

    let filtered = transactions.filter((t) => t.type === "expense");

    if (input.categoryId) {
      filtered = filtered.filter((t) => t.categoryId === input.categoryId);
    }

    const amount = filtered.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    dataPoints.push({
      period,
      periodLabel,
      amount,
      transactionCount: filtered.length,
    });
  }

  const amounts = dataPoints.map((d) => d.amount);
  const firstHalf = amounts.slice(0, Math.floor(amounts.length / 2));
  const secondHalf = amounts.slice(Math.floor(amounts.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length || 0;
  const secondAvg =
    secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length || 0;
  const percentageChange =
    firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
  const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length || 0;

  let direction: "up" | "down" | "stable";
  if (percentageChange > 5) direction = "up";
  else if (percentageChange < -5) direction = "down";
  else direction = "stable";

  let categoryName: string | undefined;
  if (input.categoryId) {
    const categories = await CategoryService.listByUser(context.userId);
    const category = categories.find((c) => c.id === input.categoryId);
    categoryName = category?.name;
  }

  return {
    success: true,
    data: {
      categoryId: input.categoryId,
      categoryName,
      granularity,
      dataPoints: dataPoints.map((d) => ({
        period: d.period,
        periodLabel: d.periodLabel,
        amount: formatMoney(d.amount),
        transactionCount: d.transactionCount,
      })),
      trend: {
        direction,
        percentageChange: Math.round(percentageChange * 10) / 10,
        avgAmount: formatMoney(Math.round(avgAmount)),
      },
    },
  };
}

async function getLargestExpenses(
  context: ToolExecutionContext,
  input: GetLargestExpensesInput,
): Promise<ToolResult<unknown>> {
  const { start, end } = resolvePeriod(input);

  let transactions = await TransactionService.listByDateRange(
    context.userId,
    start,
    end,
  );

  const categories = await CategoryService.listByUser(context.userId);
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  transactions = transactions.filter((t) => t.type === "expense");

  if (input.categoryId) {
    transactions = transactions.filter(
      (t) => t.categoryId === input.categoryId,
    );
  }

  if (input.minAmount !== undefined) {
    transactions = transactions.filter(
      (t) => Math.abs(t.amount) >= input.minAmount!,
    );
  }

  transactions.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

  const limit = input.limit || 10;
  const topExpenses = transactions.slice(0, limit);

  const totalAmount = topExpenses.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0,
  );
  const allExpensesTotal = transactions.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0,
  );
  const percentageOfTotal =
    allExpensesTotal > 0 ? (totalAmount / allExpensesTotal) * 100 : 0;

  return {
    success: true,
    data: {
      expenses: topExpenses.map((t) => ({
        id: t.id,
        date: new Date(t.date).toISOString(),
        description: t.description,
        merchant: t.merchant,
        amount: formatMoney(Math.abs(t.amount)),
        categoryName: t.categoryId ? categoryMap.get(t.categoryId) : undefined,
      })),
      totalAmount: formatMoney(totalAmount),
      percentageOfTotal: Math.round(percentageOfTotal * 10) / 10,
    },
  };
}
