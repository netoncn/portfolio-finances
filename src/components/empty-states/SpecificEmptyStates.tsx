"use client";

import {
  AlertCircle,
  BarChart3,
  CreditCard,
  FileText,
  FolderOpen,
  PiggyBank,
  Receipt,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "./EmptyState";

export function EmptyTransactions({ onAdd }: { onAdd?: () => void }) {
  const t = useTranslations("emptyStates.transactions");

  return (
    <EmptyState
      icon={Receipt}
      title={t("title")}
      description={t("description")}
      action={
        onAdd
          ? {
              label: t("action"),
              onClick: onAdd,
            }
          : undefined
      }
    />
  );
}

export function EmptyAccounts({ onAdd }: { onAdd?: () => void }) {
  const t = useTranslations("emptyStates.accounts");

  return (
    <EmptyState
      icon={Wallet}
      title={t("title")}
      description={t("description")}
      action={
        onAdd
          ? {
              label: t("action"),
              onClick: onAdd,
            }
          : undefined
      }
    />
  );
}

export function EmptyBudgets({ onAdd }: { onAdd?: () => void }) {
  const t = useTranslations("emptyStates.budgets");

  return (
    <EmptyState
      icon={PiggyBank}
      title={t("title")}
      description={t("description")}
      action={
        onAdd
          ? {
              label: t("action"),
              onClick: onAdd,
            }
          : undefined
      }
    />
  );
}

export function EmptyGoals({ onAdd }: { onAdd?: () => void }) {
  const t = useTranslations("emptyStates.goals");

  return (
    <EmptyState
      icon={Target}
      title={t("title")}
      description={t("description")}
      action={
        onAdd
          ? {
              label: t("action"),
              onClick: onAdd,
            }
          : undefined
      }
    />
  );
}

export function EmptyCategories({ onAdd }: { onAdd?: () => void }) {
  const t = useTranslations("emptyStates.categories");

  return (
    <EmptyState
      icon={FolderOpen}
      title={t("title")}
      description={t("description")}
      action={
        onAdd
          ? {
              label: t("action"),
              onClick: onAdd,
            }
          : undefined
      }
    />
  );
}

export function EmptySearchResults() {
  const t = useTranslations("emptyStates.search");

  return (
    <EmptyState
      icon={FileText}
      title={t("title")}
      description={t("description")}
    />
  );
}

export function EmptyDashboard() {
  const t = useTranslations("emptyStates.dashboard");

  return (
    <EmptyState
      icon={BarChart3}
      title={t("title")}
      description={t("description")}
    />
  );
}

export function EmptyChart() {
  const t = useTranslations("emptyStates.chart");

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-6">
      <TrendingUp
        className="h-8 w-8 text-muted-foreground mb-2"
        aria-hidden="true"
      />
      <p className="text-sm text-muted-foreground">{t("title")}</p>
    </div>
  );
}

export function EmptyBudgetAlerts() {
  const t = useTranslations("emptyStates.budgetAlerts");

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <AlertCircle
        className="h-8 w-8 text-muted-foreground mb-2"
        aria-hidden="true"
      />
      <p className="text-sm text-muted-foreground">{t("title")}</p>
    </div>
  );
}

export function EmptyCreditCards({ onAdd }: { onAdd?: () => void }) {
  const t = useTranslations("emptyStates.creditCards");

  return (
    <EmptyState
      icon={CreditCard}
      title={t("title")}
      description={t("description")}
      action={
        onAdd
          ? {
              label: t("action"),
              onClick: onAdd,
            }
          : undefined
      }
    />
  );
}
