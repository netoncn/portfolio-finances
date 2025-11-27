"use client";

import { Archive, Building2, Edit, Plus, Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  InvestmentAccount,
  InvestmentAccountType,
} from "@/domain/investments/types";
import { InvestmentAccountFormDialog } from "./InvestmentAccountFormDialog";

interface InvestmentAccountsListProps {
  accounts: InvestmentAccount[];
  isLoading?: boolean;
}

const ACCOUNT_TYPE_BADGE_COLORS: Record<InvestmentAccountType, string> = {
  broker: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  retirement_401k:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  retirement_ira:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  retirement_roth:
    "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  retirement_pension:
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  education_529:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

export function InvestmentAccountsList({
  accounts,
  isLoading,
}: InvestmentAccountsListProps) {
  const t = useTranslations("investments.accounts");
  const tCommon = useTranslations("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<
    InvestmentAccount | undefined
  >();
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesSearch =
        searchQuery === "" ||
        account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.broker?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.accountNumber?.includes(searchQuery);

      const matchesType =
        typeFilter === "all" || account.accountType === typeFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !account.archived) ||
        (statusFilter === "archived" && account.archived);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [accounts, searchQuery, typeFilter, statusFilter]);

  const handleCreate = () => {
    setSelectedAccount(undefined);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleEdit = (account: InvestmentAccount) => {
    setSelectedAccount(account);
    setDialogMode("edit");
    setDialogOpen(true);
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
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t("list.addButton")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("list.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder={t("list.filterByType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon("all")}</SelectItem>
                  <SelectItem value="broker">
                    {t("accountTypes.broker")}
                  </SelectItem>
                  <SelectItem value="retirement_401k">
                    {t("accountTypes.retirement_401k")}
                  </SelectItem>
                  <SelectItem value="retirement_ira">
                    {t("accountTypes.retirement_ira")}
                  </SelectItem>
                  <SelectItem value="retirement_roth">
                    {t("accountTypes.retirement_roth")}
                  </SelectItem>
                  <SelectItem value="retirement_pension">
                    {t("accountTypes.retirement_pension")}
                  </SelectItem>
                  <SelectItem value="education_529">
                    {t("accountTypes.education_529")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={t("list.filterByStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon("all")}</SelectItem>
                  <SelectItem value="active">{tCommon("active")}</SelectItem>
                  <SelectItem value="archived">
                    {tCommon("archived")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredAccounts.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">
                  {t("list.noAccounts")}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("list.noAccountsDescription")}
                </p>
                <Button onClick={handleCreate} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("list.addFirstButton")}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAccounts.map((account) => (
                  <Card
                    key={account.id}
                    className={`cursor-pointer transition-colors hover:bg-accent ${
                      account.archived ? "opacity-60" : ""
                    }`}
                    onClick={() => handleEdit(account)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Building2 className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{account.name}</span>
                          </CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-2">
                            <span className="truncate">{account.broker}</span>
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(account);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="secondary"
                          className={
                            ACCOUNT_TYPE_BADGE_COLORS[account.accountType]
                          }
                        >
                          {t(`accountTypes.${account.accountType}`)}
                        </Badge>
                        {account.archived && (
                          <Badge variant="outline">
                            <Archive className="mr-1 h-3 w-3" />
                            {tCommon("archived")}
                          </Badge>
                        )}
                      </div>
                      {account.accountNumber && (
                        <p className="text-xs text-muted-foreground mt-3">
                          {t("list.accountNumber")}: {account.accountNumber}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <InvestmentAccountFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        account={selectedAccount}
        mode={dialogMode}
      />
    </>
  );
}
