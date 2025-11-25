"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
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
import { categoryTypeEnum } from "@/domain/categories/schemas/category.schema";
import {
  createMappingRuleSchema,
  ruleActionTypeEnum,
  ruleConditionTypeEnum,
  rulePriorityEnum,
} from "@/domain/categories/schemas/mapping-rule.schema";
import type { Category } from "@/domain/categories/types/category";
import type {
  MappingRule,
  RuleAction,
  RuleCondition,
} from "@/domain/categories/types/mapping-rule";

interface RuleMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: MappingRule | null;
  categories: Category[];
  onSave: (rule: z.infer<typeof createMappingRuleSchema>) => void;
}

export function RuleMappingDialog({
  open,
  onOpenChange,
  rule,
  categories,
  onSave,
}: RuleMappingDialogProps) {
  const t = useTranslations("rules");
  const [conditions, setConditions] = useState<RuleCondition[]>(
    rule?.conditions || [{ type: "description_contains", value: "" }],
  );
  const [actions, setActions] = useState<RuleAction[]>(
    rule?.actions || [{ type: "assign_category", value: "" }],
  );

  const form = useForm<z.infer<typeof createMappingRuleSchema>>({
    resolver: zodResolver(createMappingRuleSchema),
    defaultValues: {
      name: rule?.name || "",
      description: rule?.description || "",
      categoryType: rule?.categoryType,
      conditions: conditions,
      actions: actions,
      priority: rule?.priority || "medium",
      enabled: rule?.enabled ?? true,
      userId: "",
    },
  });

  const addCondition = () => {
    setConditions([...conditions, { type: "description_contains", value: "" }]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], ...updates };
    setConditions(updated);
  };

  const addAction = () => {
    setActions([...actions, { type: "assign_category", value: "" }]);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, updates: Partial<RuleAction>) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], ...updates };
    setActions(updated);
  };

  const onSubmit = (data: z.infer<typeof createMappingRuleSchema>) => {
    onSave({ ...data, conditions, actions });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {rule ? t("actions.edit") : t("actions.new")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.name")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("placeholders.name")} />
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
                  <FormLabel>{t("fields.description")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("placeholders.description")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.categoryType")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("placeholders.categoryType")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryTypeEnum.options.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`categoryTypes.${type}`)}
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
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.priority")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rulePriorityEnum.options.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {t(`priorities.${priority}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>{t("sections.conditions")}</FormLabel>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addCondition}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("actions.addCondition")}
                </Button>
              </div>

              {conditions.map((condition, index) => (
                <div key={index} className="flex gap-2 rounded-md border p-3">
                  <div className="flex-1 space-y-2">
                    <Select
                      value={condition.type}
                      onValueChange={(value) =>
                        updateCondition(index, {
                          type: value as RuleCondition["type"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ruleConditionTypeEnum.options.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`conditionTypes.${type}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      value={
                        typeof condition.value === "string"
                          ? condition.value
                          : ""
                      }
                      onChange={(e) =>
                        updateCondition(index, { value: e.target.value })
                      }
                      placeholder={t("placeholders.conditionValue")}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCondition(index)}
                    disabled={conditions.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>{t("sections.actions")}</FormLabel>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addAction}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("actions.addAction")}
                </Button>
              </div>

              {actions.map((action, index) => (
                <div key={index} className="flex gap-2 rounded-md border p-3">
                  <div className="flex-1 space-y-2">
                    <Select
                      value={action.type}
                      onValueChange={(value) =>
                        updateAction(index, {
                          type: value as RuleAction["type"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ruleActionTypeEnum.options.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`actionTypes.${type}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {action.type === "assign_category" ? (
                      <Select
                        value={
                          typeof action.value === "string" ? action.value : ""
                        }
                        onValueChange={(value) =>
                          updateAction(index, { value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("placeholders.selectCategory")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.icon} {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={
                          typeof action.value === "string" ? action.value : ""
                        }
                        onChange={(e) =>
                          updateAction(index, { value: e.target.value })
                        }
                        placeholder={t("placeholders.actionValue")}
                      />
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAction(index)}
                    disabled={actions.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("actions.cancel")}
              </Button>
              <Button type="submit">{t("actions.save")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
