"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { createInvestmentTransactionSchema } from "@/domain/investments/schemas/investment-transaction.schema";
import type {
  InvestmentAccount,
  InvestmentTransaction,
  InvestmentTransactionType,
} from "@/domain/investments/types";
import {
  useCreateInvestmentTransaction,
  useDeleteInvestmentTransaction,
  useUpdateInvestmentTransaction,
} from "@/hooks/use-investment-transactions";

interface InvestmentTransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: InvestmentTransaction;
  mode: "create" | "edit";
  accounts: InvestmentAccount[];
}

const formSchema = createInvestmentTransactionSchema.omit({ userId: true });
type FormValues = z.infer<typeof formSchema>;

const TRANSACTION_TYPES: InvestmentTransactionType[] = [
  "buy",
  "sell",
  "deposit",
  "withdrawal",
  "fee",
  "dividend",
  "jcp",
  "interest",
];

export function InvestmentTransactionFormDialog({
  open,
  onOpenChange,
  transaction,
  mode,
  accounts,
}: InvestmentTransactionFormDialogProps) {
  const t = useTranslations("investments.transactions");
  const createMutation = useCreateInvestmentTransaction();
  const updateMutation = useUpdateInvestmentTransaction();
  const deleteMutation = useDeleteInvestmentTransaction();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      investmentAccountId: "",
      transactionType: "buy" as const,
      ticker: "",
      quantity: undefined,
      price: undefined,
      amount: 0,
      fees: undefined,
      currency: "BRL" as const,
      date: Date.now(),
      notes: "",
    },
  });

  const transactionType = form.watch("transactionType");
  const requiresAsset = ["buy", "sell", "dividend", "jcp", "interest"].includes(
    transactionType,
  );
  const requiresQuantity = ["buy", "sell"].includes(transactionType);
  const requiresPrice = ["buy", "sell"].includes(transactionType);

  useEffect(() => {
    if (open && transaction && mode === "edit") {
      form.reset({
        investmentAccountId: transaction.investmentAccountId,
        transactionType: transaction.transactionType,
        ticker: transaction.ticker || "",
        quantity: transaction.quantity,
        price: transaction.price ? transaction.price / 100 : undefined,
        amount: transaction.amount / 100,
        fees: transaction.fees ? transaction.fees / 100 : undefined,
        currency: transaction.currency,
        date: transaction.date,
        notes: transaction.notes || "",
      });
    } else if (open && mode === "create") {
      form.reset({
        investmentAccountId: accounts[0]?.id || "",
        transactionType: "buy",
        ticker: "",
        quantity: undefined,
        price: undefined,
        amount: 0,
        fees: undefined,
        currency: "BRL",
        date: Date.now(),
        notes: "",
      });
    }
  }, [open, transaction, mode, form, accounts]);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        ...data,
        price: data.price ? Math.round(data.price * 100) : undefined,
        amount: Math.round(data.amount * 100),
        fees: data.fees ? Math.round(data.fees * 100) : undefined,
      };

      if (mode === "create") {
        await createMutation.mutateAsync(payload);
        toast.success(t("messages.createSuccess"));
      } else if (transaction) {
        await updateMutation.mutateAsync({ ...payload, id: transaction.id });
        toast.success(t("messages.updateSuccess"));
      }
      onOpenChange(false);
      form.reset();
    } catch (_error) {
      toast.error(
        mode === "create"
          ? t("messages.createError")
          : t("messages.updateError"),
      );
    }
  };

  const handleDelete = async () => {
    if (!transaction) return;

    try {
      await deleteMutation.mutateAsync(transaction.id);
      toast.success(t("messages.deleteSuccess"));
      onOpenChange(false);
    } catch (_error) {
      toast.error(t("messages.deleteError"));
    }
  };

  const isLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? t("form.createTitle") : t("form.editTitle")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("form.createDescription")
              : t("form.editDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="investmentAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("form.fields.investmentAccountId.label")}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            "form.fields.investmentAccountId.placeholder",
                          )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts
                        .filter((acc) => !acc.archived)
                        .map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name} - {account.broker}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("form.fields.investmentAccountId.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transactionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("form.fields.transactionType.label")}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TRANSACTION_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(`types.${type}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("form.fields.transactionType.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {requiresAsset && (
              <FormField
                control={form.control}
                name="ticker"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.fields.ticker.label")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("form.fields.ticker.placeholder")}
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      {t("form.fields.ticker.description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requiresQuantity && (
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.fields.quantity.label")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={t("form.fields.quantity.placeholder")}
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : Number.parseFloat(e.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        {t("form.fields.quantity.description")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {requiresPrice && (
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.fields.price.label")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={t("form.fields.price.placeholder")}
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : Number.parseFloat(e.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        {t("form.fields.price.description")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.fields.amount.label")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={t("form.fields.amount.placeholder")}
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? 0
                              : Number.parseFloat(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      {t("form.fields.amount.description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.fields.fees.label")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={t("form.fields.fees.placeholder")}
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : Number.parseFloat(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      {t("form.fields.fees.description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.fields.date.label")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="datetime-local"
                        className="pl-9"
                        {...field}
                        value={
                          field.value
                            ? new Date(field.value).toISOString().slice(0, 16)
                            : ""
                        }
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value).getTime())
                        }
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    {t("form.fields.date.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.fields.notes.label")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("form.fields.notes.placeholder")}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("form.fields.notes.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {mode === "edit" && transaction && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="sm:mr-auto"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  {t("form.deleteButton")}
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {t("form.cancelButton")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create"
                  ? t("form.createButton")
                  : t("form.saveButton")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
