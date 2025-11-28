import "server-only";

import { BudgetService } from "@/domain/budgets/services/budget.service";
import { CategoryService } from "@/domain/categories/services/category.service";
import { TransactionService } from "@/domain/transactions/services/transaction.service";
import type {
  AllToolName,
  ToolExecutionContext,
  ToolResult,
} from "../base.types";
import { formatMoney } from "../base.types";
import type {
  BudgetAlertLevel,
  GetBudgetAlertsInput,
  GetBudgetRecommendationsInput,
  GetBudgetStatusInput,
} from "../budget.tools";

function getAlertLevel(percentUsed: number): BudgetAlertLevel {
  if (percentUsed >= 100) return "exceeded";
  if (percentUsed >= 80) return "warning";
  if (percentUsed < 50) return "under_budget";
  return "on_track";
}

function getDaysRemainingInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.getDate() - now.getDate();
}

export async function executeBudgetTool(
  context: ToolExecutionContext,
  toolName: AllToolName,
  input: Record<string, unknown>,
): Promise<ToolResult<unknown>> {
  try {
    switch (toolName) {
      case "get_budget_status":
        return await getBudgetStatus(context, input as GetBudgetStatusInput);

      case "get_budget_alerts":
        return await getBudgetAlerts(context, input as GetBudgetAlertsInput);

      case "get_budget_recommendations":
        return await getBudgetRecommendations(
          context,
          input as GetBudgetRecommendationsInput,
        );

      default:
        return { success: false, error: `Unknown budget tool: ${toolName}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function getBudgetStatus(
  context: ToolExecutionContext,
  input: GetBudgetStatusInput,
): Promise<ToolResult<unknown>> {
  const budgets = await BudgetService.listActiveByUser(context.userId);
  const categories = await CategoryService.listByUser(context.userId);
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

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

  const categorySpending = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type === "expense" && tx.categoryId) {
      const current = categorySpending.get(tx.categoryId) || 0;
      categorySpending.set(tx.categoryId, current + Math.abs(tx.amount));
    }
  }

  const daysRemaining = getDaysRemainingInMonth();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const daysElapsed = daysInMonth - daysRemaining;

  let filteredBudgets = budgets;
  if (input.budgetId) {
    filteredBudgets = budgets.filter((b) => b.id === input.budgetId);
  }

  const budgetStatuses = filteredBudgets.map((budget) => {
    const spent = budget.categoryIds.reduce((sum, catId) => {
      return sum + (categorySpending.get(catId) || 0);
    }, 0);

    const remaining = budget.amount - spent;
    const percentUsed = (spent / budget.amount) * 100;
    const alertLevel = getAlertLevel(percentUsed);

    const dailyRate = daysElapsed > 0 ? spent / daysElapsed : 0;
    const projectedTotal = Math.round(dailyRate * daysInMonth);
    const projectedAlertLevel = getAlertLevel(
      (projectedTotal / budget.amount) * 100,
    );

    return {
      budgetId: budget.id,
      name: budget.name,
      period: budget.period,
      categories: budget.categoryIds.map((catId) => ({
        categoryId: catId,
        categoryName: categoryMap.get(catId) || "Unknown",
      })),
      limit: formatMoney(budget.amount),
      spent: formatMoney(spent),
      remaining: formatMoney(remaining),
      percentUsed: Math.round(percentUsed * 10) / 10,
      alertLevel,
      daysRemaining,
      projectedTotal: formatMoney(projectedTotal),
      projectedAlertLevel,
    };
  });

  const totalLimit = filteredBudgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgetStatuses.reduce((sum, b) => sum + b.spent.value, 0);
  const exceededCount = budgetStatuses.filter(
    (b) => b.alertLevel === "exceeded",
  ).length;
  const warningCount = budgetStatuses.filter(
    (b) => b.alertLevel === "warning",
  ).length;
  const onTrackCount = budgetStatuses.filter(
    (b) => b.alertLevel === "on_track" || b.alertLevel === "under_budget",
  ).length;

  return {
    success: true,
    data: {
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      budgets: budgetStatuses,
      summary: {
        totalBudgets: filteredBudgets.length,
        exceededCount,
        warningCount,
        onTrackCount,
        totalLimit: formatMoney(totalLimit),
        totalSpent: formatMoney(totalSpent),
        overallPercentUsed:
          totalLimit > 0
            ? Math.round((totalSpent / totalLimit) * 1000) / 10
            : 0,
      },
    },
  };
}

async function getBudgetAlerts(
  context: ToolExecutionContext,
  input: GetBudgetAlertsInput,
): Promise<ToolResult<unknown>> {
  const threshold = input.thresholdPercent || 80;
  const budgets = await BudgetService.listActiveByUser(context.userId);
  const categories = await CategoryService.listByUser(context.userId);
  const _categoryMap = new Map(categories.map((c) => [c.id, c.name]));

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

  const categorySpending = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type === "expense" && tx.categoryId) {
      const current = categorySpending.get(tx.categoryId) || 0;
      categorySpending.set(tx.categoryId, current + Math.abs(tx.amount));
    }
  }

  const daysRemaining = getDaysRemainingInMonth();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const daysElapsed = daysInMonth - daysRemaining;

  const alerts: Array<{
    budgetId: string;
    budgetName: string;
    alertLevel: BudgetAlertLevel;
    message: string;
    spent: ReturnType<typeof formatMoney>;
    limit: ReturnType<typeof formatMoney>;
    percentUsed: number;
    amountOver?: ReturnType<typeof formatMoney>;
    projectedOver?: ReturnType<typeof formatMoney>;
    suggestedAction?: string;
  }> = [];

  for (const budget of budgets) {
    const spent = budget.categoryIds.reduce((sum, catId) => {
      return sum + (categorySpending.get(catId) || 0);
    }, 0);

    const percentUsed = (spent / budget.amount) * 100;
    const alertLevel = getAlertLevel(percentUsed);

    if (percentUsed < threshold && !input.includeOnTrack) {
      continue;
    }

    let message: string;
    let suggestedAction: string | undefined;
    let amountOver: ReturnType<typeof formatMoney> | undefined;
    let projectedOver: ReturnType<typeof formatMoney> | undefined;

    if (alertLevel === "exceeded") {
      amountOver = formatMoney(spent - budget.amount);
      message = `Orçamento "${budget.name}" excedido em ${amountOver.formatted}`;
      suggestedAction = "Revisar gastos e ajustar o limite ou reduzir despesas";
    } else if (alertLevel === "warning") {
      const remaining = budget.amount - spent;
      message = `Orçamento "${budget.name}" em alerta: restam ${formatMoney(remaining).formatted} (${Math.round(100 - percentUsed)}%)`;
      suggestedAction = `Manter gastos abaixo de ${formatMoney(Math.round(remaining / daysRemaining)).formatted}/dia`;
    } else {
      const dailyRate = daysElapsed > 0 ? spent / daysElapsed : 0;
      const projectedTotal = dailyRate * daysInMonth;

      if (projectedTotal > budget.amount) {
        projectedOver = formatMoney(Math.round(projectedTotal - budget.amount));
        message = `Orçamento "${budget.name}" pode exceder em ${projectedOver.formatted} se manter o ritmo atual`;
        suggestedAction = "Reduzir gastos para evitar estouro do orçamento";
      } else {
        message = `Orçamento "${budget.name}" está no caminho certo (${Math.round(percentUsed)}% usado)`;
      }
    }

    alerts.push({
      budgetId: budget.id,
      budgetName: budget.name,
      alertLevel,
      message,
      spent: formatMoney(spent),
      limit: formatMoney(budget.amount),
      percentUsed: Math.round(percentUsed * 10) / 10,
      amountOver,
      projectedOver,
      suggestedAction,
    });
  }

  const severityOrder: Record<BudgetAlertLevel, number> = {
    exceeded: 0,
    warning: 1,
    on_track: 2,
    under_budget: 3,
  };
  alerts.sort(
    (a, b) => severityOrder[a.alertLevel] - severityOrder[b.alertLevel],
  );

  return {
    success: true,
    data: {
      alerts,
      summary: {
        criticalCount: alerts.filter((a) => a.alertLevel === "exceeded").length,
        warningCount: alerts.filter((a) => a.alertLevel === "warning").length,
        totalAlerts: alerts.length,
      },
    },
  };
}

async function getBudgetRecommendations(
  context: ToolExecutionContext,
  input: GetBudgetRecommendationsInput,
): Promise<ToolResult<unknown>> {
  const limit = input.limit || 5;
  const budgets = await BudgetService.listActiveByUser(context.userId);
  const categories = await CategoryService.listByUser(context.userId);
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const now = new Date();
  const threeMonthsAgo = new Date(
    now.getFullYear(),
    now.getMonth() - 3,
    1,
  ).getTime();
  const transactions = await TransactionService.listByDateRange(
    context.userId,
    threeMonthsAgo,
    now.getTime(),
  );

  const categoryAvgSpending = new Map<
    string,
    { total: number; months: Set<string> }
  >();
  for (const tx of transactions) {
    if (tx.type === "expense" && tx.categoryId) {
      const month = new Date(tx.date).toISOString().slice(0, 7);
      const existing = categoryAvgSpending.get(tx.categoryId) || {
        total: 0,
        months: new Set<string>(),
      };
      existing.total += Math.abs(tx.amount);
      existing.months.add(month);
      categoryAvgSpending.set(tx.categoryId, existing);
    }
  }

  const recommendations: Array<{
    type: string;
    priority: "high" | "medium" | "low";
    title: string;
    description: string;
    impact?: {
      currentSpending: ReturnType<typeof formatMoney>;
      suggestedLimit: ReturnType<typeof formatMoney>;
      potentialSavings: ReturnType<typeof formatMoney>;
    };
    affectedCategories?: string[];
  }> = [];

  const _budgetedCategories = new Set(budgets.flatMap((b) => b.categoryIds));
  const topOverspendingCategories: Array<{
    categoryName: string;
    overspentBy: ReturnType<typeof formatMoney>;
    percentOver: number;
  }> = [];

  for (const [categoryId, data] of categoryAvgSpending.entries()) {
    if (input.categoryId && categoryId !== input.categoryId) continue;

    const monthCount = data.months.size || 1;
    const avgMonthlySpending = data.total / monthCount;
    const categoryName = categoryMap.get(categoryId) || "Unknown";

    const categoryBudget = budgets.find((b) =>
      b.categoryIds.includes(categoryId),
    );

    if (!categoryBudget && avgMonthlySpending > 10000) {
      recommendations.push({
        type: "create_budget",
        priority: avgMonthlySpending > 50000 ? "high" : "medium",
        title: `Criar orçamento para ${categoryName}`,
        description: `Você gasta em média ${formatMoney(Math.round(avgMonthlySpending)).formatted}/mês em ${categoryName} sem um orçamento definido.`,
        impact: {
          currentSpending: formatMoney(Math.round(avgMonthlySpending)),
          suggestedLimit: formatMoney(Math.round(avgMonthlySpending * 0.9)),
          potentialSavings: formatMoney(Math.round(avgMonthlySpending * 0.1)),
        },
        affectedCategories: [categoryName],
      });
    } else if (categoryBudget) {
      const monthlyLimit = categoryBudget.amount;
      if (avgMonthlySpending > monthlyLimit) {
        const overspentBy = avgMonthlySpending - monthlyLimit;
        const percentOver =
          ((avgMonthlySpending - monthlyLimit) / monthlyLimit) * 100;

        topOverspendingCategories.push({
          categoryName,
          overspentBy: formatMoney(Math.round(overspentBy)),
          percentOver: Math.round(percentOver),
        });

        if (percentOver > 20) {
          recommendations.push({
            type: "increase_budget",
            priority: percentOver > 50 ? "high" : "medium",
            title: `Ajustar orçamento de ${categoryBudget.name}`,
            description: `Orçamento frequentemente excedido em ${Math.round(percentOver)}%. Considere aumentar o limite ou revisar gastos.`,
            impact: {
              currentSpending: formatMoney(Math.round(avgMonthlySpending)),
              suggestedLimit: formatMoney(
                Math.round(avgMonthlySpending * 1.05),
              ),
              potentialSavings: formatMoney(0),
            },
            affectedCategories: categoryBudget.categoryIds.map(
              (id) => categoryMap.get(id) || "Unknown",
            ),
          });
        }
      } else if (avgMonthlySpending < monthlyLimit * 0.5) {
        recommendations.push({
          type: "decrease_spending",
          priority: "low",
          title: `Reduzir orçamento de ${categoryBudget.name}`,
          description: `Você usa menos de 50% do orçamento. Considere reduzir o limite e alocar para outras áreas.`,
          impact: {
            currentSpending: formatMoney(Math.round(avgMonthlySpending)),
            suggestedLimit: formatMoney(Math.round(avgMonthlySpending * 1.2)),
            potentialSavings: formatMoney(
              Math.round(monthlyLimit - avgMonthlySpending * 1.2),
            ),
          },
          affectedCategories: categoryBudget.categoryIds.map(
            (id) => categoryMap.get(id) || "Unknown",
          ),
        });
      }
    }
  }

  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  recommendations.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );

  const savingsOpportunities = recommendations.reduce(
    (sum, r) => sum + (r.impact?.potentialSavings.value || 0),
    0,
  );

  return {
    success: true,
    data: {
      recommendations: recommendations.slice(0, limit),
      insights: {
        topOverspendingCategories: topOverspendingCategories.slice(0, 3),
        savingsOpportunities: formatMoney(savingsOpportunities),
      },
    },
  };
}
