import "server-only";

import { CategoryService } from "@/domain/categories/services/category.service";
import { TransactionService } from "@/domain/transactions/services/transaction.service";
import type {
  AllToolName,
  MoneyAmount,
  ToolExecutionContext,
  ToolResult,
} from "../base.types";
import { formatMoney } from "../base.types";
import type {
  CompareCategoryPeriodsInput,
  GetCategorySpendingInput,
  ListCategoriesInput,
} from "../category.tools";

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

export async function executeCategoryTool(
  context: ToolExecutionContext,
  toolName: AllToolName,
  input: Record<string, unknown>,
): Promise<ToolResult<unknown>> {
  try {
    switch (toolName) {
      case "list_categories":
        return await listCategories(
          context,
          input as unknown as ListCategoriesInput,
        );

      case "get_category_spending":
        return await getCategorySpending(
          context,
          input as unknown as GetCategorySpendingInput,
        );

      case "compare_category_periods":
        return await compareCategoryPeriods(
          context,
          input as unknown as CompareCategoryPeriodsInput,
        );

      default:
        return { success: false, error: `Unknown category tool: ${toolName}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function listCategories(
  context: ToolExecutionContext,
  input: ListCategoriesInput,
): Promise<ToolResult<unknown>> {
  let categories = await CategoryService.listByUser(context.userId);

  if (input.parentId) {
    categories = categories.filter((c) => c.parentId === input.parentId);
  }

  const categorySpending = new Map<string, { amount: number; count: number }>();

  if (input.includeSpending || input.onlyWithTransactions) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    ).getTime();

    const transactions = await TransactionService.listByDateRange(
      context.userId,
      monthStart,
      monthEnd,
    );

    for (const tx of transactions) {
      if (tx.type === "expense" && tx.categoryId) {
        const existing = categorySpending.get(tx.categoryId) || {
          amount: 0,
          count: 0,
        };
        existing.amount += Math.abs(tx.amount);
        existing.count += 1;
        categorySpending.set(tx.categoryId, existing);
      }
    }
  }

  if (input.onlyWithTransactions) {
    categories = categories.filter((c) => categorySpending.has(c.id));
  }

  const parentCategories = categories.filter((c) => !c.parentId);
  const _categoryMap = new Map(categories.map((c) => [c.id, c]));

  const result = parentCategories.map((category) => {
    const spending = categorySpending.get(category.id);
    const subcategories = categories
      .filter((c) => c.parentId === category.id)
      .map((sub) => {
        const subSpending = categorySpending.get(sub.id);
        return {
          id: sub.id,
          name: sub.name,
          icon: sub.icon,
          color: sub.color,
          isSystem: sub.isSystem || false,
          spending: subSpending ? formatMoney(subSpending.amount) : undefined,
          transactionCount: subSpending?.count,
        };
      });

    return {
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      isSystem: category.isSystem || false,
      spending: spending ? formatMoney(spending.amount) : undefined,
      transactionCount: spending?.count,
      subcategories: subcategories.length > 0 ? subcategories : undefined,
    };
  });

  return {
    success: true,
    data: {
      categories: result,
      totalCategories: categories.length,
      withSubcategories: parentCategories.filter((c) =>
        categories.some((sub) => sub.parentId === c.id),
      ).length,
    },
  };
}

async function getCategorySpending(
  context: ToolExecutionContext,
  input: GetCategorySpendingInput,
): Promise<ToolResult<unknown>> {
  const { start, end, label } = resolvePeriod(input);

  const categories = await CategoryService.listByUser(context.userId);
  const category = categories.find((c) => c.id === input.categoryId);

  if (!category) {
    return { success: false, error: "Category not found" };
  }

  const transactions = await TransactionService.listByDateRange(
    context.userId,
    start,
    end,
  );

  const subcategoryIds = categories
    .filter((c) => c.parentId === input.categoryId)
    .map((c) => c.id);

  const categoryIds = input.includeSubcategories
    ? [input.categoryId, ...subcategoryIds]
    : [input.categoryId];

  const categoryTransactions = transactions.filter(
    (t) =>
      t.type === "expense" &&
      t.categoryId &&
      categoryIds.includes(t.categoryId),
  );

  const totalSpent = categoryTransactions.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0,
  );
  const avgTransaction =
    categoryTransactions.length > 0
      ? totalSpent / categoryTransactions.length
      : 0;

  const sortedByAmount = [...categoryTransactions].sort(
    (a, b) => Math.abs(b.amount) - Math.abs(a.amount),
  );
  const largest = sortedByAmount[0];

  const merchantCounts = new Map<string, { count: number; total: number }>();
  for (const tx of categoryTransactions) {
    const merchant = tx.merchant || tx.description || "Unknown";
    const existing = merchantCounts.get(merchant) || { count: 0, total: 0 };
    existing.count += 1;
    existing.total += Math.abs(tx.amount);
    merchantCounts.set(merchant, existing);
  }

  const frequentMerchants = Array.from(merchantCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([name, data]) => ({
      name,
      count: data.count,
      totalSpent: formatMoney(data.total),
    }));

  let subcategoryBreakdown:
    | Array<{
        categoryId: string;
        categoryName: string;
        spent: MoneyAmount;
        percentage: number;
      }>
    | undefined;
  if (input.includeSubcategories && subcategoryIds.length > 0) {
    const subcategoryMap = new Map(
      categories
        .filter((c) => c.parentId === input.categoryId)
        .map((c) => [c.id, c.name]),
    );

    const subcategorySpending = new Map<string, number>();
    for (const tx of categoryTransactions) {
      if (tx.categoryId && subcategoryIds.includes(tx.categoryId)) {
        const current = subcategorySpending.get(tx.categoryId) || 0;
        subcategorySpending.set(tx.categoryId, current + Math.abs(tx.amount));
      }
    }

    subcategoryBreakdown = Array.from(subcategorySpending.entries()).map(
      ([id, spent]) => ({
        categoryId: id,
        categoryName: subcategoryMap.get(id) || "Unknown",
        spent: formatMoney(spent),
        percentage:
          totalSpent > 0 ? Math.round((spent / totalSpent) * 1000) / 10 : 0,
      }),
    );
  }

  let comparison:
    | {
        previousPeriod: {
          spent: MoneyAmount;
          transactionCount: number;
        };
        spendingChange: number;
        transactionCountChange: number;
        trend: "up" | "down" | "stable";
      }
    | undefined;
  if (input.compareWithPrevious) {
    const periodLength = end - start;
    const previousStart = start - periodLength;
    const previousEnd = start - 1;

    const previousTransactions = await TransactionService.listByDateRange(
      context.userId,
      previousStart,
      previousEnd,
    );

    const previousCategoryTransactions = previousTransactions.filter(
      (t) =>
        t.type === "expense" &&
        t.categoryId &&
        categoryIds.includes(t.categoryId),
    );

    const previousSpent = previousCategoryTransactions.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0,
    );

    const spendingChange =
      previousSpent > 0
        ? ((totalSpent - previousSpent) / previousSpent) * 100
        : 0;

    const countChange =
      previousCategoryTransactions.length > 0
        ? ((categoryTransactions.length - previousCategoryTransactions.length) /
            previousCategoryTransactions.length) *
          100
        : 0;

    let trend: "up" | "down" | "stable";
    if (spendingChange > 5) trend = "up";
    else if (spendingChange < -5) trend = "down";
    else trend = "stable";

    comparison = {
      previousPeriod: {
        spent: formatMoney(previousSpent),
        transactionCount: previousCategoryTransactions.length,
      },
      spendingChange: Math.round(spendingChange * 10) / 10,
      transactionCountChange: Math.round(countChange * 10) / 10,
      trend,
    };
  }

  return {
    success: true,
    data: {
      category: {
        id: category.id,
        name: category.name,
        icon: category.icon,
      },
      period: {
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        label,
      },
      totalSpent: formatMoney(totalSpent),
      transactionCount: categoryTransactions.length,
      avgTransaction: formatMoney(Math.round(avgTransaction)),
      largestTransaction: largest
        ? {
            id: largest.id,
            description: largest.description,
            amount: formatMoney(Math.abs(largest.amount)),
            date: new Date(largest.date).toISOString(),
          }
        : null,
      frequentMerchants,
      subcategoryBreakdown,
      comparison,
    },
  };
}

async function compareCategoryPeriods(
  context: ToolExecutionContext,
  input: CompareCategoryPeriodsInput,
): Promise<ToolResult<unknown>> {
  // Parse periods (YYYY-MM format)
  const [year1, month1] = input.period1.split("-").map(Number);
  const [year2, month2] = input.period2.split("-").map(Number);

  const period1Start = new Date(year1, month1 - 1, 1).getTime();
  const period1End = new Date(year1, month1, 0, 23, 59, 59, 999).getTime();

  const period2Start = new Date(year2, month2 - 1, 1).getTime();
  const period2End = new Date(year2, month2, 0, 23, 59, 59, 999).getTime();

  const [transactions1, transactions2, categories] = await Promise.all([
    TransactionService.listByDateRange(
      context.userId,
      period1Start,
      period1End,
    ),
    TransactionService.listByDateRange(
      context.userId,
      period2Start,
      period2End,
    ),
    CategoryService.listByUser(context.userId),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  let expenses1 = transactions1.filter((t) => t.type === "expense");
  let expenses2 = transactions2.filter((t) => t.type === "expense");

  let categoryInfo: { id: string; name: string } | undefined;
  if (input.categoryId) {
    expenses1 = expenses1.filter((t) => t.categoryId === input.categoryId);
    expenses2 = expenses2.filter((t) => t.categoryId === input.categoryId);
    const category = categories.find((c) => c.id === input.categoryId);
    categoryInfo = category
      ? { id: category.id, name: category.name }
      : undefined;
  }

  const spent1 = expenses1.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const spent2 = expenses2.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  let topCategories1: Array<{ name: string; spent: MoneyAmount }> | undefined;
  let topCategories2: Array<{ name: string; spent: MoneyAmount }> | undefined;

  if (!input.categoryId) {
    const categorySpending1 = new Map<string, number>();
    for (const tx of expenses1) {
      if (tx.categoryId) {
        const current = categorySpending1.get(tx.categoryId) || 0;
        categorySpending1.set(tx.categoryId, current + Math.abs(tx.amount));
      }
    }

    const categorySpending2 = new Map<string, number>();
    for (const tx of expenses2) {
      if (tx.categoryId) {
        const current = categorySpending2.get(tx.categoryId) || 0;
        categorySpending2.set(tx.categoryId, current + Math.abs(tx.amount));
      }
    }

    topCategories1 = Array.from(categorySpending1.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, amount]) => ({
        name: categoryMap.get(id) || "Unknown",
        spent: formatMoney(amount),
      }));

    topCategories2 = Array.from(categorySpending2.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, amount]) => ({
        name: categoryMap.get(id) || "Unknown",
        spent: formatMoney(amount),
      }));
  }

  const spendingDifference = spent2 - spent1;
  const percentageChange = spent1 > 0 ? ((spent2 - spent1) / spent1) * 100 : 0;
  const transactionDifference = expenses2.length - expenses1.length;

  const insights: string[] = [];

  if (percentageChange > 10) {
    insights.push(
      `Gastos aumentaram ${Math.round(percentageChange)}% comparado ao período anterior`,
    );
  } else if (percentageChange < -10) {
    insights.push(
      `Gastos diminuíram ${Math.round(Math.abs(percentageChange))}% comparado ao período anterior`,
    );
  } else {
    insights.push("Gastos se mantiveram estáveis entre os períodos");
  }

  if (transactionDifference > 0) {
    insights.push(
      `${transactionDifference} transações a mais no segundo período`,
    );
  } else if (transactionDifference < 0) {
    insights.push(
      `${Math.abs(transactionDifference)} transações a menos no segundo período`,
    );
  }

  return {
    success: true,
    data: {
      category: categoryInfo,
      period1: {
        month: input.period1,
        label: new Date(year1, month1 - 1).toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        }),
        spent: formatMoney(spent1),
        transactionCount: expenses1.length,
        topCategories: topCategories1,
      },
      period2: {
        month: input.period2,
        label: new Date(year2, month2 - 1).toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        }),
        spent: formatMoney(spent2),
        transactionCount: expenses2.length,
        topCategories: topCategories2,
      },
      comparison: {
        spendingDifference: formatMoney(spendingDifference),
        percentageChange: Math.round(percentageChange * 10) / 10,
        transactionDifference,
        insights,
      },
    },
  };
}
