"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Loader2, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import {
  getProgramDisplayName,
  ProgramIcon,
} from "@/components/points/ProgramIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Account } from "@/domain/accounts/types/account";
import { createPointsProgramSchema } from "@/domain/points/schemas/points.schema";
import type {
  PointsProgram,
  PointsProgramName,
} from "@/domain/points/types/points";
import {
  useCreatePointsProgram,
  useDeletePointsProgram,
  useUpdatePointsProgram,
} from "@/hooks/use-points-programs";
import { cn } from "@/lib/utils";

interface PointsProgramFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: PointsProgram;
  accounts?: Account[];
  mode: "create" | "edit";
}

const formSchema = createPointsProgramSchema.omit({ userId: true });
type FormValues = z.infer<typeof formSchema>;

const PROGRAM_NAME_KEYS: PointsProgramName[] = [
  "livelo",
  "esfera",
  "iupp",
  "smiles",
  "latam_pass",
  "tudoazul",
  "ame",
  "meli",
  "outro",
];

export function PointsProgramFormDialog({
  open,
  onOpenChange,
  program,
  accounts = [],
  mode,
}: PointsProgramFormDialogProps) {
  const t = useTranslations("points");
  const createMutation = useCreatePointsProgram();
  const updateMutation = useUpdatePointsProgram();
  const deleteMutation = useDeletePointsProgram();
  const [accountsPopoverOpen, setAccountsPopoverOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      program: "livelo",
      memberId: "",
      linkedAccounts: [],
      notes: "",
    },
  });

  const selectedProgram = form.watch("program");
  const linkedAccounts = form.watch("linkedAccounts") || [];

  useEffect(() => {
    if (open && program && mode === "edit") {
      form.reset({
        program: program.program,
        memberId: program.memberId || "",
        linkedAccounts: program.linkedAccounts || [],
        notes: program.notes || "",
      });
    } else if (open && mode === "create") {
      form.reset({
        program: "livelo",
        memberId: "",
        linkedAccounts: [],
        notes: "",
      });
    }
  }, [open, program, mode, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      const cleanData = {
        ...data,
        memberId: data.memberId || undefined,
        notes: data.notes || undefined,
        linkedAccounts:
          data.linkedAccounts && data.linkedAccounts.length > 0
            ? data.linkedAccounts
            : undefined,
      };

      if (mode === "create") {
        await createMutation.mutateAsync(cleanData);
        toast.success(t("programs.form.messages.createSuccess"));
      } else if (program) {
        await updateMutation.mutateAsync({
          id: program.id,
          ...cleanData,
        });
        toast.success(t("programs.form.messages.updateSuccess"));
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        mode === "create"
          ? t("programs.form.messages.createError")
          : t("programs.form.messages.updateError"),
      );
    }
  };

  const handleDelete = async () => {
    if (!program?.id) return;

    try {
      await deleteMutation.mutateAsync(program.id);
      toast.success(t("programs.form.messages.deleteSuccess"));
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting program:", error);
      toast.error(t("programs.form.messages.deleteError"));
    }
  };

  const toggleAccount = (accountId: string) => {
    const current = linkedAccounts;
    const updated = current.includes(accountId)
      ? current.filter((id) => id !== accountId)
      : [...current, accountId];
    form.setValue("linkedAccounts", updated);
  };

  const removeAccount = (accountId: string) => {
    const current = linkedAccounts;
    form.setValue(
      "linkedAccounts",
      current.filter((id) => id !== accountId),
    );
  };

  const getAccountById = (id: string) => accounts.find((a) => a.id === id);

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isDeleteLoading = deleteMutation.isPending;

  const eligibleAccounts = accounts.filter(
    (a) =>
      ["card_credit", "card_debit", "prepaid"].includes(a.accountType) &&
      !a.archived,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? t("programs.form.create.title")
              : t("programs.form.edit.title")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("programs.form.create.description")
              : t("programs.form.edit.description")}
          </DialogDescription>
        </DialogHeader>

        {selectedProgram && (
          <div className="p-4 rounded-lg border bg-gradient-to-br from-accent/50 to-accent/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-background/80 backdrop-blur-sm">
                <ProgramIcon program={selectedProgram} className="size-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base">
                  {getProgramDisplayName(selectedProgram)}
                </p>
                {linkedAccounts.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {linkedAccounts.length}{" "}
                    {linkedAccounts.length === 1
                      ? t("programs.form.fields.linkedAccounts.singular")
                      : t("programs.form.fields.linkedAccounts.plural")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="program"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("programs.form.fields.program.label")} *
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            "programs.form.fields.program.placeholder",
                          )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROGRAM_NAME_KEYS.map((prog) => (
                        <SelectItem key={prog} value={prog}>
                          <div className="flex items-center gap-2">
                            <ProgramIcon program={prog} className="size-4" />
                            {getProgramDisplayName(prog)}
                          </div>
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
              name="memberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("programs.form.fields.memberId.label")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        "programs.form.fields.memberId.placeholder",
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("programs.form.fields.memberId.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linkedAccounts"
              render={() => (
                <FormItem>
                  <FormLabel>
                    {t("programs.form.fields.linkedAccounts.label")}
                  </FormLabel>
                  <Popover
                    open={accountsPopoverOpen}
                    onOpenChange={setAccountsPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={accountsPopoverOpen}
                          className="w-full justify-between"
                        >
                          {linkedAccounts.length > 0
                            ? `${linkedAccounts.length} ${
                                linkedAccounts.length === 1
                                  ? t(
                                      "programs.form.fields.linkedAccounts.singular",
                                    )
                                  : t(
                                      "programs.form.fields.linkedAccounts.plural",
                                    )
                              }`
                            : t(
                                "programs.form.fields.linkedAccounts.placeholder",
                              )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder={t(
                            "programs.form.fields.linkedAccounts.searchPlaceholder",
                          )}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {t(
                              "programs.form.fields.linkedAccounts.noAccounts",
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {eligibleAccounts.map((account) => (
                              <CommandItem
                                key={account.id}
                                value={account.name}
                                onSelect={() => toggleAccount(account.id)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    linkedAccounts.includes(account.id)
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{account.name}</span>
                                  {account.issuer && (
                                    <span className="text-xs text-muted-foreground">
                                      {account.issuer}
                                      {account.last4 &&
                                        ` •••• ${account.last4}`}
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {linkedAccounts.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {linkedAccounts.map((accountId) => {
                        const account = getAccountById(accountId);
                        return (
                          <Badge
                            key={accountId}
                            variant="secondary"
                            className="pr-1"
                          >
                            {account?.name || accountId}
                            <button
                              type="button"
                              className="ml-1 rounded-full hover:bg-muted p-0.5"
                              onClick={() => removeAccount(accountId)}
                            >
                              <X className="size-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  <FormDescription>
                    {t("programs.form.fields.linkedAccounts.description")}
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
                  <FormLabel>{t("programs.form.fields.notes.label")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("programs.form.fields.notes.placeholder")}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {mode === "edit" && program && (
                <div className="flex gap-2 mr-auto">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isLoading || isDeleteLoading}
                  >
                    {isDeleteLoading && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                    {!isDeleteLoading && <Trash2 className="size-4" />}
                    {t("programs.actions.delete")}
                  </Button>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading || isDeleteLoading}
              >
                {t("programs.form.actions.cancel")}
              </Button>
              <Button type="submit" disabled={isLoading || isDeleteLoading}>
                {isLoading && <Loader2 className="size-4 animate-spin" />}
                {mode === "create"
                  ? t("programs.form.actions.create")
                  : t("programs.form.actions.update")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
