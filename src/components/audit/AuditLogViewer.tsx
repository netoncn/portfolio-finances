"use client";

import { format } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";
import { Filter } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  AuditEventType,
  AuditResourceType,
} from "@/domain/audit/types/audit";
import {
  type AuditEventsFilters,
  useAuditEvents,
} from "@/hooks/use-audit-events";

interface AuditLogViewerProps {
  resourceType?: AuditResourceType;
  resourceId?: string;
}

export function AuditLogViewer({
  resourceType,
  resourceId,
}: AuditLogViewerProps) {
  const t = useTranslations("audit");
  const locale = useLocale();
  const dateLocale = locale === "pt-BR" ? ptBR : enUS;

  const [filters, setFilters] = useState<AuditEventsFilters>({
    resourceType,
    resourceId,
    limit: 50,
  });

  const { data: events = [], isLoading, error } = useAuditEvents(filters);

  const getEventBadgeVariant = (eventType: AuditEventType) => {
    if (eventType.includes("created") || eventType.includes("imported")) {
      return "default";
    }
    if (eventType.includes("updated") || eventType.includes("paid")) {
      return "secondary";
    }
    if (eventType.includes("deleted") || eventType.includes("canceled")) {
      return "destructive";
    }
    return "outline";
  };

  const getSourceBadge = (source?: string) => {
    const badges: Record<
      string,
      { label: string; variant: "default" | "secondary" | "outline" }
    > = {
      web: { label: t("sources.web"), variant: "default" },
      mobile: { label: t("sources.mobile"), variant: "secondary" },
      api: { label: t("sources.api"), variant: "secondary" },
      system: { label: t("sources.system"), variant: "outline" },
      import: { label: t("sources.import"), variant: "default" },
    };
    return badges[source || "web"];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {!resourceType && !resourceId && (
        <div className="rounded-md border bg-muted/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Label>{t("filters.title")}</Label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>{t("filters.resourceType")}</Label>
              <Select
                value={filters.resourceType || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    resourceType:
                      value === "all"
                        ? undefined
                        : (value as AuditResourceType),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
                  <SelectItem value="transaction">
                    {t("resourceTypes.transaction")}
                  </SelectItem>
                  <SelectItem value="account">
                    {t("resourceTypes.account")}
                  </SelectItem>
                  <SelectItem value="statement">
                    {t("resourceTypes.statement")}
                  </SelectItem>
                  <SelectItem value="category">
                    {t("resourceTypes.category")}
                  </SelectItem>
                  <SelectItem value="mapping_rule">
                    {t("resourceTypes.mapping_rule")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("filters.limit")}</Label>
              <Select
                value={filters.limit?.toString() || "50"}
                onValueChange={(value) =>
                  setFilters({ ...filters, limit: parseInt(value, 10) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({ limit: 50 })}
                className="w-full"
              >
                {t("filters.clear")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
          {t("error")}
        </div>
      )}

      {isLoading && (
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          {t("loading")}
        </div>
      )}

      {!isLoading && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.timestamp")}</TableHead>
                <TableHead>{t("table.event")}</TableHead>
                <TableHead>{t("table.resource")}</TableHead>
                <TableHead>{t("table.source")}</TableHead>
                <TableHead>{t("table.details")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    {t("empty")}
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {format(event.timestamp, "PPp", { locale: dateLocale })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getEventBadgeVariant(event.eventType)}>
                        {t(`eventTypes.${event.eventType}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {t(`resourceTypes.${event.resourceType}`)}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {event.resourceId.substring(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getSourceBadge(event.metadata?.source).variant}
                      >
                        {getSourceBadge(event.metadata?.source).label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md space-y-1 text-sm">
                        {event.metadata?.changedFields && (
                          <div className="text-muted-foreground">
                            {t("table.changedFields")}:{" "}
                            {event.metadata.changedFields.join(", ")}
                          </div>
                        )}
                        {event.metadata?.batchSize && (
                          <div className="text-muted-foreground">
                            {t("table.batchSize")}: {event.metadata.batchSize} (
                            {t("table.success")}: {event.metadata.successCount},
                            {t("table.errors")}: {event.metadata.errorCount},
                            {t("table.duplicates")}:{" "}
                            {event.metadata.duplicateCount})
                          </div>
                        )}
                        {event.metadata?.autoClassified && (
                          <Badge variant="outline" className="text-xs">
                            {t("table.autoClassified")} (
                            {Math.round((event.metadata.confidence || 0) * 100)}
                            %)
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && events.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t("summary", { count: events.length })}</span>
          <span className="text-xs">{t("retention")}</span>
        </div>
      )}
    </div>
  );
}
