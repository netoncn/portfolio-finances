"use client";

import { format } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";
import { History } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { AuditResourceType } from "@/domain/audit/types/audit";
import { useResourceAuditHistory } from "@/hooks/use-audit-events";

interface ResourceAuditHistoryProps {
  resourceType: AuditResourceType;
  resourceId: string;
  enabled?: boolean;
}

export function ResourceAuditHistory({
  resourceType,
  resourceId,
  enabled = true,
}: ResourceAuditHistoryProps) {
  const t = useTranslations("audit");
  const locale = useLocale();
  const dateLocale = locale === "pt-BR" ? ptBR : enUS;

  const { data: events = [], isLoading } = useResourceAuditHistory(
    resourceType,
    resourceId,
    enabled,
  );

  if (!enabled) return null;

  if (isLoading) {
    return (
      <div className="rounded-md border p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <History className="h-4 w-4" />
          {t("loading")}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-md border p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <History className="h-4 w-4" />
          {t("emptyHistory")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <History className="h-4 w-4" />
        {t("historyTitle")}
      </div>

      <div className="space-y-2">
        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-md border bg-muted/50 p-3 text-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {t(`eventTypes.${event.eventType}`)}
                  </Badge>
                  {event.metadata?.source && (
                    <Badge variant="secondary" className="text-xs">
                      {t(`sources.${event.metadata.source}`)}
                    </Badge>
                  )}
                </div>

                {event.metadata?.changedFields &&
                  event.metadata.changedFields.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {t("table.changedFields")}:{" "}
                      {event.metadata.changedFields.join(", ")}
                    </div>
                  )}

                {event.metadata?.batchSize && (
                  <div className="text-xs text-muted-foreground">
                    {t("table.imported")}: {event.metadata.successCount}/
                    {event.metadata.batchSize}
                  </div>
                )}
              </div>

              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {format(event.timestamp, "PPp", { locale: dateLocale })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length >= 10 && (
        <div className="text-center">
          <Badge variant="outline" className="text-xs">
            {t("showingRecent", { count: events.length })}
          </Badge>
        </div>
      )}
    </div>
  );
}
