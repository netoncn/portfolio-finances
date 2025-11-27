"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, CheckCircle, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  getProgramDisplayName,
  ProgramIcon,
} from "@/components/points/ProgramIcon";
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
import type {
  PointsBalance,
  PointsProgram,
} from "@/domain/points/types/points";
import {
  useCreatePointsBalance,
  useDeletePointsBalance,
  useRedeemPointsBalance,
  useUpdatePointsBalance,
} from "@/hooks/use-points-balances";
import { cn } from "@/lib/utils";

interface PointsBalanceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance?: PointsBalance;
  programs: PointsProgram[];
  mode: "create" | "edit";
  defaultProgramId?: string;
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

function parseDateFromInput(dateString: string): Date {
  return new Date(`${dateString}T00:00:00`);
}

const formSchema = z.object({
  programId: z.string().min(1, "Selecione um programa"),
  points: z.number().int().positive("Deve ser maior que zero"),
  earnedAt: z.string().min(1, "Selecione uma data"),
  expiresAt: z.string().min(1, "Selecione uma data"),
  source: z.enum(["credit_card", "partner", "promo", "transfer"]).optional(),
  promoTag: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const SOURCE_OPTIONS = [
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "partner", label: "Parceiro" },
  { value: "promo", label: "Promoção" },
  { value: "transfer", label: "Transferência" },
];

export function PointsBalanceFormDialog({
  open,
  onOpenChange,
  balance,
  programs,
  mode,
  defaultProgramId,
}: PointsBalanceFormDialogProps) {
  const t = useTranslations("points");
  const createMutation = useCreatePointsBalance();
  const updateMutation = useUpdatePointsBalance();
  const deleteMutation = useDeletePointsBalance();
  const redeemMutation = useRedeemPointsBalance();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      programId: defaultProgramId || "",
      points: 0,
      earnedAt: formatDateForInput(new Date()),
      expiresAt: formatDateForInput(
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      ),
      source: undefined,
      promoTag: "",
    },
  });

  const selectedProgramId = form.watch("programId");
  const selectedProgram = programs.find((p) => p.id === selectedProgramId);

  useEffect(() => {
    if (open && balance && mode === "edit") {
      form.reset({
        programId: balance.programId,
        points: balance.points,
        earnedAt: formatDateForInput(new Date(balance.earnedAt)),
        expiresAt: formatDateForInput(new Date(balance.expiresAt)),
        source: balance.source,
        promoTag: balance.promoTag || "",
      });
    } else if (open && mode === "create") {
      form.reset({
        programId: defaultProgramId || "",
        points: 0,
        earnedAt: formatDateForInput(new Date()),
        expiresAt: formatDateForInput(
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        ),
        source: undefined,
        promoTag: "",
      });
    }
  }, [open, balance, mode, form, defaultProgramId]);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        programId: data.programId,
        points: data.points,
        earnedAt: parseDateFromInput(data.earnedAt).getTime(),
        expiresAt: parseDateFromInput(data.expiresAt).getTime(),
        source: data.source,
        promoTag: data.promoTag || undefined,
      };

      if (mode === "create") {
        await createMutation.mutateAsync(payload);
        toast.success(t("balances.form.messages.createSuccess"));
      } else if (balance) {
        await updateMutation.mutateAsync({
          id: balance.id,
          ...payload,
        });
        toast.success(t("balances.form.messages.updateSuccess"));
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        mode === "create"
          ? t("balances.form.messages.createError")
          : t("balances.form.messages.updateError"),
      );
    }
  };

  const handleDelete = async () => {
    if (!balance?.id) return;

    try {
      await deleteMutation.mutateAsync(balance.id);
      toast.success(t("balances.form.messages.deleteSuccess"));
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting balance:", error);
      toast.error(t("balances.form.messages.deleteError"));
    }
  };

  const handleRedeem = async () => {
    if (!balance?.id) return;

    try {
      await redeemMutation.mutateAsync(balance.id);
      toast.success(t("balances.form.messages.redeemSuccess"));
      onOpenChange(false);
    } catch (error) {
      console.error("Error redeeming balance:", error);
      toast.error(t("balances.form.messages.redeemError"));
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isActionLoading = deleteMutation.isPending || redeemMutation.isPending;
  const isBalanceActive = balance?.status === "active";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? t("balances.form.create.title")
              : t("balances.form.edit.title")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("balances.form.create.description")
              : t("balances.form.edit.description")}
          </DialogDescription>
        </DialogHeader>

        {selectedProgram && (
          <div className="p-4 rounded-lg border bg-gradient-to-br from-accent/50 to-accent/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-background/80 backdrop-blur-sm">
                <ProgramIcon
                  program={selectedProgram.program}
                  className="size-6"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base">
                  {getProgramDisplayName(selectedProgram.program)}
                </p>
                {balance && (
                  <p className="text-sm text-muted-foreground">
                    {balance.points.toLocaleString("pt-BR")} pontos
                  </p>
                )}
              </div>
              {balance && (
                <div
                  className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    balance.status === "active" &&
                      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                    balance.status === "redeemed" &&
                      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                    balance.status === "expired" &&
                      "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
                  )}
                >
                  {t(`balances.status.${balance.status}`)}
                </div>
              )}
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="programId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("balances.form.fields.program.label")} *
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={mode === "edit"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            "balances.form.fields.program.placeholder",
                          )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          <div className="flex items-center gap-2">
                            <ProgramIcon
                              program={program.program}
                              className="size-4"
                            />
                            {getProgramDisplayName(program.program)}
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
              name="points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("balances.form.fields.points.label")} *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="10000"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("balances.form.fields.points.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="earnedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("balances.form.fields.earnedAt.label")} *
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input type="date" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("balances.form.fields.expiresAt.label")} *
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input type="date" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("balances.form.fields.source.label")}
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            "balances.form.fields.source.placeholder",
                          )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SOURCE_OPTIONS.map((source) => (
                        <SelectItem key={source.value} value={source.value}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("balances.form.fields.source.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="promoTag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("balances.form.fields.promoTag.label")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        "balances.form.fields.promoTag.placeholder",
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("balances.form.fields.promoTag.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {mode === "edit" && balance && (
                <div className="flex gap-2 mr-auto">
                  {isBalanceActive && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleRedeem}
                      disabled={isLoading || isActionLoading}
                    >
                      {redeemMutation.isPending && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      {!redeemMutation.isPending && (
                        <CheckCircle className="size-4" />
                      )}
                      {t("balances.actions.redeem")}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isLoading || isActionLoading}
                  >
                    {deleteMutation.isPending && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                    {!deleteMutation.isPending && <Trash2 className="size-4" />}
                    {t("balances.actions.delete")}
                  </Button>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading || isActionLoading}
              >
                {t("balances.form.actions.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  isActionLoading ||
                  (!isBalanceActive && mode === "edit")
                }
              >
                {isLoading && <Loader2 className="size-4 animate-spin" />}
                {mode === "create"
                  ? t("balances.form.actions.create")
                  : t("balances.form.actions.update")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
