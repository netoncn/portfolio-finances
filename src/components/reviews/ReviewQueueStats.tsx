"use client";

import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReviewQueueStatsProps {
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    skipped: number;
    byPriority: {
      high: number;
      medium: number;
      low: number;
    };
    averageConfidence: number;
  };
}

export function ReviewQueueStats({ stats }: ReviewQueueStatsProps) {
  const t = useTranslations("reviews.stats");

  const statCards = [
    {
      key: "pending",
      title: t("pending"),
      value: stats.pending,
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      key: "highPriority",
      title: t("highPriority"),
      value: stats.byPriority.high,
      icon: AlertTriangle,
      color: "text-red-600",
    },
    {
      key: "approved",
      title: t("approved"),
      value: stats.approved,
      icon: CheckCircle2,
      color: "text-green-600",
    },
    {
      key: "rejected",
      title: t("rejected"),
      value: stats.rejected,
      icon: XCircle,
      color: "text-gray-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.key === "pending" && stats.total > 0 && (
                <p className="text-xs text-muted-foreground">
                  {((stats.pending / stats.total) * 100).toFixed(0)}%{" "}
                  {t("ofTotal")}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
