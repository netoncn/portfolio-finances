"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Loader2,
  RefreshCw,
  Settings2,
  Trash2,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import type {
  PointsOperation,
  PointsProgram,
} from "@/domain/points/types/points";
import {
  useCreatePointsOperation,
  useDeletePointsOperation,
  useUpdatePointsOperation,
} from "@/hooks/use-points-operations";
import { cn } from "@/lib/utils";

interface PointsOperationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operation?: PointsOperation;
  programs: PointsProgram[];
  mode: "create" | "edit";
  defaultProgramId?: string;
  defaultType?: PointsOperation["type"];
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

function parseDateFromInput(dateString: string): Date {
  return new Date(`${dateString}T00:00:00`);
}

const OPERATION_TYPES = [
  {
    value: "earn",
    label: "Ganhar",
    icon: ArrowDownLeft,
    color: "text-green-600",
  },
  {
    value: "redeem",
    label: "Resgatar",
    icon: ArrowUpRight,
    color: "text-blue-600",
  },
  {
    value: "transfer_in",
    label: "Receber Transferência",
    icon: ArrowDownLeft,
    color: "text-purple-600",
  },
  {
    value: "transfer_out",
    label: "Enviar Transferência",
    icon: ArrowUpRight,
    color: "text-orange-600",
  },
  {
    value: "adjust",
    label: "Ajustar",
    icon: Settings2,
    color: "text-gray-600",
  },
] as const;

const formSchema = z.object({
  programId: z.string().min(1, "Selecione um programa"),
  date: z.string().min(1, "Selecione uma data"),
  type: z.enum(["earn", "redeem", "transfer_in", "transfer_out", "adjust"]),
  pointsDelta: z
    .number()
    .int()
    .refine((val) => val !== 0, "Valor não pode ser zero"),
  partnerOrAirline: z.string().optional(),
  rateOrBonus: z.number().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function PointsOperationFormDialog({
  open,
  onOpenChange,
  operation,
  programs,
  mode,
  defaultProgramId,
  defaultType = "earn",
}: PointsOperationFormDialogProps) {
  const t = useTranslations("points");
  const createMutation = useCreatePointsOperation();
  const updateMutation = useUpdatePointsOperation();
  const deleteMutation = useDeletePointsOperation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      programId: defaultProgramId || "",
      date: formatDateForInput(new Date()),
      type: defaultType,
      pointsDelta: 0,
      partnerOrAirline: "",
      rateOrBonus: undefined,
      notes: "",
    },
  });

  const selectedProgramId = form.watch("programId");
  const selectedType = form.watch("type");
  const selectedProgram = programs.find((p) => p.id === selectedProgramId);

  const isNegativeType =
    selectedType === "redeem" || selectedType === "transfer_out";

  useEffect(() => {
    if (open && operation && mode === "edit") {
      form.reset({
        programId: operation.programId,
        date: formatDateForInput(new Date(operation.date)),
        type: operation.type,
        pointsDelta: Math.abs(operation.pointsDelta),
        partnerOrAirline: operation.partnerOrAirline || "",
        rateOrBonus: operation.rateOrBonus,
        notes: operation.notes || "",
      });
    } else if (open && mode === "create") {
      form.reset({
        programId: defaultProgramId || "",
        date: formatDateForInput(new Date()),
        type: defaultType,
        pointsDelta: 0,
        partnerOrAirline: "",
        rateOrBonus: undefined,
        notes: "",
      });
    }
  }, [open, operation, mode, form, defaultProgramId, defaultType]);

  const onSubmit = async (data: FormValues) => {
    try {
      const signedPointsDelta =
        data.type === "redeem" || data.type === "transfer_out"
          ? -Math.abs(data.pointsDelta)
          : Math.abs(data.pointsDelta);

      const payload = {
        programId: data.programId,
        date: parseDateFromInput(data.date).getTime(),
        type: data.type,
        pointsDelta: signedPointsDelta,
        partnerOrAirline: data.partnerOrAirline || undefined,
        rateOrBonus: data.rateOrBonus || undefined,
        notes: data.notes || undefined,
      };

      if (mode === "create") {
        await createMutation.mutateAsync(payload);
        toast.success(t("operations.form.messages.createSuccess"));
      } else if (operation) {
        await updateMutation.mutateAsync({
          id: operation.id,
          ...payload,
        });
        toast.success(t("operations.form.messages.updateSuccess"));
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        mode === "create"
          ? t("operations.form.messages.createError")
          : t("operations.form.messages.updateError"),
      );
    }
  };

  const handleDelete = async () => {
    if (!operation?.id) return;

    try {
      await deleteMutation.mutateAsync(operation.id);
      toast.success(t("operations.form.messages.deleteSuccess"));
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting operation:", error);
      toast.error(t("operations.form.messages.deleteError"));
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isDeleteLoading = deleteMutation.isPending;

  const selectedTypeConfig = OPERATION_TYPES.find(
    (t) => t.value === selectedType,
  );
  const TypeIcon = selectedTypeConfig?.icon || RefreshCw;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? t("operations.form.create.title")
              : t("operations.form.edit.title")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("operations.form.create.description")
              : t("operations.form.edit.description")}
          </DialogDescription>
        </DialogHeader>

        {selectedProgram && selectedType && (
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
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <TypeIcon
                    className={cn("size-4", selectedTypeConfig?.color)}
                  />
                  <span>{t(`operations.types.${selectedType}`)}</span>
                </div>
              </div>
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
                    {t("operations.form.fields.program.label")} *
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
                            "operations.form.fields.program.placeholder",
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("operations.form.fields.type.label")} *
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              "operations.form.fields.type.placeholder",
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {OPERATION_TYPES.map((type) => {
                          const Icon = type.icon;
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <Icon className={cn("size-4", type.color)} />
                                {t(`operations.types.${type.value}`)}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("operations.form.fields.date.label")} *
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
              name="pointsDelta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("operations.form.fields.points.label")} *
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span
                        className={cn(
                          "absolute left-3 top-3 font-semibold",
                          isNegativeType ? "text-red-600" : "text-green-600",
                        )}
                      >
                        {isNegativeType ? "-" : "+"}
                      </span>
                      <Input
                        type="number"
                        placeholder="10000"
                        className="pl-8"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? Math.abs(Number(e.target.value))
                              : 0,
                          )
                        }
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    {t("operations.form.fields.points.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="partnerOrAirline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("operations.form.fields.partner.label")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          "operations.form.fields.partner.placeholder",
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rateOrBonus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("operations.form.fields.rate.label")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="1.5"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      {t("operations.form.fields.rate.description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("operations.form.fields.notes.label")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t(
                        "operations.form.fields.notes.placeholder",
                      )}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {mode === "edit" && operation && (
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
                    {t("operations.actions.delete")}
                  </Button>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading || isDeleteLoading}
              >
                {t("operations.form.actions.cancel")}
              </Button>
              <Button type="submit" disabled={isLoading || isDeleteLoading}>
                {isLoading && <Loader2 className="size-4 animate-spin" />}
                {mode === "create"
                  ? t("operations.form.actions.create")
                  : t("operations.form.actions.update")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
