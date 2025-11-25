"use client";

import { Archive, Filter, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { AccountIcon } from "@/components/accounts/AccountIcon";
import { CardBrandBadge } from "@/components/accounts/CardBrandIcon";
import { IssuerBadge } from "@/components/accounts/IssuerBadge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import type { Account, AccountType } from "@/domain/accounts/types/account";

interface AccountsTableProps {
  accounts: Account[];
  isLoading?: boolean;
  onAccountClick?: (account: Account) => void;
}

const ACCOUNT_TYPE_BADGE_COLORS: Record<AccountType, string> = {
  card_credit:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  card_debit: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  prepaid: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  wallet_cash:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  bank_checking:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  bank_savings:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

function formatCurrency(valueInCents?: number): string {
  if (valueInCents === undefined) return "-";
  const valueInReais = valueInCents / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInReais);
}

export function AccountsTable({
  accounts,
  isLoading,
  onAccountClick,
}: AccountsTableProps) {
  const t = useTranslations("accounts");
  const tCommon = useTranslations("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesSearch =
        searchQuery === "" ||
        account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.issuer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.last4?.includes(searchQuery);

      const matchesType =
        typeFilter === "all" || account.accountType === typeFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !account.archived) ||
        (statusFilter === "archived" && account.archived);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [accounts, searchQuery, typeFilter, statusFilter]);

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
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("filters.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="size-4 mr-2" />
                <SelectValue placeholder={t("filters.type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
                <SelectItem value="card_credit">
                  {t("types.card_credit")}
                </SelectItem>
                <SelectItem value="card_debit">
                  {t("types.card_debit")}
                </SelectItem>
                <SelectItem value="prepaid">{t("types.prepaid")}</SelectItem>
                <SelectItem value="wallet_cash">
                  {t("types.wallet_cash")}
                </SelectItem>
                <SelectItem value="bank_checking">
                  {t("types.bank_checking")}
                </SelectItem>
                <SelectItem value="bank_savings">
                  {t("types.bank_savings")}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t("filters.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.all")}</SelectItem>
                <SelectItem value="active">{t("filters.active")}</SelectItem>
                <SelectItem value="archived">
                  {t("filters.archived")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Archive className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              {t("table.noResults")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || typeFilter !== "all" || statusFilter !== "active"
                ? t("table.adjustFilters")
                : t("emptyState.description")}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.name")}</TableHead>
                  <TableHead>{t("table.type")}</TableHead>
                  <TableHead>{t("table.issuer")}</TableHead>
                  <TableHead>{t("table.lastDigits")}</TableHead>
                  <TableHead className="text-right">
                    {t("table.limit")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("table.available")}
                  </TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow
                    key={account.id}
                    className="cursor-pointer"
                    onClick={() => onAccountClick?.(account)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <AccountIcon
                          accountType={account.accountType}
                          className="size-4"
                        />
                        <span className="truncate">{account.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          ACCOUNT_TYPE_BADGE_COLORS[account.accountType]
                        }
                      >
                        {t(`types.${account.accountType}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <IssuerBadge issuer={account.issuer} />
                    </TableCell>
                    <TableCell>
                      {account.last4 ? (
                        <div className="flex items-center gap-2">
                          {account.cardBrand && (
                            <CardBrandBadge
                              brand={account.cardBrand}
                              showName={false}
                            />
                          )}
                          <span className="font-mono text-sm">
                            •••• {account.last4}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(account.billing?.creditLimit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(account.billing?.availableCredit)}
                    </TableCell>
                    <TableCell>
                      {account.archived ? (
                        <Badge variant="secondary">
                          {tCommon("status.inactive")}
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        >
                          {tCommon("status.active")}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredAccounts.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div>
              {t("table.showing")} {filteredAccounts.length} {t("table.of")}{" "}
              {accounts.length} {t("table.accounts")}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
