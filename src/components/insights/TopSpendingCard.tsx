"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { TopSpending } from "@/domain/insights/types/insight";
import { formatCurrency } from "@/lib/utils";

interface TopSpendingCardProps {
  topSpending: TopSpending[];
}

export function TopSpendingCard({ topSpending }: TopSpendingCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Spending Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topSpending.map((item) => (
            <div key={item.categoryId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{item.categoryIcon}</span>
                  <div>
                    <p className="font-medium">{item.categoryName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.transactionCount} transactions
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(item.amount)}</p>
                  <div className="flex items-center gap-1 text-xs">
                    {item.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 text-red-500" />
                    ) : item.trend === "down" ? (
                      <TrendingDown className="h-3 w-3 text-green-500" />
                    ) : null}
                    <span className="text-muted-foreground">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              <Progress value={item.percentage} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
