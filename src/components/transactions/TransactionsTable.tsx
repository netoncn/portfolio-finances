"use client";

import { useTranslations } from "next-intl";
import { memo } from "react";
import { CardBrandIcon } from "@/components/accounts/CardBrandIcon";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Transaction } from "@/domain/transactions/types/transaction";
import { formatCurrency } from "@/lib/utils";

interface TransactionsTableProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

interface TransactionRowProps {
  transaction: Transaction;
  typeLabel: string;
  statusLabel: string | null;
  accountTypeLabel: string;
}

function getTypeVariant(
  type: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (type) {
    case "income":
      return "default";
    case "expense":
      return "destructive";
    case "transfer":
      return "secondary";
    default:
      return "outline";
  }
}

function getStatusVariant(
  status?: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "paid":
      return "default";
    case "posted":
      return "secondary";
    case "scheduled":
      return "outline";
    case "canceled":
    case "refunded":
      return "destructive";
    default:
      return "secondary";
  }
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const TransactionRow = memo(function TransactionRow({
  transaction,
  typeLabel,
  statusLabel,
  accountTypeLabel,
}: TransactionRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        {formatDate(transaction.date)}
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{transaction.description}</span>
          {transaction.merchant && (
            <span className="text-sm text-muted-foreground">
              {transaction.merchant}
            </span>
          )}
          {transaction.installmentNumber && transaction.installmentCount && (
            <span className="text-xs text-muted-foreground">
              {transaction.installmentNumber}/{transaction.installmentCount}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={getTypeVariant(transaction.type)}>{typeLabel}</Badge>
      </TableCell>
      <TableCell>
        {transaction.status && statusLabel && (
          <Badge variant={getStatusVariant(transaction.status)}>
            {statusLabel}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {transaction.cardBrand && (
            <CardBrandIcon brand={transaction.cardBrand} className="size-4" />
          )}
          <span className="text-sm text-muted-foreground">
            {accountTypeLabel}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-right font-medium">
        <span
          className={
            transaction.type === "income"
              ? "text-finance-gain"
              : transaction.type === "expense"
                ? "text-finance-loss"
                : ""
          }
        >
          {transaction.type === "income"
            ? "+"
            : transaction.type === "expense"
              ? "-"
              : ""}
          {formatCurrency(transaction.amount)}
        </span>
      </TableCell>
    </TableRow>
  );
});

export const TransactionsTable = memo(function TransactionsTable({
  transactions,
  isLoading,
}: TransactionsTableProps) {
  const t = useTranslations("transactions");
  const tCommon = useTranslations("common");

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.date")}</TableHead>
              <TableHead>{t("table.description")}</TableHead>
              <TableHead>{t("table.type")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead>{t("table.account")}</TableHead>
              <TableHead className="text-right">{t("table.amount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                {tCommon("loading")}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.date")}</TableHead>
              <TableHead>{t("table.description")}</TableHead>
              <TableHead>{t("table.type")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead>{t("table.account")}</TableHead>
              <TableHead className="text-right">{t("table.amount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                {t("empty")}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("table.date")}</TableHead>
            <TableHead>{t("table.description")}</TableHead>
            <TableHead>{t("table.type")}</TableHead>
            <TableHead>{t("table.status")}</TableHead>
            <TableHead>{t("table.account")}</TableHead>
            <TableHead className="text-right">{t("table.amount")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              typeLabel={t(`types.${transaction.type}`)}
              statusLabel={
                transaction.status ? t(`status.${transaction.status}`) : null
              }
              accountTypeLabel={t(`accountTypes.${transaction.accountType}`)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
});
