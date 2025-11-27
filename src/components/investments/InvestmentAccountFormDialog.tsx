"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Archive, ArchiveRestore, Loader2 } from "lucide-react";
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
import { ALL_BROKERS } from "@/domain/investments/constants/brokers";
import { createInvestmentAccountSchema } from "@/domain/investments/schemas/investment-account.schema";
import type {
  InvestmentAccount,
  InvestmentAccountType,
} from "@/domain/investments/types";
import {
  useArchiveInvestmentAccount,
  useCreateInvestmentAccount,
  useUnarchiveInvestmentAccount,
  useUpdateInvestmentAccount,
} from "@/hooks/use-investment-accounts";

interface InvestmentAccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: InvestmentAccount;
  mode: "create" | "edit";
}

const formSchema = createInvestmentAccountSchema.omit({ userId: true });
type FormValues = z.infer<typeof formSchema>;

const ACCOUNT_TYPE_KEYS: InvestmentAccountType[] = [
  "broker",
  "retirement_401k",
  "retirement_ira",
  "retirement_roth",
  "retirement_pension",
  "education_529",
];

export function InvestmentAccountFormDialog({
  open,
  onOpenChange,
  account,
  mode,
}: InvestmentAccountFormDialogProps) {
  const t = useTranslations("investments.accounts");
  const createMutation = useCreateInvestmentAccount();
  const updateMutation = useUpdateInvestmentAccount();
  const archiveMutation = useArchiveInvestmentAccount();
  const unarchiveMutation = useUnarchiveInvestmentAccount();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      broker: "",
      accountNumber: "",
      accountType: "broker" as const,
      currency: "BRL" as const,
    },
  });

  useEffect(() => {
    if (open && account && mode === "edit") {
      form.reset({
        name: account.name,
        broker: account.broker,
        accountNumber: account.accountNumber || "",
        accountType: account.accountType,
        currency: account.currency,
      });
    } else if (open && mode === "create") {
      form.reset({
        name: "",
        broker: "",
        accountNumber: "",
        accountType: "broker",
        currency: "BRL",
      });
    }
  }, [open, account, mode, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync(data);
        toast.success(t("messages.createSuccess"));
      } else if (account) {
        await updateMutation.mutateAsync({ ...data, id: account.id });
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

  const handleArchive = async () => {
    if (!account) return;

    try {
      await archiveMutation.mutateAsync(account.id);
      toast.success(t("messages.archiveSuccess"));
      onOpenChange(false);
    } catch (_error) {
      toast.error(t("messages.archiveError"));
    }
  };

  const handleUnarchive = async () => {
    if (!account) return;

    try {
      await unarchiveMutation.mutateAsync(account.id);
      toast.success(t("messages.unarchiveSuccess"));
      onOpenChange(false);
    } catch (_error) {
      toast.error(t("messages.unarchiveError"));
    }
  };

  const isLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    archiveMutation.isPending ||
    unarchiveMutation.isPending;

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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.fields.name.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("form.fields.name.placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("form.fields.name.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="broker"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.fields.broker.label")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("form.fields.broker.placeholder")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ALL_BROKERS.map((broker) => (
                        <SelectItem key={broker.id} value={broker.name}>
                          {broker.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">{t("form.other")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("form.fields.broker.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("broker") === "other" && (
              <FormItem>
                <FormLabel>{t("form.fields.customBroker.label")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("form.fields.customBroker.placeholder")}
                    value={
                      form.watch("broker") === "other"
                        ? ""
                        : form.watch("broker")
                    }
                    onChange={(e) => form.setValue("broker", e.target.value)}
                  />
                </FormControl>
                <FormDescription>
                  {t("form.fields.customBroker.description")}
                </FormDescription>
              </FormItem>
            )}

            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.fields.accountType.label")}</FormLabel>
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
                      {ACCOUNT_TYPE_KEYS.map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(`accountTypes.${type}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("form.fields.accountType.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.fields.accountNumber.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("form.fields.accountNumber.placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("form.fields.accountNumber.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {mode === "edit" &&
                account &&
                (account.archived ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUnarchive}
                    disabled={isLoading}
                    className="sm:mr-auto"
                  >
                    {unarchiveMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArchiveRestore className="mr-2 h-4 w-4" />
                    )}
                    {t("form.unarchiveButton")}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleArchive}
                    disabled={isLoading}
                    className="sm:mr-auto"
                  >
                    {archiveMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Archive className="mr-2 h-4 w-4" />
                    )}
                    {t("form.archiveButton")}
                  </Button>
                ))}

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
