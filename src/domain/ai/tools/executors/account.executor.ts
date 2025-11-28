import "server-only";

import { AccountService } from "@/domain/accounts/services/account.service";
import type { Account, AccountType } from "@/domain/accounts/types/account";
import { TransactionService } from "@/domain/transactions/services/transaction.service";
import type { TransactionType } from "@/domain/transactions/types/transaction";
import type {
  GetAccountBalanceInput,
  GetAccountsSummaryInput,
  GetCreditCardInfoInput,
} from "../account.tools";
import type {
  AllToolName,
  MoneyAmount,
  ToolExecutionContext,
  ToolResult,
} from "../base.types";
import { formatMoney } from "../base.types";

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  card_credit: "Cartão de Crédito",
  card_debit: "Cartão de Débito",
  prepaid: "Pré-pago",
  wallet_cash: "Dinheiro",
  bank_checking: "Conta Corrente",
  bank_savings: "Poupança",
};

const TOOL_TO_ACCOUNT_TYPE: Record<string, AccountType[]> = {
  checking: ["bank_checking"],
  savings: ["bank_savings"],
  credit_card: ["card_credit"],
  investment: [], // Not in Account types
  cash: ["wallet_cash"],
  other: ["prepaid", "card_debit"],
};

function isCreditCard(accountType: AccountType): boolean {
  return accountType === "card_credit";
}

function getAccountBalance(account: Account): number {
  // For credit cards, balance is available credit minus limit (debt)
  if (isCreditCard(account.accountType) && account.billing) {
    const limit = account.billing.creditLimit || 0;
    const available = account.billing.availableCredit || limit;
    return -(limit - available); // Negative for debt
  }
  return 0;
}

