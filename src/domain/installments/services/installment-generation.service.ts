import "server-only";
import { AccountService } from "@/domain/accounts/services/account.service";
import type { CreateTransactionDTO } from "@/domain/transactions/dto/transaction.dto";
import { extractDenormalizedFields } from "@/domain/transactions/helpers/denormalization.helper";
import { TransactionService } from "@/domain/transactions/services/transaction.service";
import type { Transaction } from "@/domain/transactions/types/transaction";
import { logger } from "@/lib/logger";
import type {
  DistributionStrategy,
  GenerateInstallmentsConfig,
  InstallmentData,
} from "../helpers/installment-calculation.helper";
import {
  calculateInstallmentTotal,
  generateInstallments,
  validateInstallmentTotals,
} from "../helpers/installment-calculation.helper";
import type { InstallmentGroup } from "../types/installment-group";

export interface GenerateInstallmentTransactionsConfig {
  installmentGroup: InstallmentGroup;
  description: string;
  merchant?: string;
  categoryId?: string;
  tags?: string[];
  interestStrategy?: DistributionStrategy;
  feesStrategy?: DistributionStrategy;
  status?: "scheduled" | "posted" | "paid" | "canceled" | "refunded";
}

export interface GenerateInstallmentTransactionsResult {
  transactions: Transaction[];
  installmentGroupId: string;
  count: number;
  validated: boolean;
}

export class InstallmentGenerationService {
  static async generateTransactions(
    config: GenerateInstallmentTransactionsConfig,
  ): Promise<GenerateInstallmentTransactionsResult> {
    const {
      installmentGroup,
      description,
      merchant,
      categoryId,
      tags,
      interestStrategy = "equal",
      feesStrategy = "first",
      status = "posted",
    } = config;

    const account = await AccountService.getById(
      installmentGroup.cardAccountId,
      installmentGroup.userId,
    );

    if (!account) {
      throw new Error(`Account not found: ${installmentGroup.cardAccountId}`);
    }

    const denormalizedFields = extractDenormalizedFields(account);

    const closingDay = account.billing?.closingDay;

    const installmentConfig: GenerateInstallmentsConfig = {
      installmentCount: installmentGroup.installmentCount,
      originalAmount: installmentGroup.originalAmount,
      interestTotal: installmentGroup.interestTotal,
      feesTotal: installmentGroup.feesTotal,
      firstDueDate: installmentGroup.firstDueDate,
      statementStartMonth: installmentGroup.statementStartMonth,
      closingDay,
      interestStrategy,
      feesStrategy,
    };

    const installmentsData = generateInstallments(installmentConfig);

    const validated = validateInstallmentTotals(
      installmentsData,
      installmentGroup.originalAmount,
      installmentGroup.interestTotal || 0,
      installmentGroup.feesTotal || 0,
    );

    if (!validated) {
      logger.error("Installment totals validation failed", undefined, {
        installmentGroupId: installmentGroup.id,
        expectedOriginal: installmentGroup.originalAmount,
        expectedInterest: installmentGroup.interestTotal || 0,
        expectedFees: installmentGroup.feesTotal || 0,
      });
    }

    const transactions: Transaction[] = [];

    for (const installmentData of installmentsData) {
      const transactionDTO: CreateTransactionDTO = {
        userId: installmentGroup.userId,
        accountId: installmentGroup.cardAccountId,
        ...denormalizedFields,

        date: installmentData.dueDate,
        description: `${description} (${installmentData.installmentNumber}/${installmentData.installmentCount})`,
        merchant: merchant || installmentGroup.merchant,
        amount: calculateInstallmentTotal(installmentData),
        type: "expense",
        categoryId,
        tags,

        installmentGroupId: installmentGroup.id,
        installmentNumber: installmentData.installmentNumber,
        installmentCount: installmentData.installmentCount,
        purchaseDate: installmentGroup.purchaseDate,
        dueDate: installmentData.dueDate,
        statementMonth: installmentData.statementMonth,
        interestAmount: installmentData.interestAmount,
        feesAmount: installmentData.feesAmount,
        status,
      };

      const transaction = await TransactionService.create(transactionDTO);
      transactions.push(transaction);
    }

    return {
      transactions,
      installmentGroupId: installmentGroup.id!,
      count: transactions.length,
      validated,
    };
  }

  static async previewInstallments(
    installmentGroup: InstallmentGroup,
    interestStrategy: DistributionStrategy = "equal",
    feesStrategy: DistributionStrategy = "first",
  ): Promise<InstallmentData[]> {
    const account = await AccountService.getById(
      installmentGroup.cardAccountId,
      installmentGroup.userId,
    );

    const closingDay = account?.billing?.closingDay;

    const installmentConfig: GenerateInstallmentsConfig = {
      installmentCount: installmentGroup.installmentCount,
      originalAmount: installmentGroup.originalAmount,
      interestTotal: installmentGroup.interestTotal,
      feesTotal: installmentGroup.feesTotal,
      firstDueDate: installmentGroup.firstDueDate,
      statementStartMonth: installmentGroup.statementStartMonth,
      closingDay,
      interestStrategy,
      feesStrategy,
    };

    return generateInstallments(installmentConfig);
  }

  static async regenerateTransactions(
    installmentGroupId: string,
    userId: string,
    config: Omit<GenerateInstallmentTransactionsConfig, "installmentGroup">,
  ): Promise<GenerateInstallmentTransactionsResult> {
    const { InstallmentGroupService } = await import(
      "./installment-group.service"
    );
    const installmentGroup = await InstallmentGroupService.getById(
      installmentGroupId,
      userId,
    );

    if (!installmentGroup) {
      throw new Error(`Installment group not found: ${installmentGroupId}`);
    }

    const existingTransactions = await TransactionService.listByUser(userId);
    const groupTransactions = existingTransactions.filter(
      (t) => t.installmentGroupId === installmentGroupId,
    );

    for (const transaction of groupTransactions) {
      await TransactionService.delete(transaction.id, userId);
    }

    logger.info(
      `Deleted ${groupTransactions.length} existing transactions for installment group ${installmentGroupId}`,
    );

    return InstallmentGenerationService.generateTransactions({
      ...config,
      installmentGroup,
    });
  }
}
