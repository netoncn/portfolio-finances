"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AccountFormDialog } from "@/components/accounts/AccountFormDialog";
import { AccountsTable } from "@/components/accounts/AccountsTable";
import { Button } from "@/components/ui/button";
import type { Account } from "@/domain/accounts/types/account";
import { useAccounts } from "@/hooks/use-accounts";

export default function AccountsPage() {
  const t = useTranslations("accounts");
  const tCommon = useTranslations("common");
  const [includeArchived, setIncludeArchived] = useState(false);
  const {
    data: accounts = [],
    isLoading,
    error,
  } = useAccounts(includeArchived);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | undefined>();
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");

  const handleCreateAccount = () => {
    setSelectedAccount(undefined);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleAccountClick = (account: Account) => {
    setSelectedAccount(account);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-destructive mb-2">
              {tCommon("error")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : tCommon("error")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t("title")}
            </h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>
          <Button size="lg" onClick={handleCreateAccount}>
            <Plus className="size-4" />
            {t("actions.new")}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-border rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t("stats.total")}
                </p>
                <p className="text-3xl font-bold text-primary">
                  {accounts.filter((a) => !a.archived).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t("stats.creditCards")}
                </p>
                <p className="text-3xl font-bold text-chart-2">
                  {
                    accounts.filter(
                      (a) => a.accountType === "card_credit" && !a.archived,
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t("stats.bankAccounts")}
                </p>
                <p className="text-3xl font-bold text-chart-3">
                  {
                    accounts.filter(
                      (a) =>
                        (a.accountType === "bank_checking" ||
                          a.accountType === "bank_savings") &&
                        !a.archived,
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t("stats.availableCredit")}
                </p>
                <p className="text-2xl font-bold text-chart-4">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(
                    accounts
                      .filter((a) => !a.archived)
                      .reduce(
                        (sum, a) => sum + (a.billing?.creditLimit || 0),
                        0,
                      ),
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <AccountsTable
          accounts={accounts}
          isLoading={isLoading}
          onAccountClick={handleAccountClick}
        />

        <AccountFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          account={selectedAccount}
          mode={dialogMode}
        />
      </div>
    </div>
  );
}
