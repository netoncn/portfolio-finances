"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Archive, ArchiveRestore, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AccountIcon } from "@/components/accounts/AccountIcon";
import { BillingInfo } from "@/components/accounts/BillingInfo";
import { CardBrandBadge } from "@/components/accounts/CardBrandIcon";
import { IssuerBadge } from "@/components/accounts/IssuerBadge";
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
import { createAccountSchema } from "@/domain/accounts/schemas/account.schema";
import type {
  Account,
  AccountType,
  CardBrand,
} from "@/domain/accounts/types/account";
import {
  useArchiveAccount,
  useCreateAccount,
  useUnarchiveAccount,
  useUpdateAccount,
} from "@/hooks/use-accounts";

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account;
  mode: "create" | "edit";
}

const formSchema = createAccountSchema.omit({ userId: true }).extend({
  currency: z.literal("BRL"),
});
type FormValues = z.infer<typeof formSchema>;

const ACCOUNT_TYPE_KEYS: AccountType[] = [
  "card_credit",
  "card_debit",
  "prepaid",
  "wallet_cash",
  "bank_checking",
  "bank_savings",
];

const CARD_BRAND_KEYS: CardBrand[] = [
  "visa",
  "mastercard",
  "amex",
  "elo",
  "hipercard",
  "vr",
  "sodexo",
  "alelo",
  "other",
];

