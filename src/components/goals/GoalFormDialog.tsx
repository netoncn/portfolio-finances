"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import type { Goal } from "@/domain/goals";
import { useCreateGoal, useUpdateGoal } from "@/hooks/use-goals";

interface FormData {
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  category:
    | "emergency_fund"
    | "vacation"
    | "house"
    | "car"
    | "education"
    | "retirement"
    | "investment"
    | "debt_payoff"
    | "wedding"
    | "business"
    | "other";
  priority: "low" | "medium" | "high";
  targetDate?: string;
  icon?: string;
  notes?: string;
}

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal;
  mode: "create" | "edit";
}

export function GoalFormDialog({
  open,
  onOpenChange,
  goal,
  mode,
}: GoalFormDialogProps) {
  const t = useTranslations("goals.form");
  const tCommon = useTranslations("common");

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();

  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
      targetAmount: 0,
      currentAmount: 0,
      category: "other",
      priority: "medium",
      targetDate: "",
      icon: "🎯",
      notes: "",
    },
  });

  useEffect(() => {
    if (goal && mode === "edit") {
      form.reset({
        name: goal.name,
        description: goal.description || "",
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        category: goal.category,
        priority: goal.priority,
        targetDate: goal.targetDate
          ? new Date(goal.targetDate).toISOString().split("T")[0]
          : "",
        icon: goal.icon || "🎯",
        notes: goal.notes || "",
      });
    } else if (mode === "create") {
      form.reset({
        name: "",
        description: "",
        targetAmount: 0,
        currentAmount: 0,
        category: "other",
        priority: "medium",
        targetDate: "",
        icon: "🎯",
        notes: "",
      });
    }
  }, [goal, mode, form, open]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        targetDate: data.targetDate
          ? new Date(data.targetDate).getTime()
          : undefined,
      };

      if (mode === "create") {
        await createGoal.mutateAsync(payload);
        toast.success(t("messages.createSuccess"));
      } else if (goal) {
        await updateGoal.mutateAsync({
          id: goal.id,
          ...payload,
        });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{t("fields.name.label")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("fields.name.placeholder")}
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
                  <FormItem className="col-span-2">
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.category.label")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="emergency_fund">
                          {t("fields.category.emergency_fund")}
                        </SelectItem>
                        <SelectItem value="vacation">
                          {t("fields.category.vacation")}
                        </SelectItem>
                        <SelectItem value="house">
                          {t("fields.category.house")}
                        </SelectItem>
                        <SelectItem value="car">
                          {t("fields.category.car")}
                        </SelectItem>
                        <SelectItem value="education">
                          {t("fields.category.education")}
                        </SelectItem>
                        <SelectItem value="retirement">
                          {t("fields.category.retirement")}
                        </SelectItem>
                        <SelectItem value="investment">
                          {t("fields.category.investment")}
                        </SelectItem>
                        <SelectItem value="debt_payoff">
                          {t("fields.category.debt_payoff")}
                        </SelectItem>
                        <SelectItem value="wedding">
                          {t("fields.category.wedding")}
                        </SelectItem>
                        <SelectItem value="business">
                          {t("fields.category.business")}
                        </SelectItem>
                        <SelectItem value="other">
                          {t("fields.category.other")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.priority.label")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">
                          {t("fields.priority.low")}
                        </SelectItem>
                        <SelectItem value="medium">
                          {t("fields.priority.medium")}
                        </SelectItem>
                        <SelectItem value="high">
                          {t("fields.priority.high")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.targetAmount.label")}</FormLabel>
                    <FormControl>
                      <MoneyInput
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("fields.targetAmount.description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.currentAmount.label")}</FormLabel>
                    <FormControl>
                      <MoneyInput
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.targetDate.label")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.icon.label")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("fields.icon.placeholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{t("fields.notes.label")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("fields.notes.placeholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                disabled={createGoal.isPending || updateGoal.isPending}
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
