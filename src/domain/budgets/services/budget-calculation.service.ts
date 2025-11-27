import "server-only";
import { AuditService } from "@/domain/audit/services/audit.service";
import { CategoryService } from "@/domain/categories/services/category.service";
import { TransactionService } from "@/domain/transactions/services/transaction.service";
import { logger } from "@/lib/logger";
import type { Budget } from "../types/budget";
import type {
  BudgetCalculationOptions,
  BudgetCalculationSummary,
  BudgetVsActual,
  CalculationPeriod,
  CategorySpending,
} from "../types/budget-calculation";
import { BudgetService } from "./budget.service";

export class BudgetCalculationService {
  static getCalculationPeriod(budget: Budget): CalculationPeriod {
    const now = new Date();
    let startDate: number;
    let endDate: number;

    switch (budget.period) {
      case "monthly": {
        const year = now.getFullYear();
        const month = now.getMonth();
        startDate = new Date(year, month, 1).getTime();
        endDate = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
        return {
          startDate,
          endDate,
          period: "monthly",
          year,
          month: month + 1,
        };
      }

      case "yearly": {
        const year = now.getFullYear();
        startDate = new Date(year, 0, 1).getTime();
        endDate = new Date(year, 11, 31, 23, 59, 59, 999).getTime();
        return {
          startDate,
          endDate,
          period: "yearly",
          year,
        };
      }

      case "quarterly": {
        const year = now.getFullYear();
        const month = now.getMonth();
        const quarter = Math.floor(month / 3) + 1;
        const quarterStartMonth = (quarter - 1) * 3;
        startDate = new Date(year, quarterStartMonth, 1).getTime();
        endDate = new Date(
          year,
          quarterStartMonth + 3,
          0,
          23,
          59,
          59,
          999,
        ).getTime();
        return {
          startDate,
          endDate,
          period: "quarterly",
          year,
          quarter,
        };
      }

      case "custom":
        return {
          startDate: budget.startDate,
          endDate: budget.endDate || Date.now(),
          period: "custom",
        };

      default:
        return {
          startDate: budget.startDate,
          endDate: budget.endDate || Date.now(),
          period: "custom",
        };
    }
  }

  static async calculateCategorySpending(
    userId: string,
    period: CalculationPeriod,
    categoryIds?: string[],
  ): Promise<CategorySpending[]> {
    try {
      const transactions = await TransactionService.listByDateRange(
        userId,
        period.startDate,
        period.endDate,
      );

      const expenseTransactions = transactions.filter(
        (t) => t.type === "expense" && t.categoryId,
      );

      const categoryMap = new Map<string, CategorySpending>();

      for (const transaction of expenseTransactions) {
        if (!transaction.categoryId) continue;

        if (categoryIds && categoryIds.length > 0) {
          if (!categoryIds.includes(transaction.categoryId)) {
            continue;
          }
        }

        const existing = categoryMap.get(transaction.categoryId);
        if (existing) {
          existing.spent += transaction.amount;
          existing.transactionCount += 1;
        } else {
          categoryMap.set(transaction.categoryId, {
            categoryId: transaction.categoryId,
            spent: transaction.amount,
            transactionCount: 1,
          });
        }
      }

      const categorySpending = Array.from(categoryMap.values());
      const categories = await CategoryService.listByUser(userId);
      const categoryNameMap = new Map(categories.map((c) => [c.id, c.name]));

      for (const spending of categorySpending) {
        spending.categoryName = categoryNameMap.get(spending.categoryId);
      }

      return categorySpending;
    } catch (error) {
      logger.error(
        "Error calculating category spending",
        error instanceof Error ? error : undefined,
      );
      throw error;
    }
  }

  static async calculateBudgetVsActual(
    budget: Budget,
    options: BudgetCalculationOptions = {},
  ): Promise<BudgetVsActual> {
    const period = BudgetCalculationService.getCalculationPeriod(budget);

    const categorySpending =
      await BudgetCalculationService.calculateCategorySpending(
        budget.userId,
        period,
        budget.categoryIds.length > 0 ? budget.categoryIds : undefined,
      );

    const spent = categorySpending.reduce((sum, cat) => sum + cat.spent, 0);

    const remaining = budget.amount - spent;
    const percentageUsed = (spent / budget.amount) * 100;
    const isOverBudget = spent > budget.amount;

    const alertTriggered =
      budget.alertThreshold !== undefined &&
      percentageUsed / 100 >= budget.alertThreshold;

    return {
      budgetId: budget.id,
      budgetName: budget.name,
      budgetAmount: budget.amount,
      spent,
      remaining,
      percentageUsed,
      isOverBudget,
      categoryIds: budget.categoryIds,
      categoryBreakdown: options.includeCategoryBreakdown
        ? categorySpending
        : [],
      alertTriggered,
      alertThreshold: budget.alertThreshold,
    };
  }

