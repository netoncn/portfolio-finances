"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import { MoneyInput } from "@/components/ui/money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Budget,
  BudgetPeriod,
  BudgetStatus,
} from "@/domain/budgets/types/budget";
import { useCreateBudget, useUpdateBudget } from "@/hooks/use-budgets";
import { useCategories } from "@/hooks/use-categories";

interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: Budget;
  mode: "create" | "edit";
}

const formSchema = z
  .object({
    name: z.string().min(1).max(100),
    amount: z.number().int().nonnegative(),
    period: z.enum(["monthly", "yearly", "quarterly", "custom"]),
    categoryIds: z.array(z.string()),
    startDate: z.number().int(),
    endDate: z.number().int().optional(),
    alertThreshold: z.number().min(0).max(1).optional(),
    status: z.enum(["active", "inactive", "completed"]),
    icon: z.string().max(10).optional(),
    color: z
      .string()
      .refine((val) => val === "" || /^#[0-9A-Fa-f]{6}$/.test(val), {
        message: "Color must be a valid hex color (#RRGGBB) or empty",
      })
      .optional(),
    notes: z.string().max(500).optional(),
    rollover: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.period === "custom") return !!data.endDate;
      return true;
    },
    {
      message: "End date is required for custom period budgets",
      path: ["endDate"],
    },
  )
  .refine(
    (data) => {
      if (data.endDate) return data.endDate > data.startDate;
      return true;
    },
    { message: "End date must be after start date", path: ["endDate"] },
  );

type FormValues = z.infer<typeof formSchema>;

const BUDGET_PERIOD_KEYS: BudgetPeriod[] = [
  "monthly",
  "yearly",
  "quarterly",
  "custom",
];
const BUDGET_STATUS_KEYS: BudgetStatus[] = ["active", "inactive", "completed"];

