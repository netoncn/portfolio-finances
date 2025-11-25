"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccounts } from "@/hooks/use-accounts";
import type { TransactionFilters as TransactionFiltersType } from "@/hooks/use-transactions";

interface TransactionFiltersProps {
  filters: TransactionFiltersType;
  onFiltersChange: (filters: TransactionFiltersType) => void;
}

export function TransactionFilters({
  filters,
  onFiltersChange,
}: TransactionFiltersProps) {
  const t = useTranslations("transactions");
  const { data: accounts = [] } = useAccounts();

  const handleAccountChange = (value: string) => {
    if (value === "all") {
      const { accountId, ...rest } = filters;
      onFiltersChange(rest);
    } else {
      onFiltersChange({ ...filters, accountId: value });
    }
  };

  const handleAccountTypeChange = (value: string) => {
    if (value === "all") {
      const { accountType, ...rest } = filters;
      onFiltersChange(rest);
    } else {
      onFiltersChange({ ...filters, accountType: value });
    }
  };

  const handleCardBrandChange = (value: string) => {
    if (value === "all") {
      const { cardBrand, ...rest } = filters;
      onFiltersChange(rest);
    } else {
      onFiltersChange({ ...filters, cardBrand: value });
    }
  };

  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="account">
          {t("filters.account")}
        </label>
        <Select
          value={filters.accountId || "all"}
          onValueChange={handleAccountChange}
        >
          <SelectTrigger id="account" className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allAccounts")}</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="accountType">
          {t("filters.accountType")}
        </label>
        <Select
          value={filters.accountType || "all"}
          onValueChange={handleAccountTypeChange}
        >
          <SelectTrigger id="accountType" className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
            <SelectItem value="card_credit">
              {t("accountTypes.card_credit")}
            </SelectItem>
            <SelectItem value="card_debit">
              {t("accountTypes.card_debit")}
            </SelectItem>
            <SelectItem value="prepaid">{t("accountTypes.prepaid")}</SelectItem>
            <SelectItem value="wallet_cash">
              {t("accountTypes.wallet_cash")}
            </SelectItem>
            <SelectItem value="bank_checking">
              {t("accountTypes.bank_checking")}
            </SelectItem>
            <SelectItem value="bank_savings">
              {t("accountTypes.bank_savings")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="cardBrand">
          {t("filters.cardBrand")}
        </label>
        <Select
          value={filters.cardBrand || "all"}
          onValueChange={handleCardBrandChange}
        >
          <SelectTrigger id="cardBrand" className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allBrands")}</SelectItem>
            <SelectItem value="visa">Visa</SelectItem>
            <SelectItem value="mastercard">Mastercard</SelectItem>
            <SelectItem value="amex">American Express</SelectItem>
            <SelectItem value="elo">Elo</SelectItem>
            <SelectItem value="hipercard">Hipercard</SelectItem>
            <SelectItem value="vr">VR</SelectItem>
            <SelectItem value="sodexo">Sodexo</SelectItem>
            <SelectItem value="alelo">Alelo</SelectItem>
            <SelectItem value="other">{t("filters.other")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