  static async calculateBudgetSummary(
    userId: string,
    period?: CalculationPeriod,
    options: BudgetCalculationOptions = {},
  ): Promise<BudgetCalculationSummary> {
    try {
      const budgets = options.includeInactive
        ? await BudgetService.listByUser(userId)
        : await BudgetService.listActiveByUser(userId);

      const calculationPeriod =
        period ||
        ({
          startDate: new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1,
          ).getTime(),
          endDate: new Date(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            0,
            23,
            59,
            59,
            999,
          ).getTime(),
          period: "monthly",
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
        } as CalculationPeriod);

      const budgetResults: BudgetVsActual[] = [];
      for (const budget of budgets) {
        const result = await BudgetCalculationService.calculateBudgetVsActual(
          budget,
          options,
        );
        budgetResults.push(result);

        if (options.updateBudgets) {
          await BudgetService.updateSpent({
            id: budget.id,
            userId: budget.userId,
            spent: result.spent,
            lastCalculatedAt: Date.now(),
          });
        }

        if (options.checkAlerts && result.alertTriggered) {
          await AuditService.recordEvent({
            eventType: "budget.alert_triggered",
            userId: budget.userId,
            resourceType: "budget",
            resourceId: budget.id,
            metadata: {
              source: "system",
              newValues: {
                spent: result.spent,
                budgetAmount: result.budgetAmount,
                percentageUsed: result.percentageUsed,
                alertThreshold: result.alertThreshold,
              },
            },
          }).catch((error) => {
            console.error("Failed to record alert event:", error);
          });
        }
      }

      const totalBudgeted = budgetResults.reduce(
        (sum, b) => sum + b.budgetAmount,
        0,
      );
      const totalSpent = budgetResults.reduce((sum, b) => sum + b.spent, 0);
      const totalRemaining = totalBudgeted - totalSpent;
      const overallPercentageUsed =
        totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
      const budgetsNeedingAttention = budgetResults.filter(
        (b) => b.isOverBudget || b.alertTriggered,
      ).length;

      return {
        period: calculationPeriod,
        budgets: budgetResults,
        totalBudgeted,
        totalSpent,
        totalRemaining,
        overallPercentageUsed,
        budgetsNeedingAttention,
        calculatedAt: Date.now(),
      };
    } catch (error) {
      logger.error(
        "Error calculating budget summary",
        error instanceof Error ? error : undefined,
      );
      throw error;
    }
  }

  static async updateAllBudgets(userId: string): Promise<number> {
    try {
      const budgets = await BudgetService.listActiveByUser(userId);
      let updatedCount = 0;

      for (const budget of budgets) {
        const result =
          await BudgetCalculationService.calculateBudgetVsActual(budget);

        await BudgetService.updateSpent({
          id: budget.id,
          userId: budget.userId,
          spent: result.spent,
          lastCalculatedAt: Date.now(),
        });

        updatedCount++;
      }

      await AuditService.recordEvent({
        eventType: "budget.spent_updated",
        userId,
        resourceType: "budget",
        resourceId: "bulk",
        metadata: {
          source: "system",
          newValues: {
            updatedCount,
          },
        },
      }).catch((error) => {
        console.error("Failed to record audit event:", error);
      });

      return updatedCount;
    } catch (error) {
      logger.error(
        "Error updating all budgets",
        error instanceof Error ? error : undefined,
      );
      throw error;
    }
  }

  static async getBudgetsNeedingAlerts(
    userId: string,
  ): Promise<BudgetVsActual[]> {
    try {
      const summary = await BudgetCalculationService.calculateBudgetSummary(
        userId,
        undefined,
        { checkAlerts: false },
      );

      return summary.budgets.filter((b) => b.alertTriggered || b.isOverBudget);
    } catch (error) {
      logger.error(
        "Error getting budgets needing alerts",
        error instanceof Error ? error : undefined,
      );
      throw error;
    }
  }
}
