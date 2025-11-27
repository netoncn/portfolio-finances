"use client";

import { Plus, Target } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyGoals } from "@/components/empty-states";
import { GoalCard } from "@/components/goals/GoalCard";
import { GoalFormDialog } from "@/components/goals/GoalFormDialog";
import { ListSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Goal } from "@/domain/goals";
import { useDeleteGoal, useGoals, useGoalsSummary } from "@/hooks/use-goals";
import { formatCurrency } from "@/lib/utils";

export default function GoalsPage() {
  const t = useTranslations("goals");

  const { data: goals = [], isLoading } = useGoals();
  const { data: summary } = useGoalsSummary();
  const deleteGoal = useDeleteGoal();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");

  const handleCreate = () => {
    setEditingGoal(undefined);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDelete = async (goal: Goal) => {
    if (window.confirm(t("deleteDialog.description"))) {
      try {
        await deleteGoal.mutateAsync(goal.id);
        toast.success(t("form.messages.deleteSuccess"));
      } catch {
        toast.error(t("form.messages.deleteError"));
      }
    }
  };

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const otherGoals = goals.filter(
    (g) => g.status !== "active" && g.status !== "completed",
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Target className="size-10 text-primary" />
                {t("title")}
              </h1>
              <p className="text-muted-foreground text-base">
                {t("description")}
              </p>
            </div>
            <Button
              onClick={handleCreate}
              className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
            >
              <Plus className="size-4" />
              {t("actions.new")}
            </Button>
          </div>
        </div>

        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{t("summary.totalGoals")}</CardDescription>
                <CardTitle className="text-3xl">{summary.totalGoals}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>{t("summary.activeGoals")}</CardDescription>
                <CardTitle className="text-3xl text-blue-600">
                  {summary.activeGoals}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>
                  {t("summary.totalTargetAmount")}
                </CardDescription>
                <CardTitle className="text-2xl">
                  {formatCurrency(summary.totalTargetAmount)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>
                  {t("summary.overallProgress")}
                </CardDescription>
                <CardTitle className="text-3xl text-green-600">
                  {Math.round(summary.overallProgress)}%
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {isLoading && <ListSkeleton items={4} />}

        {!isLoading && goals.length === 0 && (
          <EmptyGoals onAdd={handleCreate} />
        )}

        {activeGoals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">{t("sections.active")}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}

        {completedGoals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("sections.completed")}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {completedGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}

        {otherGoals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">{t("sections.other")}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {otherGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}

        <GoalFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          goal={editingGoal}
          mode={dialogMode}
        />
      </div>
    </div>
  );
}
