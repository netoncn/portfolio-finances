"use client";

import {
  AlertTriangle,
  ArrowUp,
  CheckCircle2,
  Info,
  Lightbulb,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Insight, InsightType } from "@/domain/insights/types/insight";

interface InsightCardProps {
  insight: Insight;
  onDismiss?: (id: string) => void;
}

export function InsightCard({ insight, onDismiss }: InsightCardProps) {
  const t = useTranslations("reviews.insightCard");
  const [dismissed, setDismissed] = useState(insight.dismissed);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.(insight.id);
  };

  if (dismissed) {
    return null;
  }

  const getIcon = (type: InsightType) => {
    switch (type) {
      case "spending_spike":
        return <TrendingUp className="h-5 w-5" />;
      case "spending_decrease":
        return <TrendingDown className="h-5 w-5" />;
      case "category_trend":
        return <ArrowUp className="h-5 w-5" />;
      case "budget_warning":
        return <AlertTriangle className="h-5 w-5" />;
      case "savings_opportunity":
        return <Lightbulb className="h-5 w-5" />;
      case "achievement":
        return <CheckCircle2 className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "success":
        return "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800";
      case "alert":
        return "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800";
      default:
        return "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800";
    }
  };

  const getIconColor = (severity: string) => {
    switch (severity) {
      case "success":
        return "text-green-600 dark:text-green-400";
      case "warning":
        return "text-yellow-600 dark:text-yellow-400";
      case "alert":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-blue-600 dark:text-blue-400";
    }
  };

  return (
    <Card className={`${getSeverityStyle(insight.severity)} border-2`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`${getIconColor(insight.severity)}`}>
              {getIcon(insight.type)}
            </div>
            <div>
              <h3 className="font-semibold">{insight.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {insight.description}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {insight.actionable && insight.actionText && (
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 pt-2 border-t">
            <Lightbulb className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium">{t("action")}</span>
            <span className="text-sm text-muted-foreground">
              {insight.actionText}
            </span>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
