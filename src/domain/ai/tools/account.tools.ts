import type {
  AccountToolName,
  AccountType,
  MoneyAmount,
  ToolDefinition,
} from "./base.types";

export interface GetAccountsSummaryInput {
  type?: AccountType;
  includeArchived?: boolean;
}

export interface GetAccountBalanceInput {
  accountId: string;
  includeRecentTransactions?: boolean;
  transactionLimit?: number;
}

export interface GetCreditCardInfoInput {
  accountId?: string;
  includeStatement?: boolean;
}

export interface AccountSummaryItem {
  id: string;
  name: string;
  type: AccountType;
  typeLabel: string;
  institution?: string;
  balance: MoneyAmount;
  isArchived: boolean;
  lastTransactionDate?: string;
  transactionCount?: number;
}

export interface GetAccountsSummaryOutput {
  accounts: AccountSummaryItem[];
  summary: {
    totalAccounts: number;
    totalBalance: MoneyAmount;
    byType: Array<{
      type: AccountType;
      typeLabel: string;
      count: number;
      totalBalance: MoneyAmount;
    }>;
  };
  netWorth: MoneyAmount;
}

export interface RecentAccountTransaction {
  id: string;
  date: string;
  description: string;
  amount: MoneyAmount;
  type: "income" | "expense" | "transfer";
  categoryName?: string;
  runningBalance?: MoneyAmount;
}

export interface GetAccountBalanceOutput {
  account: {
    id: string;
    name: string;
    type: AccountType;
    typeLabel: string;
    institution?: string;
    accountNumber?: string;
  };
  balance: MoneyAmount;
  monthlyActivity: {
    income: MoneyAmount;
    expenses: MoneyAmount;
    netChange: MoneyAmount;
    transactionCount: number;
  };
  recentTransactions?: RecentAccountTransaction[];
}

export interface CreditCardInfo {
  accountId: string;
  name: string;
  institution?: string;
  brand?: string;
  last4Digits?: string;
  creditLimit: MoneyAmount;
  currentBalance: MoneyAmount;
  availableCredit: MoneyAmount;
  utilizationPercent: number;
  dueDate?: number;
  closingDate?: number;
  statement?: {
    periodStart: string;
    periodEnd: string;
    totalSpent: MoneyAmount;
    minimumPayment: MoneyAmount;
    dueDate: string;
    isPaid: boolean;
  };
}

export interface GetCreditCardInfoOutput {
  cards: CreditCardInfo[];
  summary: {
    totalCards: number;
    totalCreditLimit: MoneyAmount;
    totalBalance: MoneyAmount;
    totalAvailableCredit: MoneyAmount;
    avgUtilization: number;
    cardsOverThreshold: number;
  };
  alerts: Array<{
    cardName: string;
    alertType: "high_utilization" | "due_soon" | "over_limit";
    message: string;
  }>;
}

export const ACCOUNT_TOOLS_SCHEMAS: ToolDefinition[] = [
  {
    name: "get_accounts_summary",
    description:
      "Get a summary of all financial accounts including balances, types, and net worth calculation.",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: [
            "checking",
            "savings",
            "credit_card",
            "investment",
            "cash",
            "other",
          ],
          description: "Filter by account type",
        },
        includeArchived: {
          type: "boolean",
          description: "Include archived/inactive accounts",
        },
      },
    },
  },
  {
    name: "get_account_balance",
    description:
      "Get detailed balance and activity information for a specific account, including recent transactions.",
    parameters: {
      type: "object",
      properties: {
        accountId: {
          type: "string",
          description: "The account ID to query",
        },
        includeRecentTransactions: {
          type: "boolean",
          description: "Include a list of recent transactions",
        },
        transactionLimit: {
          type: "number",
          description: "Number of recent transactions to include (default: 10)",
          minimum: 1,
          maximum: 50,
        },
      },
      required: ["accountId"],
    },
  },
  {
    name: "get_credit_card_info",
    description:
      "Get credit card details including limits, balances, utilization, and statement information. Includes alerts for high utilization or upcoming due dates.",
    parameters: {
      type: "object",
      properties: {
        accountId: {
          type: "string",
          description: "Filter by specific credit card account ID",
        },
        includeStatement: {
          type: "boolean",
          description: "Include current statement details",
        },
      },
    },
  },
];

export function isAccountToolName(name: string): name is AccountToolName {
  return [
    "get_accounts_summary",
    "get_account_balance",
    "get_credit_card_info",
  ].includes(name);
}
