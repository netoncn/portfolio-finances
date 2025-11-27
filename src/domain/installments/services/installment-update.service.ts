import "server-only";
import { TransactionService } from "@/domain/transactions/services/transaction.service";
import type { Transaction } from "@/domain/transactions/types/transaction";
import { logger } from "@/lib/logger";
import type { InstallmentGroup, UpdateInstallmentGroupDTO } from "../index";
import { InstallmentGenerationService } from "./installment-generation.service";
import { InstallmentGroupService } from "./installment-group.service";

export interface UpdateInstallmentGroupOptions {
  regenerateTransactions?: boolean;
  description?: string;
  merchant?: string;
  categoryId?: string;
  tags?: string[];
}

export interface UpdateInstallmentGroupResult {
  installmentGroup: InstallmentGroup;
  transactions?: Transaction[];
  regenerated: boolean;
}

export interface CancelInstallmentsOptions {
  reason?: string;
  deleteGroup?: boolean;
}

export interface CancelInstallmentsResult {
  canceledCount: number;
  groupDeleted: boolean;
  transactionIds: string[];
}

export class InstallmentUpdateService {
  static async updateGroup(
    dto: UpdateInstallmentGroupDTO,
    options: UpdateInstallmentGroupOptions = {},
  ): Promise<UpdateInstallmentGroupResult> {
    const { regenerateTransactions = false } = options;

    const installmentGroup = await InstallmentGroupService.update(dto);

    if (!installmentGroup) {
      throw new Error(`Installment group not found: ${dto.id}`);
    }

    let transactions: Transaction[] | undefined;
    let regenerated = false;

    if (regenerateTransactions) {
      const result = await InstallmentGenerationService.regenerateTransactions(
        installmentGroup.id!,
        dto.userId,
        {
          description: options.description || "Installment",
          merchant: options.merchant || installmentGroup.merchant,
          categoryId: options.categoryId,
          tags: options.tags,
        },
      );

      transactions = result.transactions;
      regenerated = true;

      logger.info(
        `Regenerated ${result.count} transactions for installment group ${installmentGroup.id}`,
        {
          installmentGroupId: installmentGroup.id,
          transactionCount: result.count,
        },
      );
    }

    return {
      installmentGroup,
      transactions,
      regenerated,
    };
  }

  static async recalculateInstallments(
    installmentGroupId: string,
    userId: string,
    description: string,
    merchant?: string,
  ) {
    return InstallmentGenerationService.regenerateTransactions(
      installmentGroupId,
      userId,
      {
        description,
        merchant,
      },
    );
  }

  static async cancelInstallments(
    installmentGroupId: string,
    userId: string,
    options: CancelInstallmentsOptions = {},
  ): Promise<CancelInstallmentsResult> {
    const { deleteGroup = false } = options;

    const allTransactions = await TransactionService.listByUser(userId);
    const groupTransactions = allTransactions.filter(
      (t) => t.installmentGroupId === installmentGroupId,
    );

    if (groupTransactions.length === 0) {
      logger.warn(
        `No transactions found for installment group ${installmentGroupId}`,
        {
          installmentGroupId,
          userId,
        },
      );
    }

    const transactionIds: string[] = [];
    let canceledCount = 0;

    for (const transaction of groupTransactions) {
      if (deleteGroup) {
        await TransactionService.delete(transaction.id, userId);
      } else {
        await TransactionService.update({
          id: transaction.id,
          userId,
          status: "canceled",
        });
      }

      transactionIds.push(transaction.id);
      canceledCount++;
    }

    let groupDeleted = false;
    if (deleteGroup) {
      groupDeleted = await InstallmentGroupService.delete(
        installmentGroupId,
        userId,
      );
    }

    logger.info(
      `Canceled ${canceledCount} installments for group ${installmentGroupId}`,
      {
        installmentGroupId,
        canceledCount,
        groupDeleted,
      },
    );

    return {
      canceledCount,
      groupDeleted,
      transactionIds,
    };
  }

  static async cancelSingleInstallment(
    transactionId: string,
    userId: string,
    deleteTransaction = false,
  ): Promise<boolean> {
    if (deleteTransaction) {
      return TransactionService.delete(transactionId, userId);
    }

    const transaction = await TransactionService.update({
      id: transactionId,
      userId,
      status: "canceled",
    });

    return transaction !== null;
  }

  static async batchUpdateInstallments(
    installmentGroupId: string,
    userId: string,
    updates: {
      status?: "scheduled" | "posted" | "paid" | "canceled" | "refunded";
      categoryId?: string;
      tags?: string[];
    },
  ): Promise<number> {
    const allTransactions = await TransactionService.listByUser(userId);
    const groupTransactions = allTransactions.filter(
      (t) => t.installmentGroupId === installmentGroupId,
    );

    let updatedCount = 0;

    for (const transaction of groupTransactions) {
      const result = await TransactionService.update({
        id: transaction.id,
        userId,
        ...updates,
      });

      if (result) {
        updatedCount++;
      }
    }

    logger.info(
      `Batch updated ${updatedCount} installments for group ${installmentGroupId}`,
      {
        installmentGroupId,
        updatedCount,
        updateStatus: updates.status,
        updateCategoryId: updates.categoryId,
        updateTagsCount: updates.tags?.length,
      },
    );

    return updatedCount;
  }

  static async markAllAsPaid(
    installmentGroupId: string,
    userId: string,
  ): Promise<number> {
    return InstallmentUpdateService.batchUpdateInstallments(
      installmentGroupId,
      userId,
      {
        status: "paid",
      },
    );
  }

  static async getInstallmentSummary(
    installmentGroupId: string,
    userId: string,
  ): Promise<{
    total: number;
    scheduled: number;
    posted: number;
    paid: number;
    canceled: number;
    refunded: number;
    totalAmount: number;
    paidAmount: number;
  }> {
    const allTransactions = await TransactionService.listByUser(userId);
    const groupTransactions = allTransactions.filter(
      (t) => t.installmentGroupId === installmentGroupId,
    );

    const summary = {
      total: groupTransactions.length,
      scheduled: 0,
      posted: 0,
      paid: 0,
      canceled: 0,
      refunded: 0,
      totalAmount: 0,
      paidAmount: 0,
    };

    for (const transaction of groupTransactions) {
      summary.totalAmount += transaction.amount;

      switch (transaction.status) {
        case "scheduled":
          summary.scheduled++;
          break;
        case "posted":
          summary.posted++;
          break;
        case "paid":
          summary.paid++;
          summary.paidAmount += transaction.amount;
          break;
        case "canceled":
          summary.canceled++;
          break;
        case "refunded":
          summary.refunded++;
          break;
      }
    }

    return summary;
  }
}
