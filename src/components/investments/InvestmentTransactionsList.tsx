"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Edit,
  Plus,
  TrendingDown,
  TrendingUp,
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  InvestmentAccount,
  InvestmentTransaction,
  InvestmentTransactionType,
} from "@/domain/investments/types";
import { formatCurrency } from "@/lib/utils";
import { InvestmentImportDialog } from "./InvestmentImportDialog";
import { InvestmentTransactionFormDialog } from "./InvestmentTransactionFormDialog";

interface InvestmentTransactionsListProps {
  transactions: InvestmentTransaction[];
  accounts: InvestmentAccount[];
  isLoading?: boolean;
}

const TRANSACTION_ICONS: Record<
  InvestmentTransactionType,
  React.ComponentType<{ className?: string }>
> = {
  buy: TrendingUp,
  sell: TrendingDown,
  deposit: ArrowDownLeft,
  withdrawal: ArrowUpRight,
  fee: TrendingDown,
  dividend: ArrowDownLeft,
  jcp: ArrowDownLeft,
  interest: ArrowDownLeft,
  transfer_in: ArrowDownLeft,
  transfer_out: ArrowUpRight,
  split: TrendingUp,
  reverse_split: TrendingDown,
  bonus: ArrowDownLeft,
  other: Edit,
};

const TRANSACTION_COLORS: Record<InvestmentTransactionType, string> = {
  buy: "text-green-600 dark:text-green-400",
  sell: "text-red-600 dark:text-red-400",
  deposit: "text-blue-600 dark:text-blue-400",
  withdrawal: "text-orange-600 dark:text-orange-400",
  fee: "text-red-600 dark:text-red-400",
  dividend: "text-green-600 dark:text-green-400",
  jcp: "text-green-600 dark:text-green-400",
  interest: "text-green-600 dark:text-green-400",
  transfer_in: "text-blue-600 dark:text-blue-400",
  transfer_out: "text-orange-600 dark:text-orange-400",
  split: "text-purple-600 dark:text-purple-400",
  reverse_split: "text-purple-600 dark:text-purple-400",
  bonus: "text-green-600 dark:text-green-400",
  other: "text-gray-600 dark:text-gray-400",
};

export function InvestmentTransactionsList({
  transactions,
  accounts,
  isLoading,
}: InvestmentTransactionsListProps) {
  const t = useTranslations("investments.transactions");
  const tCommon = useTranslations("common");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<
    InvestmentTransaction | undefined
  >();
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesType =
        typeFilter === "all" || transaction.transactionType === typeFilter;
      const matchesAccount =
        accountFilter === "all" ||
        transaction.investmentAccountId === accountFilter;

      return matchesType && matchesAccount;
    });
  }, [transactions, typeFilter, accountFilter]);

  const handleCreate = () => {
    setSelectedTransaction(undefined);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleEdit = (transaction: InvestmentTransaction) => {
    setSelectedTransaction(transaction);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    return account ? `${account.name} - ${account.broker}` : accountId;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">{tCommon("loading")}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("list.title")}</CardTitle>
              <CardDescription>{t("list.description")}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setImportDialogOpen(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                {t("list.importButton")}
              </Button>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t("list.addButton")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder={t("list.filterByType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon("all")}</SelectItem>
                  <SelectItem value="buy">{t("types.buy")}</SelectItem>
                  <SelectItem value="sell">{t("types.sell")}</SelectItem>
                  <SelectItem value="deposit">{t("types.deposit")}</SelectItem>
                  <SelectItem value="withdrawal">
                    {t("types.withdrawal")}
                  </SelectItem>
                  <SelectItem value="fee">{t("types.fee")}</SelectItem>
                  <SelectItem value="dividend">
                    {t("types.dividend")}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue placeholder={t("list.filterByAccount")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon("all")}</SelectItem>
                  {accounts
                    .filter((acc) => !acc.archived)
                    .map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">
                  {t("list.noTransactions")}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("list.noTransactionsDescription")}
                </p>
                <Button onClick={handleCreate} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("list.addButton")}
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Ativo</TableHead>
                      <TableHead>Conta</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => {
                      const Icon =
                        TRANSACTION_ICONS[transaction.transactionType];
                      const color =
                        TRANSACTION_COLORS[transaction.transactionType];

                      return (
                        <TableRow
                          key={transaction.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleEdit(transaction)}
                        >
                          <TableCell>
                            {new Date(transaction.date).toLocaleDateString(
                              "pt-BR",
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={color}>
                              <Icon className="mr-1 h-3 w-3" />
                              {t(`types.${transaction.transactionType}`)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {transaction.ticker || "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {getAccountName(transaction.investmentAccountId)}
                          </TableCell>
                          <TableCell className="text-right">
                            {transaction.quantity || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {transaction.price
                              ? formatCurrency(transaction.price / 100)
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(transaction.amount / 100)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(transaction);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <InvestmentTransactionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={selectedTransaction}
        mode={dialogMode}
        accounts={accounts}
      />

      <InvestmentImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        accounts={accounts}
      />
    </>
  );
}
