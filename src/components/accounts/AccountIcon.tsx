import { Building2, Coins, CreditCard, PiggyBank, Wallet } from "lucide-react";
import type { Account, AccountType } from "@/domain/accounts/types/account";

interface AccountIconProps {
  accountType: AccountType;
  className?: string;
}

const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  card_credit: "text-purple-600 dark:text-purple-400",
  card_debit: "text-blue-600 dark:text-blue-400",
  prepaid: "text-cyan-600 dark:text-cyan-400",
  wallet_cash: "text-green-600 dark:text-green-400",
  bank_checking: "text-orange-600 dark:text-orange-400",
  bank_savings: "text-yellow-600 dark:text-yellow-400",
};

function getAccountIconComponent(accountType: AccountType) {
  switch (accountType) {
    case "card_credit":
    case "card_debit":
    case "prepaid":
      return CreditCard;
    case "bank_checking":
      return Building2;
    case "bank_savings":
      return PiggyBank;
    case "wallet_cash":
      return Wallet;
    default:
      return Coins;
  }
}

export function AccountIcon({
  accountType,
  className = "size-5",
}: AccountIconProps) {
  const Icon = getAccountIconComponent(accountType);
  const colorClass = ACCOUNT_TYPE_COLORS[accountType];

  return <Icon className={`${className} ${colorClass}`} />;
}

export function AccountCard({
  account,
  className,
}: {
  account: Account;
  className?: string;
}) {
  const Icon = getAccountIconComponent(account.accountType);
  const colorClass = ACCOUNT_TYPE_COLORS[account.accountType];

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors ${className || ""}`}
    >
      <div className={`p-2 rounded-lg bg-accent/50`}>
        <Icon className={`size-5 ${colorClass}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{account.name}</p>
        {account.issuer && (
          <p className="text-xs text-muted-foreground truncate">
            {account.issuer}
          </p>
        )}
      </div>
      {account.last4 && (
        <div className="text-xs text-muted-foreground font-mono">
          •••• {account.last4}
        </div>
      )}
    </div>
  );
}
