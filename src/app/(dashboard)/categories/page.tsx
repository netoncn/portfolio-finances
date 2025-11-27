"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { CategoriesTable } from "@/components/categories/CategoriesTable";
import { CategoryFormDialog } from "@/components/categories/CategoryFormDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Category } from "@/domain/categories/types/category";
import { useCategories, useDeleteCategory } from "@/hooks/use-categories";

export default function CategoriesPage() {
  const t = useTranslations("categories");
  const tCommon = useTranslations("common");
  const { data: categories = [], isLoading, error } = useCategories();
  const deleteMutation = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    Category | undefined
  >();
  const [categoryToDelete, setCategoryToDelete] = useState<
    Category | undefined
  >();
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");

  const handleCreateCategory = () => {
    setSelectedCategory(undefined);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteMutation.mutateAsync(categoryToDelete.id);
      toast.success(t("form.messages.deleteSuccess"));
      setDeleteDialogOpen(false);
      setCategoryToDelete(undefined);
    } catch (error) {
      const errorMessage =
        error instanceof Error &&
        error.message === "Cannot delete system categories"
          ? t("form.messages.systemCategoryError")
          : t("form.messages.deleteError");
      toast.error(errorMessage);
    }
  };

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");
  const transferCategories = categories.filter((c) => c.type === "transfer");

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-destructive mb-2">
              {tCommon("error")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : tCommon("error")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t("title")}
            </h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>
          <Button size="lg" onClick={handleCreateCategory}>
            <Plus className="size-4" />
            {t("actions.new")}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-border rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t("stats.total")}
                </p>
                <p className="text-3xl font-bold text-primary">
                  {categories.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t("stats.expense")}
                </p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {expenseCategories.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t("stats.income")}
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {incomeCategories.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t("stats.transfer")}
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {transferCategories.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <CategoriesTable
          categories={categories}
          isLoading={isLoading}
          onCategoryClick={handleCategoryClick}
          onDeleteClick={handleDeleteClick}
        />

        <CategoryFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          category={selectedCategory}
          mode={dialogMode}
        />

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("deleteDialog.title")}</DialogTitle>
              <DialogDescription>
                {t("deleteDialog.description")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                {t("deleteDialog.cancel")}
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                {t("deleteDialog.confirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