export function AccountFormDialog({
  open,
  onOpenChange,
  account,
  mode,
}: AccountFormDialogProps) {
  const t = useTranslations("accounts");
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const archiveMutation = useArchiveAccount();
  const unarchiveMutation = useUnarchiveAccount();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      accountType: "card_credit",
      currency: "BRL",
      icon: "",
      issuer: "",
      last4: "",
      cardBrand: undefined,
      benefits: undefined,
      billing: undefined,
    },
  });

  const accountType = form.watch("accountType");
  const accountName = form.watch("name");
  const issuer = form.watch("issuer");
  const cardBrand = form.watch("cardBrand");
  const last4 = form.watch("last4");
  const billingClosingDay = form.watch("billing.closingDay");
  const billingDueDay = form.watch("billing.dueDay");
  const billingCreditLimit = form.watch("billing.creditLimit");
  const isCard = ["card_credit", "card_debit", "prepaid"].includes(accountType);
  const isCreditCard = accountType === "card_credit";

  const hasBillingDates =
    billingClosingDay &&
    billingDueDay &&
    billingClosingDay >= 1 &&
    billingClosingDay <= 28 &&
    billingDueDay >= 1 &&
    billingDueDay <= 28 &&
    billingClosingDay !== billingDueDay;

  useEffect(() => {
    if (!isCard) {
      form.setValue("cardBrand", undefined);
      form.setValue("last4", "");
    }
    if (!isCreditCard) {
      form.setValue("billing", undefined);
    }
  }, [accountType, isCard, isCreditCard, form]);

  useEffect(() => {
    if (open && account && mode === "edit") {
      form.reset({
        name: account.name,
        accountType: account.accountType,
        currency: account.currency,
        icon: account.icon || "",
        issuer: account.issuer || "",
        last4: account.last4 || "",
        cardBrand: account.cardBrand,
        benefits: account.benefits,
        billing: account.billing,
      });
    } else if (open && mode === "create") {
      form.reset({
        name: "",
        accountType: "card_credit",
        currency: "BRL",
        icon: "",
        issuer: "",
        last4: "",
        cardBrand: undefined,
        benefits: undefined,
        billing: undefined,
      });
    }
  }, [open, account, mode, form]);

  const onSubmit = async (data: FormValues) => {
    console.log("Form submitted with data:", data);
    try {
      if (mode === "create") {
        await createMutation.mutateAsync(data as any);
        toast.success(t("form.messages.createSuccess"));
      } else if (account) {
        await updateMutation.mutateAsync({
          id: account.id,
          ...data,
        } as any);
        toast.success(t("form.messages.updateSuccess"));
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        mode === "create"
          ? t("form.messages.createError")
          : t("form.messages.updateError"),
      );
    }
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    toast.error(t("form.messages.validationError"));
  };

  const handleArchive = async () => {
    if (!account?.id) return;

    try {
      await archiveMutation.mutateAsync(account.id);
      toast.success(t("form.messages.archiveSuccess"));
      onOpenChange(false);
    } catch (error) {
      console.error("Error archiving account:", error);
      toast.error(t("form.messages.archiveError"));
    }
  };

  const handleUnarchive = async () => {
    if (!account?.id) return;

    try {
      await unarchiveMutation.mutateAsync(account.id);
      toast.success(t("form.messages.unarchiveSuccess"));
      onOpenChange(false);
    } catch (error) {
      console.error("Error unarchiving account:", error);
      toast.error(t("form.messages.unarchiveError"));
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isArchiveLoading =
    archiveMutation.isPending || unarchiveMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? t("form.create.title") : t("form.edit.title")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("form.create.description")
              : t("form.edit.description")}
          </DialogDescription>
        </DialogHeader>

        {accountName && (
          <div className="p-4 rounded-lg border bg-gradient-to-br from-accent/50 to-accent/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-background/80 backdrop-blur-sm">
                <AccountIcon accountType={accountType} className="size-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base truncate">
                  {accountName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {issuer && <IssuerBadge issuer={issuer} />}
                  {cardBrand && <CardBrandBadge brand={cardBrand} />}
                </div>
              </div>
              {last4 && (
                <div className="text-sm text-muted-foreground font-mono px-2 py-1 rounded bg-background/60">
                  •••• {last4}
                </div>
              )}
            </div>
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onError)}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">
                {t("form.sections.basicInfo")}
              </h3>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.fields.name.label")} *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("form.fields.name.placeholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.fields.type.label")} *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("form.fields.type.placeholder")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACCOUNT_TYPE_KEYS.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`types.${type}`)}
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
                name="issuer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.fields.issuer.label")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("form.fields.issuer.placeholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("form.fields.issuer.description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isCard && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">
                  {t("form.sections.cardInfo")}
                </h3>

                <FormField
                  control={form.control}
                  name="cardBrand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.fields.brand.label")} *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("form.fields.brand.placeholder")}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CARD_BRAND_KEYS.map((brand) => (
                            <SelectItem key={brand} value={brand}>
                              {t(`brands.${brand}`)}
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
                  name="last4"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.fields.lastDigits.label")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("form.fields.lastDigits.placeholder")}
                          maxLength={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("form.fields.lastDigits.description")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {isCreditCard && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">
                  {t("form.sections.billing")}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="billing.closingDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("form.fields.closingDay.label")} *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={28}
                            placeholder="15"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Dia do mês que a fatura fecha (1-28)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="billing.dueDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.fields.dueDay.label")} *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={28}
                            placeholder="25"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Dia do vencimento (mín. 3 dias após fechamento)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="billing.creditLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("form.fields.creditLimit.label")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="5000"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        {t("form.fields.creditLimit.description")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {hasBillingDates && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-3">
                      Visualização do Ciclo
                    </h4>
                    <BillingInfo
                      closingDay={billingClosingDay}
                      dueDay={billingDueDay}
                      creditLimit={billingCreditLimit}
                      availableCredit={billingCreditLimit}
                    />
                  </div>
                )}
              </div>
            )}

            {isCreditCard && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">
                  {t("form.sections.benefits")}
                </h3>

                <FormField
                  control={form.control}
                  name="benefits.airline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.fields.airline.label")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("form.fields.airline.placeholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="benefits.cashback"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.fields.cashback.label")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={1}
                            step={0.01}
                            placeholder={t("form.fields.cashback.placeholder")}
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          {t("form.fields.cashback.description")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="benefits.fxFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.fields.fxFee.label")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={1}
                            step={0.01}
                            placeholder={t("form.fields.fxFee.placeholder")}
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          {t("form.fields.fxFee.description")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {mode === "edit" && account && (
                <div className="flex gap-2 mr-auto">
                  {account.archived ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleUnarchive}
                      disabled={isLoading || isArchiveLoading}
                    >
                      {isArchiveLoading && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      {!isArchiveLoading && (
                        <ArchiveRestore className="size-4" />
                      )}
                      {t("actions.unarchive")}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleArchive}
                      disabled={isLoading || isArchiveLoading}
                    >
                      {isArchiveLoading && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      {!isArchiveLoading && <Archive className="size-4" />}
                      {t("actions.archive")}
                    </Button>
                  )}
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading || isArchiveLoading}
              >
                {t("form.actions.cancel")}
              </Button>
              <Button type="submit" disabled={isLoading || isArchiveLoading}>
                {isLoading && <Loader2 className="size-4 animate-spin" />}
                {mode === "create"
                  ? t("form.actions.create")
                  : t("form.actions.update")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
