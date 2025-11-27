"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar,
  ExternalLink,
  Loader2,
  Sparkles,
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
  PointsOffer,
  PointsProgramName,
} from "@/domain/points/types/points";
import {
  useCreatePointsOffer,
  useDeletePointsOffer,
  useUpdatePointsOffer,
} from "@/hooks/use-points-offers";

interface PointsOfferFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer?: PointsOffer;
  mode: "create" | "edit";
  defaultProgram?: PointsProgramName;
}

const PROGRAM_OPTIONS: PointsProgramName[] = [
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

function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

function parseDateFromInput(dateString: string): Date {
  return new Date(`${dateString}T23:59:59`);
}

const formSchema = z.object({
  program: z.enum([
    "livelo",
    "esfera",
    "iupp",
    "smiles",
    "latam_pass",
    "tudoazul",
    "ame",
    "meli",
    "outro",
  ]),
  title: z.string().min(2, "Título deve ter pelo menos 2 caracteres"),
  description: z.string().min(2, "Descrição deve ter pelo menos 2 caracteres"),
  bonus: z.number().min(0, "Bônus deve ser maior ou igual a 0"),
  validUntil: z.string().min(1, "Selecione uma data de validade"),
  termsUrl: z.string().url("URL inválida").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export function PointsOfferFormDialog({
  open,
  onOpenChange,
  offer,
  mode,
  defaultProgram,
}: PointsOfferFormDialogProps) {
  const t = useTranslations("points");
  const createMutation = useCreatePointsOffer();
  const updateMutation = useUpdatePointsOffer();
  const deleteMutation = useDeletePointsOffer();

  const defaultValidUntil = new Date();
  defaultValidUntil.setDate(defaultValidUntil.getDate() + 30);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      program: defaultProgram || "livelo",
      title: "",
      description: "",
      bonus: 0,
      validUntil: formatDateForInput(defaultValidUntil),
      termsUrl: "",
    },
  });

  const selectedProgram = form.watch("program");

  useEffect(() => {
    if (open && offer && mode === "edit") {
      form.reset({
        program: offer.program,
        title: offer.title,
        description: offer.description,
        bonus: offer.bonus,
        validUntil: formatDateForInput(new Date(offer.validUntil)),
        termsUrl: offer.termsUrl || "",
      });
    } else if (open && mode === "create") {
      form.reset({
        program: defaultProgram || "livelo",
        title: "",
        description: "",
        bonus: 0,
        validUntil: formatDateForInput(defaultValidUntil),
        termsUrl: "",
      });
    }
  }, [open, offer, mode, form, defaultProgram]);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        program: data.program,
        title: data.title,
        description: data.description,
        bonus: data.bonus,
        validUntil: parseDateFromInput(data.validUntil).getTime(),
        termsUrl: data.termsUrl || undefined,
      };

      if (mode === "create") {
        await createMutation.mutateAsync(payload);
        toast.success(t("offers.form.messages.createSuccess"));
      } else if (offer) {
        await updateMutation.mutateAsync({
          id: offer.id,
          ...payload,
        });
        toast.success(t("offers.form.messages.updateSuccess"));
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        mode === "create"
          ? t("offers.form.messages.createError")
          : t("offers.form.messages.updateError"),
      );
    }
  };

  const handleDelete = async () => {
    if (!offer?.id) return;

    try {
      await deleteMutation.mutateAsync(offer.id);
      toast.success(t("offers.form.messages.deleteSuccess"));
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting offer:", error);
      toast.error(t("offers.form.messages.deleteError"));
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isDeleteLoading = deleteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? t("offers.form.create.title")
              : t("offers.form.edit.title")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("offers.form.create.description")
              : t("offers.form.edit.description")}
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
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Sparkles className="size-4 text-yellow-500" />
                  <span>{t("offers.form.offerPreview")}</span>
                </div>
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
                    {t("offers.form.fields.program.label")} *
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
                            "offers.form.fields.program.placeholder",
                          )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROGRAM_OPTIONS.map((program) => (
                        <SelectItem key={program} value={program}>
                          <div className="flex items-center gap-2">
                            <ProgramIcon program={program} className="size-4" />
                            {getProgramDisplayName(program)}
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("offers.form.fields.title.label")} *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("offers.form.fields.title.placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("offers.form.fields.description.label")} *
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t(
                        "offers.form.fields.description.placeholder",
                      )}
                      className="resize-none"
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
                name="bonus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("offers.form.fields.bonus.label")} *
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Sparkles className="absolute left-3 top-3 h-4 w-4 text-yellow-500" />
                        <Input
                          type="number"
                          placeholder="50"
                          className="pl-9"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : 0,
                            )
                          }
                        />
                        <span className="absolute right-3 top-3 text-muted-foreground">
                          %
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      {t("offers.form.fields.bonus.description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validUntil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("offers.form.fields.validUntil.label")} *
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
              name="termsUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("offers.form.fields.termsUrl.label")}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <ExternalLink className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="url"
                        placeholder={t(
                          "offers.form.fields.termsUrl.placeholder",
                        )}
                        className="pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    {t("offers.form.fields.termsUrl.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {mode === "edit" && offer && (
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
                    {t("offers.actions.delete")}
                  </Button>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading || isDeleteLoading}
              >
                {t("offers.form.actions.cancel")}
              </Button>
              <Button type="submit" disabled={isLoading || isDeleteLoading}>
                {isLoading && <Loader2 className="size-4 animate-spin" />}
                {mode === "create"
                  ? t("offers.form.actions.create")
                  : t("offers.form.actions.update")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
