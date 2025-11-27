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
import type { AssetAllocationItem } from "@/hooks/use-portfolio-summary";
import { formatCurrency } from "@/lib/utils";

interface AssetAllocationChartProps {
  data: AssetAllocationItem[];
  isLoading?: boolean;
}

export function AssetAllocationChart({
  data,
  isLoading = false,
}: AssetAllocationChartProps) {
  const t = useTranslations("investments.dashboard");
  const tCommon = useTranslations("common");

  const renderLabel = (entry: AssetAllocationItem) => {
    if (entry.percentage < 5) return "";
    return `${entry.percentage.toFixed(0)}%`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as AssetAllocationItem;
      return (
        <div className="bg-white dark:bg-gray-800 border border-border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <p className="font-semibold text-sm">{item.assetTypeName}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(item.value / 100)}
          </p>
          <p className="text-xs text-muted-foreground">
            {item.percentage.toFixed(1)}% do total
          </p>
          <p className="text-xs text-muted-foreground">
            {item.positions} {item.positions === 1 ? "posição" : "posições"}
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
          {t("assetAllocation.title")}
        </CardTitle>
        <CardDescription>{t("assetAllocation.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {tCommon("loading")}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8">
            <PieChart className="size-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t("assetAllocation.noData.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("assetAllocation.noData.description")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={280}>
              <RechartsPie>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderLabel}
                  outerRadius={100}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {data.map((entry) => (
                    <Cell key={`cell-${entry.assetType}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(_value, entry: any) => {
                    const item = entry.payload as AssetAllocationItem;
                    return (
                      <span className="text-sm text-foreground">
                        {item.assetTypeName}
                      </span>
                    );
                  }}
                />
              </RechartsPie>
            </ResponsiveContainer>

            <div className="pt-4 border-t">
              <p className="text-sm font-semibold mb-3">
                {t("assetAllocation.topAssets")}
              </p>
              <div className="space-y-2">
                {data.slice(0, 5).map((item) => (
                  <div
                    key={item.assetType}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm truncate">
                        {item.assetTypeName}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-sm font-semibold">
                        {formatCurrency(item.value / 100)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.percentage.toFixed(1)}%
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