export function BudgetFormDialog({
  open,
  onOpenChange,
  budget,
  mode,
}: BudgetFormDialogProps) {
  const t = useTranslations("budgets");
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const { data: categories = [] } = useCategories();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: async (data, context, options) => {
      console.log("[BudgetForm] Zod resolver called with data:", data);
      const result = await zodResolver(formSchema)(data, context, options);
      console.log("[BudgetForm] Zod resolver result:", result);
      return result;
    },
    defaultValues: {
      name: "",
      amount: 0,
      period: "monthly",
      categoryIds: [],
      startDate: Date.now(),
      endDate: undefined,
      alertThreshold: 0.8,
      status: "active",
      icon: "",
      color: "",
      notes: "",
      rollover: false,
    },
  });

  const period = form.watch("period");

  useEffect(() => {
    if (open && budget && mode === "edit") {
      form.reset({
        name: budget.name,
        amount: budget.amount,
        period: budget.period,
        categoryIds: budget.categoryIds,
        startDate: budget.startDate,
        endDate: budget.endDate,
        alertThreshold: budget.alertThreshold,
        status: budget.status,
        icon: budget.icon || "",
        color: budget.color || "",
        notes: budget.notes || "",
        rollover: budget.rollover || false,
      });
      setSelectedCategories(budget.categoryIds);
    } else if (open && mode === "create") {
      const now = Date.now();
      form.reset({
        name: "",
        amount: 0,
        period: "monthly",
        categoryIds: [],
        startDate: now,
        endDate: undefined,
        alertThreshold: 0.8,
        status: "active",
        icon: "",
        color: "",
        notes: "",
        rollover: false,
      });
      setSelectedCategories([]);
    }
  }, [open, budget, mode, form]);

  const onSubmit = async (data: FormValues) => {
    console.log("[BudgetForm] ========== onSubmit FUNCTION CALLED ==========");
    console.log("[BudgetForm] onSubmit called", {
      mode,
      data,
      selectedCategories,
    });
    console.log("[BudgetForm] onSubmit typeof:", typeof onSubmit);

    try {
      const cleanedData = {
        ...data,
        categoryIds: selectedCategories,
        icon: data.icon && data.icon.trim() !== "" ? data.icon : undefined,
        color: data.color && data.color.trim() !== "" ? data.color : undefined,
        notes: data.notes && data.notes.trim() !== "" ? data.notes : undefined,
      };

      console.log("[BudgetForm] Payload prepared:", cleanedData);

      if (mode === "create") {
        console.log("[BudgetForm] Creating budget...");
        await createMutation.mutateAsync(cleanedData);
        console.log("[BudgetForm] Budget created successfully");
        toast.success(t("form.messages.createSuccess"));
      } else if (budget) {
        console.log("[BudgetForm] Updating budget...", budget.id);
        await updateMutation.mutateAsync({
          id: budget.id,
          ...cleanedData,
        });
        console.log("[BudgetForm] Budget updated successfully");
        toast.success(t("form.messages.updateSuccess"));
      }

      onOpenChange(false);
      form.reset();
      setSelectedCategories([]);
    } catch (error) {
      console.error(`[BudgetForm] Error ${mode}ing budget:`, error);
      const errorMessage =
        mode === "create"
          ? t("form.messages.createError")
          : t("form.messages.updateError");
      toast.error(errorMessage);
    }
  };

  console.log(
    "[BudgetForm] Component rendered, onSubmit defined:",
    typeof onSubmit,
  );

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const expenseCategories = categories.filter((c) => c.type === "expense");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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

        <Form {...form}>
          <form
            onSubmit={(e) => {
              console.log("[BudgetForm] Form submit event triggered");
              console.log("[BudgetForm] Form state:", form.formState);
              console.log("[BudgetForm] Form values:", form.getValues());
              console.log("[BudgetForm] Form errors:", form.formState.errors);
              console.log("[BudgetForm] Form isValid:", form.formState.isValid);
              console.log("[BudgetForm] Form isDirty:", form.formState.isDirty);

              const handleSubmitFn = form.handleSubmit(
                (data) => {
                  console.log(
                    "[BudgetForm] handleSubmit SUCCESS callback called with:",
                    data,
                  );
                  onSubmit(data);
                },
                (errors) => {
                  console.error(
                    "[BudgetForm] handleSubmit ERROR callback called with:",
                    errors,
                  );
                },
              );

              console.log("[BudgetForm] About to call handleSubmitFn");
              handleSubmitFn(e);
              console.log("[BudgetForm] handleSubmitFn called");
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.fields.amount.label")}</FormLabel>
                    <FormControl>
                      <MoneyInput
                        placeholder={t("form.fields.amount.placeholder")}
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("form.fields.amount.description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.fields.period.label")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BUDGET_PERIOD_KEYS.map((periodKey) => (
                          <SelectItem key={periodKey} value={periodKey}>
                            {t(`periods.${periodKey}`)}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.fields.status.label")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BUDGET_STATUS_KEYS.map((statusKey) => (
                          <SelectItem key={statusKey} value={statusKey}>
                            {t(`status.${statusKey}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {period === "custom" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.fields.startDate.label")}</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={
                            field.value
                              ? new Date(field.value)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            field.onChange(new Date(e.target.value).getTime())
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.fields.endDate.label")}</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={
                            field.value
                              ? new Date(field.value)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            field.onChange(new Date(e.target.value).getTime())
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormItem>
              <FormLabel>{t("form.fields.categories.label")}</FormLabel>
              <FormDescription>
                {t("form.fields.categories.description")}
              </FormDescription>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {expenseCategories.map((category) => (
                  <Button
                    key={category.id}
                    type="button"
                    variant={
                      selectedCategories.includes(category.id)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => toggleCategory(category.id)}
                    className="justify-start"
                  >
                    {category.icon && (
                      <span className="mr-2">{category.icon}</span>
                    )}
                    {category.name}
                  </Button>
                ))}
              </div>
              {selectedCategories.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {t("form.fields.categories.allCategories")}
                </p>
              )}
            </FormItem>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="alertThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("form.fields.alertThreshold.label")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        placeholder="0.80"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(
                            value === "" ? undefined : Number(value),
                          );
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("form.fields.alertThreshold.description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.fields.icon.label")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("form.fields.icon.placeholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.fields.color.label")}</FormLabel>
                    <FormControl>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={field.value || "#000000"}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="h-10 w-20 rounded-md border border-input cursor-pointer"
                        />
                        <Input
                          placeholder="#000000"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </FormControl>
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
                  <FormLabel>{t("form.fields.notes.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("form.fields.notes.placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  console.log("[BudgetForm] Cancel button clicked");
                  onOpenChange(false);
                }}
                disabled={isSubmitting}
              >
                {t("actions.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                onClick={() => {
                  console.log("[BudgetForm] Submit button clicked");
                  console.log("[BudgetForm] isSubmitting:", isSubmitting);
                }}
              >
                {isSubmitting && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                )}
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
