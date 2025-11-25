"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Category } from "@/domain/categories/types/category";

interface CategoryManagerProps {
  categories: Category[];
  onCreateCategory: (
    category: Omit<Category, "id" | "userId" | "createdAt" | "updatedAt">,
  ) => void;
  onUpdateCategory: (id: string, category: Partial<Category>) => void;
  onDeleteCategory: (id: string) => void;
}

export function CategoryManager({
  categories,
  onDeleteCategory,
}: CategoryManagerProps) {
  const t = useTranslations("categories");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [formOpen, setFormOpen] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");
  const transferCategories = categories.filter((c) => c.type === "transfer");

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t("confirmDelete"))) {
      onDeleteCategory(id);
    }
  };

  const renderCategoryRow = (category: Category) => (
    <TableRow key={category.id}>
      <TableCell>
        <div className="flex items-center gap-2">
          {category.icon && <span className="text-xl">{category.icon}</span>}
          <span className="font-medium">{category.name}</span>
        </div>
      </TableCell>
      <TableCell>
        {category.color && (
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full border"
              style={{ backgroundColor: category.color }}
            />
            <span className="text-sm text-muted-foreground">
              {category.color}
            </span>
          </div>
        )}
      </TableCell>
      <TableCell>
        {category.keywords && category.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {category.keywords.slice(0, 3).map((keyword) => (
              <Badge key={keyword} variant="secondary" className="text-xs">
                {keyword}
              </Badge>
            ))}
            {category.keywords.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{category.keywords.length - 3}
              </Badge>
            )}
          </div>
        )}
      </TableCell>
      <TableCell>
        {category.isSystem && (
          <Badge variant="outline" className="text-xs">
            {t("system")}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(category)}
            disabled={category.isSystem}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(category.id)}
            disabled={category.isSystem}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button
          onClick={() => {
            setSelectedCategory(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("actions.new")}
        </Button>
      </div>

      <div>
        <h3 className="mb-2 text-lg font-semibold">{t("types.expense")}</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.name")}</TableHead>
                <TableHead>{t("fields.color")}</TableHead>
                <TableHead>{t("fields.keywords")}</TableHead>
                <TableHead>{t("fields.system")}</TableHead>
                <TableHead className="text-right">
                  {t("fields.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenseCategories.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    {t("empty")}
                  </TableCell>
                </TableRow>
              ) : (
                expenseCategories.map(renderCategoryRow)
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-lg font-semibold">{t("types.income")}</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.name")}</TableHead>
                <TableHead>{t("fields.color")}</TableHead>
                <TableHead>{t("fields.keywords")}</TableHead>
                <TableHead>{t("fields.system")}</TableHead>
                <TableHead className="text-right">
                  {t("fields.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomeCategories.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    {t("empty")}
                  </TableCell>
                </TableRow>
              ) : (
                incomeCategories.map(renderCategoryRow)
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-lg font-semibold">{t("types.transfer")}</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.name")}</TableHead>
                <TableHead>{t("fields.color")}</TableHead>
                <TableHead>{t("fields.keywords")}</TableHead>
                <TableHead>{t("fields.system")}</TableHead>
                <TableHead className="text-right">
                  {t("fields.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transferCategories.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    {t("empty")}
                  </TableCell>
                </TableRow>
              ) : (
                transferCategories.map(renderCategoryRow)
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? t("actions.edit") : t("actions.new")}
            </DialogTitle>
          </DialogHeader>
          <div className="text-muted-foreground">Form placeholder</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
