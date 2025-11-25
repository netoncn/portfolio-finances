"use client";

import {
  ArrowDownUp,
  ArrowUpRight,
  Building2,
  CreditCard,
  DollarSign,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AccountFormDialog } from "@/components/accounts/AccountFormDialog";
import { AccountIcon } from "@/components/accounts/AccountIcon";
import { CardBrandBadge } from "@/components/accounts/CardBrandIcon";
import { IssuerBadge } from "@/components/accounts/IssuerBadge";
import { KPICard } from "@/components/dashboard/KPICard";
import {
  PeriodFilter,
  type PeriodType,
} from "@/components/dashboard/PeriodFilter";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAccounts } from "@/hooks/use-accounts";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { formatCurrency } from "@/lib/utils";

export default function Dashboard() {
  const { data: session } = useSession();
  const t = useTranslations("dashboard");
  const tMetrics = useTranslations("dashboard.metrics");
  const tAccounts = useTranslations("accounts");
  const tCommon = useTranslations("common");
  const { data: accounts = [], isLoading: isLoadingAccounts } =
    useAccounts(false);
  const [period, setPeriod] = useState<PeriodType>("current_month");
  const { metrics, isLoading: isLoadingMetrics } = useDashboardMetrics(period);

  // Quick Actions State
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <span className="text-3xl">☀️</span>
                {t("welcome")}, {userName}
              </h1>
              <p className="text-muted-foreground text-base">
                {t("welcomeMessage")}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <PeriodFilter value={period} onChange={setPeriod} />
              <Button
                onClick={() => setTransactionDialogOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30"
              >
                <Plus className="size-4" />
                Nova Transação
              </Button>
              <Button
                onClick={() => setAccountDialogOpen(true)}
                variant="outline"
                className="border-2"
              >
                <Plus className="size-4" />
                Nova Conta
              </Button>
            </div>
          </div>
        </div>

        {/* Financial Metrics KPIs */}
        <div className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title={tMetrics("totalIncome")}
              value={formatCurrency(metrics.totalIncome)}
              icon={TrendingUp}
              iconColor="text-green-600"
              iconBgColor="bg-green-600/10"
              trend={{
                value: metrics.trends.income,
                label: tMetrics("compared"),
              }}
              isLoading={isLoadingMetrics}
              featured
              featuredColor="bg-gradient-to-br from-orange-500 to-orange-600"
            />
            <KPICard
              title={tMetrics("totalExpense")}
              value={formatCurrency(metrics.totalExpense)}
              icon={TrendingDown}
              iconColor="text-red-600"
              iconBgColor="bg-red-600/10"
              trend={{
                value: metrics.trends.expense,
                label: tMetrics("compared"),
              }}
              isLoading={isLoadingMetrics}
            />
            <KPICard
              title={tMetrics("balance")}
              value={formatCurrency(metrics.balance)}
              icon={ArrowDownUp}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-600/10"
              trend={{
                value: metrics.trends.balance,
                label: tMetrics("compared"),
              }}
              isLoading={isLoadingMetrics}
            />
            <KPICard
              title={tMetrics("transactionCount")}
              value={metrics.transactionCount}
              icon={DollarSign}
              iconColor="text-purple-600"
              iconBgColor="bg-purple-600/10"
              isLoading={isLoadingMetrics}
            />
          </div>
        </div>

        {/* Account Summary KPIs */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Account Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title={t("stats.totalAccounts")}
              value={activeAccounts.length}
              icon={Wallet}
              iconColor="text-primary"
              iconBgColor="bg-primary/10"
              description={t("stats.activeAndFunctional")}
              isLoading={isLoadingAccounts}
              onClick={() => (window.location.href = "/accounts")}
            />
            <KPICard
              title={t("stats.creditCards")}
              value={creditCards.length}
              icon={CreditCard}
              iconColor="text-chart-2"
              iconBgColor="bg-chart-2/10"
              description={`${t("stats.totalLimit")}: ${formatCurrency(totalCreditLimit)}`}
              isLoading={isLoadingAccounts}
            />
            <KPICard
              title={t("stats.availableCredit")}
              value={formatCurrency(totalAvailableCredit)}
              icon={TrendingUp}
              iconColor="text-chart-3"
              iconBgColor="bg-chart-3/10"
              description={
                creditUsage > 0
                  ? `${creditUsage.toFixed(1)}% ${t("stats.creditUsage")}`
                  : t("stats.noUsage")
              }
              isLoading={isLoadingAccounts}
            />
            <KPICard
              title={t("stats.bankAccounts")}
              value={bankAccounts.length}
              icon={Building2}
              iconColor="text-chart-4"
              iconBgColor="bg-chart-4/10"
              description={t("stats.activeAndFunctional")}
              isLoading={isLoadingAccounts}
            />
          </div>
        </div>

        {/* Recent Accounts & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-none shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t("recentAccounts.title")}</CardTitle>
                    <CardDescription>
                      {t("recentAccounts.description")}
                    </CardDescription>
                  </div>
                  <Link href="/accounts">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                    >
                      {t("stats.viewAll")}
                      <ArrowUpRight className="size-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingAccounts ? (
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
                    <Button onClick={() => setAccountDialogOpen(true)}>
                      <Plus className="size-4" />
                      {tAccounts("actions.add")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeAccounts.slice(0, 5).map((account) => (
                      <Link
                        key={account.id}
                        href="/accounts"
                        className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors border border-transparent hover:border-orange-200 dark:hover:border-orange-900"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 rounded-xl flex items-center justify-center">
                          <AccountIcon accountType={account.accountType} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
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
                            <p className="text-sm font-bold text-foreground">
                              {formatCurrency(
                                account.billing.availableCredit || 0,
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              de {formatCurrency(account.billing.creditLimit)}
                            </p>
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Tips */}
          <div className="space-y-6">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>{t("quickActions.title")}</CardTitle>
                <CardDescription>
                  {t("quickActions.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start hover:bg-orange-50 hover:text-orange-600"
                  onClick={() => setTransactionDialogOpen(true)}
                >
                  <Plus className="size-4 mr-3" />
                  Nova Transação
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start hover:bg-orange-50 hover:text-orange-600"
                  onClick={() => setAccountDialogOpen(true)}
                >
                  <Plus className="size-4 mr-3" />
                  Nova Conta
                </Button>
                <Link href="/accounts">
                  <Button
                    variant="ghost"
                    className="w-full justify-start hover:bg-orange-50 hover:text-orange-600"
                  >
                    <Wallet className="size-4 mr-3" />
                    {t("quickActions.manageAccounts")}
                  </Button>
                </Link>
                <Link href="/transactions">
                  <Button
                    variant="ghost"
                    className="w-full justify-start hover:bg-orange-50 hover:text-orange-600"
                  >
                    <CreditCard className="size-4 mr-3" />
                    Ver Transações
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardHeader>
                <CardTitle className="text-base text-white">
                  {t("tip.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/90">{t("tip.content")}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Action Dialogs */}
        <TransactionForm
          open={transactionDialogOpen}
          onOpenChange={setTransactionDialogOpen}
          mode="create"
        />

        <AccountFormDialog
          open={accountDialogOpen}
          onOpenChange={setAccountDialogOpen}
          mode="create"
        />
      </div>
    </div>
  );
}
