"use client";

import { Pencil, Search, Tag, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  Category,
  CategoryType,
} from "@/domain/categories/types/category";
import { formatCurrency } from "@/lib/utils";

interface CategoriesTableProps {
  categories: Category[];
  isLoading?: boolean;
  onCategoryClick?: (category: Category) => void;
  onDeleteClick?: (category: Category) => void;
}

const CATEGORY_TYPE_BADGE_COLORS: Record<CategoryType, string> = {
  expense: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  income: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  transfer: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

export function CategoriesTable({
  categories,
  isLoading,
  onCategoryClick,
  onDeleteClick,
}: CategoriesTableProps) {
  const t = useTranslations("categories");
  const tCommon = useTranslations("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const matchesSearch =
        searchQuery === "" ||
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.keywords?.some((keyword) =>
          keyword.toLowerCase().includes(searchQuery.toLowerCase()),
        );

      const matchesType = typeFilter === "all" || category.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [categories, searchQuery, typeFilter]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">{tCommon("loading")}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("filters.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("filters.type")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
              <SelectItem value="expense">{t("types.expense")}</SelectItem>
              <SelectItem value="income">{t("types.income")}</SelectItem>
              <SelectItem value="transfer">{t("types.transfer")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Tag className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              {t("table.noResults")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || typeFilter !== "all"
                ? t("table.adjustFilters")
                : t("emptyState.description")}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.name")}</TableHead>
                  <TableHead>{t("table.type")}</TableHead>
                  <TableHead>{t("table.keywords")}</TableHead>
                  <TableHead className="text-right">
                    {t("table.budgetLimit")}
                  </TableHead>
                  <TableHead className="text-center">
                    {t("table.isSystem")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("table.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {category.icon && (
                          <span className="text-lg">{category.icon}</span>
                        )}
                        <span className="truncate">{category.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={CATEGORY_TYPE_BADGE_COLORS[category.type]}
                      >
                        {t(`types.${category.type}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {category.keywords
                          ?.slice(0, 3)
                          .map((keyword, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {keyword}
                            </Badge>
                          ))}
                        {category.keywords && category.keywords.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{category.keywords.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {category.budgetLimit
                        ? formatCurrency(category.budgetLimit)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {category.isSystem ? (
                        <Badge variant="secondary" className="text-xs">
                          {t("table.system")}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCategoryClick?.(category);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        {!category.isSystem && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteClick?.(category);
                            }}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredCategories.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div>
              {t("table.showing")} {filteredCategories.length} {t("table.of")}{" "}
              {categories.length} {t("table.categories")}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
