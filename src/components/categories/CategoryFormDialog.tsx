"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCategorySchema } from "@/domain/categories/schemas/category.schema";
import type {
  Category,
  CategoryType,
} from "@/domain/categories/types/category";
import { useCreateCategory, useUpdateCategory } from "@/hooks/use-categories";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  mode: "create" | "edit";
}

const formSchema = createCategorySchema.omit({ userId: true }).extend({
  keywords: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CATEGORY_TYPE_KEYS: CategoryType[] = ["expense", "income", "transfer"];

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  mode,
}: CategoryFormDialogProps) {
  const t = useTranslations("categories");
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "expense",
      icon: "",
      color: "",
      keywords: "",
      budgetLimit: undefined,
    },
  });

  useEffect(() => {
    if (open && category && mode === "edit") {
      form.reset({
        name: category.name,
        type: category.type,
        icon: category.icon || "",
        color: category.color || "",
        keywords: category.keywords?.join(", ") || "",
        budgetLimit: category.budgetLimit,
      });
    } else if (open && mode === "create") {
      form.reset({
        name: "",
        type: "expense",
        icon: "",
        color: "",
        keywords: "",
        budgetLimit: undefined,
      });
    }
  }, [open, category, mode, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      const keywordsArray = data.keywords
        ? data.keywords
            .split(",")
            .map((k) => k.trim())
            .filter((k) => k.length > 0)
        : undefined;

      const payload = {
        ...data,
        keywords: keywordsArray,
        icon: data.icon || undefined,
        color: data.color || undefined,
      };

      if (mode === "create") {
        await createMutation.mutateAsync(payload);
        toast.success(t("form.messages.createSuccess"));
      } else if (category) {
        await updateMutation.mutateAsync({
          id: category.id,
          ...payload,
        });
        toast.success(t("form.messages.updateSuccess"));
      }

      onOpenChange(false);
      form.reset();
    } catch (error) {
      const errorMessage =
        mode === "create"
          ? t("form.messages.createError")
          : t("form.messages.updateError");
      toast.error(errorMessage);
      console.error(`Error ${mode}ing category:`, error);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.fields.type.label")}</FormLabel>
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
                        {CATEGORY_TYPE_KEYS.map((type) => (
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <FormDescription>
                      {t("form.fields.icon.description")}
                    </FormDescription>
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
                          placeholder={t("form.fields.color.placeholder")}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      {t("form.fields.color.description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.fields.keywords.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("form.fields.keywords.placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("form.fields.keywords.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="budgetLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.fields.budgetLimit.label")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={t("form.fields.budgetLimit.placeholder")}
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
                    {t("form.fields.budgetLimit.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t("actions.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
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
