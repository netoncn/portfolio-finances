"use client";

import { AlertTriangle, Bell, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Alert } from "@/domain/insights/types/insight";

interface AlertsCardProps {
  alerts: Alert[];
  onAcknowledge?: (id: string) => void;
}

export function AlertsCard({ alerts, onAcknowledge }: AlertsCardProps) {
  const t = useTranslations("insights.alerts");
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(
    new Set(alerts.filter((a) => a.acknowledged).map((a) => a.id)),
  );

  const handleAcknowledge = (id: string) => {
    setAcknowledgedIds((prev) => new Set([...prev, id]));
    onAcknowledge?.(id);
  };

  const unacknowledged = alerts.filter((a) => !acknowledgedIds.has(a.id));

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "alert":
        return "destructive";
      case "warning":
        return "default";
      default:
        return "secondary";
    }
  };

  if (unacknowledged.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t("count", { count: unacknowledged.length })}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {unacknowledged.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-card"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle
                    className={`h-4 w-4 ${alert.severity === "alert" ? "text-red-600" : "text-yellow-600"}`}
                  />
                  <h4 className="font-semibold text-sm">{alert.title}</h4>
                  <Badge variant={getSeverityColor(alert.severity)}>
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{alert.message}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAcknowledge(alert.id)}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
