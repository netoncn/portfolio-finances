"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Transaction } from "@/domain/transactions/types/transaction";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import {
  useCreateTransaction,
  useUpdateTransaction,
} from "@/hooks/use-transactions";
import {
  type TransactionFormValues,
  transactionFormSchema,
} from "./schemas/transaction-form.schema";

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction;
  mode?: "create" | "edit";
}

export function TransactionForm({
  open,
  onOpenChange,
  transaction,
  mode = "create",
}: TransactionFormProps) {
  const t = useTranslations("transactions.form");
  const tCommon = useTranslations("common");
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      accountId: transaction?.accountId || "",
      date: transaction?.date ? new Date(transaction.date) : new Date(),
      description: transaction?.description || "",
      merchant: transaction?.merchant || "",
      amount: transaction?.amount ? transaction.amount / 100 : 0,
      type: transaction?.type || "expense",
      categoryId: transaction?.categoryId || "",
      tags: transaction?.tags || [],
      hasInstallments: !!transaction?.installmentCount || false,
      installmentCount: transaction?.installmentCount,
      status: transaction?.status || "posted",
    },
  });

  const hasInstallments = form.watch("hasInstallments");
  const selectedAccountId = form.watch("accountId");
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const selectedType = form.watch("type");

  const filteredCategories = categories.filter(
    (category) => category.type === selectedType,
  );

  useEffect(() => {
    if (selectedAccount) {
      form.setValue("accountId", selectedAccount.id);
    }
  }, [selectedAccount, form]);

  useEffect(() => {
    const currentCategoryId = form.getValues("categoryId");
    if (currentCategoryId) {
      const currentCategory = categories.find(
        (c) => c.id === currentCategoryId,
      );
      if (currentCategory && currentCategory.type !== selectedType) {
        form.setValue("categoryId", "");
      }
    }
  }, [selectedType, categories, form]);

  const onSubmit = async (data: TransactionFormValues) => {
    try {
      const amountInCents = Math.round(data.amount * 100);

      const account = accounts.find((a) => a.id === data.accountId);
      if (!account) {
        toast.error(t("messages.accountNotFound"));
        return;
      }

      const payload = {
        accountId: data.accountId,
        accountType: account.accountType,
        cardBrand: account.cardBrand,
        date: data.date.getTime(),
        description: data.description,
        merchant: data.merchant || undefined,
        amount: amountInCents,
        type: data.type,
        categoryId: data.categoryId || undefined,
        tags: data.tags,
        status: data.status,
      };

      if (mode === "create") {
        if (data.hasInstallments && data.installmentCount) {
          toast.info(t("messages.installmentsNotImplemented"));
          return;
        } else {
          await createMutation.mutateAsync(payload);
          toast.success(t("messages.createSuccess"));
        }
      } else {
        await updateMutation.mutateAsync({
          id: transaction!.id,
          ...payload,
        });
        toast.success(t("messages.updateSuccess"));
      }

      onOpenChange(false);
      form.reset();
    } catch {
      toast.error(
        mode === "create"
          ? t("messages.createError")
          : t("messages.updateError"),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? t("create.title") : t("edit.title")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("create.description")
              : t("edit.description")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.account.label")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("fields.account.placeholder")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.type.label")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="expense">
                        {t("types.expense")}
                      </SelectItem>
                      <SelectItem value="income">
                        {t("types.income")}
                      </SelectItem>
                      <SelectItem value="transfer">
                        {t("types.transfer")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.category.label")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("fields.category.placeholder")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredCategories.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          {t("fields.category.noCategories")}
                        </div>
                      ) : (
                        filteredCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              {category.icon && (
                                <span className="text-base">
                                  {category.icon}
                                </span>
                              )}
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("fields.category.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.description.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("fields.description.placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="merchant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.merchant.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("fields.merchant.placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("fields.merchant.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.amount.label")}</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      value={field.value || 0}
                      onValueChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("fields.amount.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.date.label")}</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={
                        field.value ? format(field.value, "yyyy-MM-dd") : ""
                      }
                      onChange={(e) => {
                        const date = e.target.value
                          ? new Date(e.target.value)
                          : new Date();
                        field.onChange(date);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.status.label")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="scheduled">
                        {t("status.scheduled")}
                      </SelectItem>
                      <SelectItem value="posted">
                        {t("status.posted")}
                      </SelectItem>
                      <SelectItem value="paid">{t("status.paid")}</SelectItem>
                      <SelectItem value="canceled">
                        {t("status.canceled")}
                      </SelectItem>
                      <SelectItem value="refunded">
                        {t("status.refunded")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasInstallments"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t("fields.hasInstallments.label")}
                    </FormLabel>
                    <FormDescription>
                      {t("fields.hasInstallments.description")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 cursor-pointer"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {hasInstallments && (
              <FormField
                control={form.control}
                name="installmentCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.installmentCount.label")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="2"
                        max="360"
                        placeholder="12"
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = parseInt(e.target.value, 10);
                          field.onChange(
                            Number.isNaN(value) ? undefined : value,
                          );
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("fields.installmentCount.description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {mode === "create" ? t("actions.create") : t("actions.update")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