export async function executeAccountTool(
  context: ToolExecutionContext,
  toolName: AllToolName,
  input: Record<string, unknown>,
): Promise<ToolResult<unknown>> {
  try {
    switch (toolName) {
      case "get_accounts_summary":
        return await getAccountsSummary(
          context,
          input as unknown as GetAccountsSummaryInput,
        );

      case "get_account_balance":
        return await getAccountBalance_tool(
          context,
          input as unknown as GetAccountBalanceInput,
        );

      case "get_credit_card_info":
        return await getCreditCardInfo(
          context,
          input as unknown as GetCreditCardInfoInput,
        );

      default:
        return { success: false, error: `Unknown account tool: ${toolName}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function getAccountsSummary(
  context: ToolExecutionContext,
  input: GetAccountsSummaryInput,
): Promise<ToolResult<unknown>> {
  const includeArchived = input.includeArchived || false;
  let accounts = await AccountService.listByUser(
    context.userId,
    includeArchived,
  );

  if (input.type) {
    const accountTypes = TOOL_TO_ACCOUNT_TYPE[input.type] || [];
    if (accountTypes.length > 0) {
      accounts = accounts.filter((a) => accountTypes.includes(a.accountType));
    }
  }

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

  const accountTransactions = new Map<
    string,
    { lastDate: number; count: number }
  >();
  for (const tx of transactions) {
    const existing = accountTransactions.get(tx.accountId) || {
      lastDate: 0,
      count: 0,
    };
    existing.lastDate = Math.max(existing.lastDate, tx.date);
    existing.count += 1;
    accountTransactions.set(tx.accountId, existing);
  }

  const accountSummaries = accounts.map((account) => {
    const txInfo = accountTransactions.get(account.id);
    const balance = getAccountBalance(account);

    return {
      id: account.id,
      name: account.name,
      type: account.accountType,
      typeLabel: ACCOUNT_TYPE_LABELS[account.accountType],
      institution: account.issuer,
      balance: formatMoney(balance),
      isArchived: account.archived || false,
      lastTransactionDate: txInfo
        ? new Date(txInfo.lastDate).toISOString()
        : undefined,
      transactionCount: txInfo?.count,
    };
  });

  const byType = new Map<string, { count: number; total: number }>();
  for (const account of accounts) {
    const balance = getAccountBalance(account);
    const existing = byType.get(account.accountType) || { count: 0, total: 0 };
    existing.count += 1;
    existing.total += balance;
    byType.set(account.accountType, existing);
  }

  const byTypeArray = Array.from(byType.entries()).map(([type, data]) => ({
    type,
    typeLabel: ACCOUNT_TYPE_LABELS[type as AccountType] || type,
    count: data.count,
    totalBalance: formatMoney(data.total),
  }));

  const totalBalance = accounts.reduce(
    (sum, a) => sum + getAccountBalance(a),
    0,
  );

  const assets = accounts
    .filter((a) => !isCreditCard(a.accountType))
    .reduce((sum, a) => sum + getAccountBalance(a), 0);

  const liabilities = accounts
    .filter((a) => isCreditCard(a.accountType))
    .reduce((sum, a) => sum + Math.abs(getAccountBalance(a)), 0);

  const netWorth = assets - liabilities;

  return {
    success: true,
    data: {
      accounts: accountSummaries,
      summary: {
        totalAccounts: accounts.length,
        totalBalance: formatMoney(totalBalance),
        byType: byTypeArray,
      },
      netWorth: formatMoney(netWorth),
    },
  };
}

async function getAccountBalance_tool(
  context: ToolExecutionContext,
  input: GetAccountBalanceInput,
): Promise<ToolResult<unknown>> {
  const account = await AccountService.getById(input.accountId, context.userId);

  if (!account) {
    return { success: false, error: "Account not found" };
  }

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

  const transactions = await TransactionService.listByAccount(
    input.accountId,
    context.userId,
  );
  const monthTransactions = transactions.filter(
    (t) => t.date >= monthStart && t.date <= monthEnd,
  );

  const income = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const expenses = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netChange = income - expenses;

  let recentTransactions:
    | Array<{
        id: string;
        date: string;
        description: string | undefined;
        amount: MoneyAmount;
        type: TransactionType;
      }>
    | undefined;
  if (input.includeRecentTransactions) {
    const limit = input.transactionLimit || 10;
    const sorted = [...transactions]
      .sort((a, b) => b.date - a.date)
      .slice(0, limit);

    recentTransactions = sorted.map((tx) => ({
      id: tx.id,
      date: new Date(tx.date).toISOString(),
      description: tx.description,
      amount: formatMoney(tx.amount),
      type: tx.type,
    }));
  }

  const maskedAccountNumber = account.last4
    ? `****${account.last4}`
    : undefined;

  return {
    success: true,
    data: {
      account: {
        id: account.id,
        name: account.name,
        type: account.accountType,
        typeLabel: ACCOUNT_TYPE_LABELS[account.accountType],
        institution: account.issuer,
        accountNumber: maskedAccountNumber,
      },
      balance: formatMoney(getAccountBalance(account)),
      monthlyActivity: {
        income: formatMoney(income),
        expenses: formatMoney(expenses),
        netChange: formatMoney(netChange),
        transactionCount: monthTransactions.length,
      },
      recentTransactions,
    },
  };
}

async function getCreditCardInfo(
  context: ToolExecutionContext,
  input: GetCreditCardInfoInput,
): Promise<ToolResult<unknown>> {
  let accounts = await AccountService.listByUser(context.userId);

  accounts = accounts.filter((a) => isCreditCard(a.accountType));

  if (input.accountId) {
    accounts = accounts.filter((a) => a.id === input.accountId);
  }

  if (accounts.length === 0) {
    return {
      success: true,
      data: {
        cards: [],
        summary: {
          totalCards: 0,
          totalCreditLimit: formatMoney(0),
          totalBalance: formatMoney(0),
          totalAvailableCredit: formatMoney(0),
          avgUtilization: 0,
          cardsOverThreshold: 0,
        },
        alerts: [],
      },
    };
  }

  const HIGH_UTILIZATION_THRESHOLD = 70;
  const alerts: Array<{
    cardName: string;
    alertType: "high_utilization" | "due_soon" | "over_limit";
    message: string;
  }> = [];

  const cards = accounts.map((account) => {
    const creditLimit = account.billing?.creditLimit || 0;
    const availableCredit = account.billing?.availableCredit || creditLimit;
    const currentBalance = creditLimit - availableCredit; // What is owed
    const utilizationPercent =
      creditLimit > 0 ? (currentBalance / creditLimit) * 100 : 0;

    if (utilizationPercent >= 100) {
      alerts.push({
        cardName: account.name,
        alertType: "over_limit",
        message: `${account.name} está acima do limite de crédito`,
      });
    } else if (utilizationPercent >= HIGH_UTILIZATION_THRESHOLD) {
      alerts.push({
        cardName: account.name,
        alertType: "high_utilization",
        message: `${account.name} está com ${Math.round(utilizationPercent)}% do limite utilizado`,
      });
    }

    if (account.billing?.dueDay) {
      const now = new Date();
      const dueDay = account.billing.dueDay;
      const daysUntilDue =
        dueDay >= now.getDate()
          ? dueDay - now.getDate()
          : dueDay + (30 - now.getDate());

      if (daysUntilDue <= 5 && currentBalance > 0) {
        alerts.push({
          cardName: account.name,
          alertType: "due_soon",
          message: `Fatura de ${account.name} vence em ${daysUntilDue} dia${daysUntilDue !== 1 ? "s" : ""}`,
        });
      }
    }

    let statement:
      | {
          periodStart: string;
          periodEnd: string;
          totalSpent: MoneyAmount;
          minimumPayment: MoneyAmount;
          dueDate: string;
          isPaid: boolean;
        }
      | undefined;
    if (input.includeStatement && account.billing) {
      const now = new Date();
      const closingDay = account.billing.closingDay || 1;
      const dueDay = account.billing.dueDay || 10;

      const periodEnd = new Date(now.getFullYear(), now.getMonth(), closingDay);
      const periodStart = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        closingDay + 1,
      );
      const nextDueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);

      statement = {
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        totalSpent: formatMoney(currentBalance),
        minimumPayment: formatMoney(Math.round(currentBalance * 0.15)), // Approximate 15% minimum
        dueDate: nextDueDate.toISOString(),
        isPaid: currentBalance === 0,
      };
    }

    return {
      accountId: account.id,
      name: account.name,
      institution: account.issuer,
      brand: account.cardBrand,
      last4Digits: account.last4,
      creditLimit: formatMoney(creditLimit),
      currentBalance: formatMoney(currentBalance),
      availableCredit: formatMoney(availableCredit),
      utilizationPercent: Math.round(utilizationPercent * 10) / 10,
      dueDate: account.billing?.dueDay,
      closingDate: account.billing?.closingDay,
      statement,
    };
  });

  const totalCreditLimit = cards.reduce(
    (sum, c) => sum + c.creditLimit.value,
    0,
  );
  const totalBalance = cards.reduce(
    (sum, c) => sum + c.currentBalance.value,
    0,
  );
  const totalAvailableCredit = cards.reduce(
    (sum, c) => sum + c.availableCredit.value,
    0,
  );
  const avgUtilization =
    totalCreditLimit > 0 ? (totalBalance / totalCreditLimit) * 100 : 0;
  const cardsOverThreshold = cards.filter(
    (c) => c.utilizationPercent >= HIGH_UTILIZATION_THRESHOLD,
  ).length;

  return {
    success: true,
    data: {
      cards,
      summary: {
        totalCards: cards.length,
        totalCreditLimit: formatMoney(totalCreditLimit),
        totalBalance: formatMoney(totalBalance),
        totalAvailableCredit: formatMoney(totalAvailableCredit),
        avgUtilization: Math.round(avgUtilization * 10) / 10,
        cardsOverThreshold,
      },
      alerts,
    },
  };
}
