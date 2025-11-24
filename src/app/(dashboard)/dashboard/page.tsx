"use client";

import {
  ArrowUpRight,
  Building2,
  ChevronRight,
  CreditCard,
  Plus,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { AccountIcon } from "@/components/accounts/AccountIcon";
import { CardBrandBadge } from "@/components/accounts/CardBrandIcon";
import { IssuerBadge } from "@/components/accounts/IssuerBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Account } from "@/domain/accounts/types/account";
import { useAccounts } from "@/hooks/use-accounts";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function Dashboard() {
  const { data: session } = useSession();
  const t = useTranslations("dashboard");
  const tAccounts = useTranslations("accounts");
  const tCommon = useTranslations("common");
  const { data: accounts = [], isLoading } = useAccounts(false);

  const activeAccounts = accounts.filter((a) => !a.archived);
  const creditCards = activeAccounts.filter(
    (a) => a.accountType === "card_credit",
  );
  const bankAccounts = activeAccounts.filter(
    (a) =>
      a.accountType === "bank_checking" || a.accountType === "bank_savings",
  );

  const totalCreditLimit = creditCards.reduce(
    (sum, acc) => sum + (acc.billing?.creditLimit || 0),
    0,
  );

  const totalAvailableCredit = creditCards.reduce(
    (sum, acc) => sum + (acc.billing?.availableCredit || 0),
    0,
  );

  const creditUsage =
    totalCreditLimit > 0
      ? ((totalCreditLimit - totalAvailableCredit) / totalCreditLimit) * 100
      : 0;

  const userName = session?.user?.name?.split(" ")[0] || "Usuário";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card border border-border rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {t("welcome")}, {userName}! 👋
              </h1>
              <p className="text-muted-foreground">{t("welcomeMessage")}</p>
            </div>
            <Link href="/accounts">
              <Button>
                <Plus className="size-4" />
                {tAccounts("actions.new")}
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t("stats.totalAccounts")}
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {isLoading ? "..." : activeAccounts.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Wallet className="size-6 text-primary" />
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href="/accounts"
                  className="text-sm text-primary hover:underline inline-flex items-center"
                >
                  {t("stats.viewAll")}
                  <ChevronRight className="size-4 ml-1" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Credit Cards */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t("stats.creditCards")}
                  </p>
                  <p className="text-3xl font-bold text-chart-2">
                    {isLoading ? "..." : creditCards.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="size-6 text-chart-2" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  {t("stats.totalLimit")}: {formatCurrency(totalCreditLimit)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Available Credit */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t("stats.availableCredit")}
                  </p>
                  <p className="text-2xl font-bold text-chart-3">
                    {isLoading ? "..." : formatCurrency(totalAvailableCredit)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="size-6 text-chart-3" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  {creditUsage > 0
                    ? `${creditUsage.toFixed(1)}% ${t("stats.creditUsage")}`
                    : t("stats.noUsage")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Bank Accounts */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t("stats.bankAccounts")}
                  </p>
                  <p className="text-3xl font-bold text-chart-4">
                    {isLoading ? "..." : bankAccounts.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center">
                  <Building2 className="size-6 text-chart-4" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  {t("stats.activeAndFunctional")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t("recentAccounts.title")}</CardTitle>
                    <CardDescription>
                      {t("recentAccounts.description")}
                    </CardDescription>
                  </div>
                  <Link href="/accounts">
                    <Button variant="ghost" size="sm">
                      {t("stats.viewAll")}
                      <ArrowUpRight className="size-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {tCommon("loading")}
                  </div>
                ) : activeAccounts.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="size-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {t("recentAccounts.empty.title")}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("recentAccounts.empty.description")}
                    </p>
                    <Link href="/accounts">
                      <Button>
                        <Plus className="size-4" />
                        {tAccounts("actions.add")}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeAccounts.slice(0, 5).map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center gap-4 p-3 hover:bg-accent rounded-lg transition-colors cursor-pointer"
                      >
                        <div className="w-10 h-10 bg-accent/50 rounded-lg flex items-center justify-center">
                          <AccountIcon accountType={account.accountType} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {account.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {account.issuer && (
                              <IssuerBadge
                                issuer={account.issuer}
                                className="text-xs"
                              />
                            )}
                            {account.cardBrand && (
                              <CardBrandBadge
                                brand={account.cardBrand}
                                showName={false}
                              />
                            )}
                          </div>
                        </div>
                        {account.billing?.creditLimit && (
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {formatCurrency(
                                account.billing.availableCredit || 0,
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              de {formatCurrency(account.billing.creditLimit)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t("quickActions.title")}</CardTitle>
                <CardDescription>
                  {t("quickActions.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/accounts">
                  <Button variant="ghost" className="w-full justify-start">
                    <Wallet className="size-4 mr-3" />
                    {t("quickActions.manageAccounts")}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  disabled
                >
                  <CreditCard className="size-4 mr-3" />
                  {t("quickActions.transactions")}
                  <Badge variant="secondary" className="ml-auto">
                    {t("quickActions.comingSoon")}
                  </Badge>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  disabled
                >
                  <TrendingUp className="size-4 mr-3" />
                  {t("quickActions.investments")}
                  <Badge variant="secondary" className="ml-auto">
                    {t("quickActions.comingSoon")}
                  </Badge>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  disabled
                >
                  <Building2 className="size-4 mr-3" />
                  {t("quickActions.reports")}
                  <Badge variant="secondary" className="ml-auto">
                    {t("quickActions.comingSoon")}
                  </Badge>
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">{t("tip.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t("tip.content")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
