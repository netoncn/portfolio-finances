"use client";

import { TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLine,
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
import type { TrendDataPoint } from "@/domain/dashboard";
import { useChartColors } from "@/hooks/use-chart-colors";
import { formatCurrency } from "@/lib/utils";

interface TrendLineChartProps {
  data: TrendDataPoint[];
  isLoading?: boolean;
}

export function TrendLineChart({
  data,
  isLoading = false,
}: TrendLineChartProps) {
  const t = useTranslations("dashboard.trendChart");
  const tCommon = useTranslations("common");
  const chartColors = useChartColors();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="capitalize">{entry.name}:</span>
              <span className="font-semibold">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return `R$ ${(value / 100).toFixed(0)}`;
  };

  return (
    <Card className="border-none shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-5 text-primary" />
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
            <TrendingUp className="size-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("noData.title")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("noData.description")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLine data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  className="text-xs"
                  tick={{ fill: "currentColor" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "currentColor" }}
                  tickFormatter={formatYAxis}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => {
                    const labels: Record<string, string> = {
                      income: t("income"),
                      expense: t("expense"),
                      balance: t("balance"),
                    };
                    return labels[value] || value;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke={chartColors.income}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke={chartColors.expense}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke={chartColors.balance}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </RechartsLine>
            </ResponsiveContainer>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              {data.length > 0 && (
                <>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("avgIncome")}
                    </p>
                    <p className="text-sm font-bold text-finance-gain">
                      {formatCurrency(
                        data.reduce((sum, d) => sum + d.income, 0) /
                          data.length,
                      )}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("avgExpense")}
                    </p>
                    <p className="text-sm font-bold text-finance-loss">
                      {formatCurrency(
                        data.reduce((sum, d) => sum + d.expense, 0) /
                          data.length,
                      )}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("avgBalance")}
                    </p>
                    <p className="text-sm font-bold text-primary">
                      {formatCurrency(
                        data.reduce((sum, d) => sum + d.balance, 0) /
                          data.length,
                      )}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
