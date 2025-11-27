"use client";

import { AlertTriangle, Calendar, ChevronRight, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  getProgramDisplayName,
  ProgramIcon,
} from "@/components/points/ProgramIcon";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  PointsBalance,
  PointsProgram,
} from "@/domain/points/types/points";
import { cn } from "@/lib/utils";

interface ExpirationAlertsProps {
  balances: PointsBalance[];
  programs: PointsProgram[];
  onBalanceClick?: (balance: PointsBalance) => void;
  compact?: boolean;
}

interface ExpirationGroup {
  label: string;
  days: number;
  balances: PointsBalance[];
  totalPoints: number;
  className: string;
  iconClassName: string;
}

function getDaysUntilExpiration(expiresAt: number): number {
  const now = Date.now();
  const diff = expiresAt - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatPoints(points: number): string {
  return new Intl.NumberFormat("pt-BR").format(points);
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(timestamp));
}

export function ExpirationAlerts({
  balances,
  programs,
  onBalanceClick,
  compact = false,
}: ExpirationAlertsProps) {
  const t = useTranslations("points");

  const programsMap = useMemo(() => {
    const map = new Map<string, PointsProgram>();
    for (const program of programs) {
      map.set(program.id, program);
    }
    return map;
  }, [programs]);

  const expirationGroups = useMemo(() => {
    const activeBalances = balances.filter((b) => b.status === "active");
    const _now = Date.now();

    const groups: ExpirationGroup[] = [
      {
        label: t("expiration.urgent"),
        days: 30,
        balances: [],
        totalPoints: 0,
        className:
          "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950",
        iconClassName: "text-red-600 dark:text-red-400",
      },
      {
        label: t("expiration.warning"),
        days: 60,
        balances: [],
        totalPoints: 0,
        className:
          "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950",
        iconClassName: "text-orange-600 dark:text-orange-400",
      },
      {
        label: t("expiration.upcoming"),
        days: 90,
        balances: [],
        totalPoints: 0,
        className:
          "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950",
        iconClassName: "text-yellow-600 dark:text-yellow-400",
      },
    ];

    for (const balance of activeBalances) {
      const days = getDaysUntilExpiration(balance.expiresAt);

      if (days <= 0) continue; // Already expired

      if (days <= 30) {
        groups[0].balances.push(balance);
        groups[0].totalPoints += balance.points;
      } else if (days <= 60) {
        groups[1].balances.push(balance);
        groups[1].totalPoints += balance.points;
      } else if (days <= 90) {
        groups[2].balances.push(balance);
        groups[2].totalPoints += balance.points;
      }
    }

    return groups.filter((g) => g.balances.length > 0);
  }, [balances, t]);

  const totalExpiringPoints = useMemo(() => {
    return expirationGroups.reduce((sum, g) => sum + g.totalPoints, 0);
  }, [expirationGroups]);

  if (expirationGroups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            {t("expiration.title")}
          </CardTitle>
          <CardDescription>{t("expiration.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 mb-4">
              <Clock className="size-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-1">
              {t("expiration.noAlerts.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("expiration.noAlerts.description")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900">
              <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-800 dark:text-amber-200">
                {formatPoints(totalExpiringPoints)}{" "}
                {t("expiration.pointsExpiring")}
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {expirationGroups[0]?.balances.length || 0}{" "}
                {t("expiration.balancesIn90Days")}
              </p>
            </div>
            <ChevronRight className="size-5 text-amber-600 dark:text-amber-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-600" />
              {t("expiration.title")}
            </CardTitle>
            <CardDescription>{t("expiration.description")}</CardDescription>
          </div>
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {formatPoints(totalExpiringPoints)} pts
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {expirationGroups.map((group) => (
          <div
            key={group.days}
            className={cn("rounded-lg border p-4", group.className)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className={cn("size-5", group.iconClassName)} />
                <span className="font-semibold">{group.label}</span>
                <Badge variant="secondary">
                  {group.balances.length}{" "}
                  {group.balances.length === 1
                    ? t("expiration.balance")
                    : t("expiration.balances")}
                </Badge>
              </div>
              <span className="font-bold">
                {formatPoints(group.totalPoints)} pts
              </span>
            </div>

            <div className="space-y-2">
              {group.balances.slice(0, 3).map((balance) => {
                const program = programsMap.get(balance.programId);
                const days = getDaysUntilExpiration(balance.expiresAt);

                return (
                  <button
                    key={balance.id}
                    type="button"
                    className="w-full flex items-center justify-between p-2 rounded-md bg-background/50 hover:bg-background/80 transition-colors"
                    onClick={() => onBalanceClick?.(balance)}
                  >
                    <div className="flex items-center gap-2">
                      {program && (
                        <ProgramIcon
                          program={program.program}
                          className="size-4"
                        />
                      )}
                      <span className="text-sm font-medium">
                        {program
                          ? getProgramDisplayName(program.program)
                          : "Programa"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-semibold">
                        {formatPoints(balance.points)}
                      </span>
                      <span className="text-muted-foreground">
                        {days}d • {formatDate(balance.expiresAt)}
                      </span>
                    </div>
                  </button>
                );
              })}

              {group.balances.length > 3 && (
                <p className="text-sm text-center text-muted-foreground pt-1">
                  +{group.balances.length - 3} {t("expiration.more")}
                </p>
              )}
            </div>
          </div>
        ))}

        <div className="pt-2 text-center">
          <p className="text-sm text-muted-foreground">
            {t("expiration.totalExpiring")}{" "}
            <span className="font-semibold text-foreground">
              {formatPoints(totalExpiringPoints)}
            </span>{" "}
            {t("expiration.pointsIn90Days")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
