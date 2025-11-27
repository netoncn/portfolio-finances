"use client";

import { PieChart } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPie,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CategoryChartData } from "@/domain/dashboard";
import { formatCurrency } from "@/lib/utils";

interface CategoryPieChartProps {
  data: CategoryChartData[];
  isLoading?: boolean;
}

export function CategoryPieChart({
  data,
  isLoading = false,
}: CategoryPieChartProps) {
  const t = useTranslations("dashboard.categoryChart");
  const tCommon = useTranslations("common");

  const renderLabel = (entry: CategoryChartData) => {
    return `${entry.percentage.toFixed(0)}%`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as CategoryChartData;
      return (
        <div className="bg-white dark:bg-gray-800 border border-border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            {data.categoryIcon && (
              <span className="text-lg">{data.categoryIcon}</span>
            )}
            <p className="font-semibold text-sm">{data.categoryName}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(data.amount)}
          </p>
          <p className="text-xs text-muted-foreground">
            {data.percentage.toFixed(1)}% {t("ofTotal")}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-none shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="size-5 text-primary" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {tCommon("loading")}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8">
            <PieChart className="size-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("noData.title")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("noData.description")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPie>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {data.map((entry) => (
                    <Cell key={`cell-${entry.categoryId}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(_value, entry: any) => {
                    const data = entry.payload as CategoryChartData;
                    return (
                      <span className="text-sm">
                        {data.categoryIcon} {data.categoryName}
                      </span>
                    );
                  }}
                />
              </RechartsPie>
            </ResponsiveContainer>

            <div className="pt-4 border-t">
              <p className="text-sm font-semibold mb-3">{t("topCategories")}</p>
              <div className="space-y-2">
                {data.slice(0, 5).map((category) => (
                  <div
                    key={category.categoryId}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.categoryIcon && (
                        <span className="text-sm">{category.categoryIcon}</span>
                      )}
                      <span className="text-sm truncate">
                        {category.categoryName}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-sm font-semibold">
                        {formatCurrency(category.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {category.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
