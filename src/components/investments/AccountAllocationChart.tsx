"use client";

import { Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AccountAllocationItem } from "@/hooks/use-portfolio-summary";
import { formatCurrency } from "@/lib/utils";

interface AccountAllocationChartProps {
  data: AccountAllocationItem[];
  isLoading?: boolean;
}

export function AccountAllocationChart({
  data,
  isLoading = false,
}: AccountAllocationChartProps) {
  const t = useTranslations("investments.dashboard");
  const tCommon = useTranslations("common");

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as AccountAllocationItem;
      return (
        <div className="bg-white dark:bg-gray-800 border border-border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <p className="font-semibold text-sm">{item.accountName}</p>
          </div>
          {item.broker && (
            <p className="text-xs text-muted-foreground mb-1">{item.broker}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {formatCurrency(item.value / 100)}
          </p>
          <p className="text-xs text-muted-foreground">
            {item.percentage.toFixed(1)}% do total
          </p>
        </div>
      );
    }
    return null;
  };

  const chartData = data.map((item) => ({
    ...item,
    shortName:
      item.accountName.length > 15
        ? `${item.accountName.substring(0, 12)}...`
        : item.accountName,
  }));

  return (
    <Card className="border-none shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-5 text-primary" />
          {t("accountAllocation.title")}
        </CardTitle>
        <CardDescription>{t("accountAllocation.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {tCommon("loading")}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="size-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t("accountAllocation.noData.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("accountAllocation.noData.description")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  tickFormatter={(value) => formatCurrency(value / 100)}
                  fontSize={12}
                />
                <YAxis
                  type="category"
                  dataKey="shortName"
                  width={100}
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={`cell-${entry.accountId}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="pt-4 border-t">
              <div className="space-y-2">
                {data.map((item) => (
                  <div
                    key={item.accountId}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="min-w-0">
                        <span className="text-sm truncate block">
                          {item.accountName}
                        </span>
                        {item.broker && (
                          <span className="text-xs text-muted-foreground truncate block">
                            {item.broker}
                          </span>
                        )}
                      </div>
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
