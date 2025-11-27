import "server-only";
import type { Transaction } from "@/domain/transactions/types/transaction";
import { logger } from "@/lib/logger";
import type { Budget } from "../types/budget";
import { BudgetService } from "./budget.service";
import { BudgetCalculationService } from "./budget-calculation.service";

export class BudgetRecomputeService {
  static async recomputeAffectedBudgets(
    userId: string,
    transaction: Transaction,
    oldTransaction?: Transaction,
  ): Promise<void> {
    try {
      const budgets = await BudgetService.listActiveByUser(userId);

      if (budgets.length === 0) {
        logger.info("No active budgets to recompute", { userId });
        return;
      }

      const affectedBudgets = BudgetRecomputeService.findAffectedBudgets(
        budgets,
        transaction,
        oldTransaction,
      );

      if (affectedBudgets.length === 0) {
        logger.info("No budgets affected by transaction", {
          userId,
          transactionId: transaction.id,
        });
        return;
      }

      logger.info(`Recomputing ${affectedBudgets.length} affected budgets`, {
        userId,
        transactionId: transaction.id,
        budgetCount: affectedBudgets.length,
      });

      await Promise.all(
        affectedBudgets.map((budget) =>
          BudgetRecomputeService.recomputeSingleBudget(budget).catch(
            (error) => {
              logger.error(`Failed to recompute budget ${budget.id}`, error);
            },
          ),
        ),
      );
    } catch (error) {
      logger.error(
        "Error recomputing affected budgets",
        error instanceof Error ? error : undefined,
      );
    }
  }

  private static findAffectedBudgets(
    budgets: Budget[],
    transaction: Transaction,
    oldTransaction?: Transaction,
  ): Budget[] {
    const affected = new Set<Budget>();

    if (transaction.type === "expense") {
      for (const budget of budgets) {
        if (
          BudgetRecomputeService.isTransactionInBudgetPeriod(
            transaction,
            budget,
          )
        ) {
          if (
            budget.categoryIds.length === 0 ||
            (transaction.categoryId &&
              budget.categoryIds.includes(transaction.categoryId))
          ) {
            affected.add(budget);
          }
        }
      }
    }

    if (
      oldTransaction &&
      oldTransaction.type === "expense" &&
      oldTransaction.id === transaction.id
    ) {
      for (const budget of budgets) {
        if (
          BudgetRecomputeService.isTransactionInBudgetPeriod(
            oldTransaction,
            budget,
          )
        ) {
          if (
            budget.categoryIds.length === 0 ||
            (oldTransaction.categoryId &&
              budget.categoryIds.includes(oldTransaction.categoryId))
          ) {
            affected.add(budget);
          }
        }
      }
    }

    return Array.from(affected);
  }

  private static isTransactionInBudgetPeriod(
    transaction: Transaction,
    budget: Budget,
  ): boolean {
    const period = BudgetCalculationService.getCalculationPeriod(budget);
    const transactionDate = transaction.date;

    return (
      transactionDate >= period.startDate && transactionDate <= period.endDate
    );
  }

  static async recomputeSingleBudget(budget: Budget): Promise<Budget | null> {
    try {
      const result =
        await BudgetCalculationService.calculateBudgetVsActual(budget);

      const updatedBudget = await BudgetService.updateSpent({
        id: budget.id,
        userId: budget.userId,
        spent: result.spent,
        lastCalculatedAt: Date.now(),
      });

      if (!updatedBudget) {
        logger.warn(`Budget ${budget.id} not found when updating spent`);
        return null;
      }

      logger.info(`Budget ${budget.id} recomputed successfully`, {
        budgetId: budget.id,
        previousSpent: budget.spent,
        newSpent: result.spent,
        budgetAmount: budget.amount,
        percentageUsed: result.percentageUsed,
      });

      return updatedBudget;
    } catch (error: unknown) {
      logger.error(
        `Error recomputing budget ${budget.id}`,
        error instanceof Error ? error : undefined,
      );
      throw error;
    }
  }

  static async recomputeAllBudgets(userId: string): Promise<{
    success: number;
    failed: number;
    total: number;
  }> {
    try {
      const budgets = await BudgetService.listActiveByUser(userId);

      if (budgets.length === 0) {
        return { success: 0, failed: 0, total: 0 };
      }

      logger.info(`Starting batch recompute for ${budgets.length} budgets`, {
        userId,
      });

      let success = 0;
      let failed = 0;

      await Promise.all(
        budgets.map(async (budget) => {
          try {
            await BudgetRecomputeService.recomputeSingleBudget(budget);
            success++;
          } catch (error: unknown) {
            logger.error(
              `Failed to recompute budget ${budget.id}`,
              error instanceof Error ? error : undefined,
            );
            failed++;
          }
        }),
      );

      logger.info(`Batch recompute completed`, {
        userId,
        total: budgets.length,
        success,
        failed,
      });

      return {
        success,
        failed,
        total: budgets.length,
      };
    } catch (error) {
      logger.error(
        "Error in batch recompute",
        error instanceof Error ? error : undefined,
      );
      throw error;
    }
  }

  static async recomputeBudgetById(
    budgetId: string,
    userId: string,
  ): Promise<Budget | null> {
    try {
      const budget = await BudgetService.getById(budgetId, userId);

      if (!budget) {
        logger.warn(`Budget ${budgetId} not found for recompute`);
        return null;
      }

      return await BudgetRecomputeService.recomputeSingleBudget(budget);
    } catch (error) {
      logger.error(
        `Error recomputing budget ${budgetId}`,
        error instanceof Error ? error : undefined,
      );
      throw error;
    }
  }
}
