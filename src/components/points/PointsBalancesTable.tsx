"use client";

import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  Search,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
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
  PointsBalance,
  PointsProgram,
} from "@/domain/points/types/points";

interface PointsBalancesTableProps {
  balances: PointsBalance[];
  programs: PointsProgram[];
  isLoading?: boolean;
  onBalanceClick?: (balance: PointsBalance) => void;
}

const STATUS_CONFIG = {
  active: {
    icon: CheckCircle,
    className:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  redeemed: {
    icon: CheckCircle,
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  expired: {
    icon: XCircle,
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  },
};

const SOURCE_LABELS: Record<string, string> = {
  credit_card: "Cartão de Crédito",
  partner: "Parceiro",
  promo: "Promoção",
  transfer: "Transferência",
};

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(timestamp));
}

function formatPoints(points: number): string {
  return new Intl.NumberFormat("pt-BR").format(points);
}

function getDaysUntilExpiration(expiresAt: number): number {
  const now = Date.now();
  const diff = expiresAt - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getExpirationBadge(
  expiresAt: number,
  status: string,
): { label: string; className: string; icon: typeof Clock } | null {
  if (status !== "active") return null;

  const days = getDaysUntilExpiration(expiresAt);

  if (days < 0) {
    return {
      label: "Expirado",
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      icon: XCircle,
    };
  }

  if (days <= 30) {
    return {
      label: `${days}d`,
      className:
        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 animate-pulse",
      icon: AlertTriangle,
    };
  }

  if (days <= 60) {
    return {
      label: `${days}d`,
      className:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      icon: AlertTriangle,
    };
  }

  if (days <= 90) {
    return {
      label: `${days}d`,
      className:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      icon: Clock,
    };
  }

  return null;
}

export function PointsBalancesTable({
  balances,
  programs,
  isLoading,
  onBalanceClick,
}: PointsBalancesTableProps) {
  const t = useTranslations("points");
  const tCommon = useTranslations("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");

  const programsMap = useMemo(() => {
    const map = new Map<string, PointsProgram>();
    for (const program of programs) {
      map.set(program.id, program);
    }
    return map;
  }, [programs]);

  const filteredBalances = useMemo(() => {
    return balances.filter((balance) => {
      const program = programsMap.get(balance.programId);
      const programName = program ? getProgramDisplayName(program.program) : "";

      const matchesSearch =
        searchQuery === "" ||
        programName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        balance.promoTag?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesProgram =
        programFilter === "all" || balance.programId === programFilter;

      const matchesStatus =
        statusFilter === "all" || balance.status === statusFilter;

      return matchesSearch && matchesProgram && matchesStatus;
    });
  }, [balances, searchQuery, programFilter, statusFilter, programsMap]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">{tCommon("loading")}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("balances.title")}</CardTitle>
        <CardDescription>{t("balances.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("balances.filters.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Select value={programFilter} onValueChange={setProgramFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="size-4 mr-2" />
                <SelectValue placeholder={t("balances.filters.program")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("balances.filters.allPrograms")}
                </SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {getProgramDisplayName(program.program)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t("balances.filters.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("balances.filters.all")}</SelectItem>
                <SelectItem value="active">
                  {t("balances.filters.active")}
                </SelectItem>
                <SelectItem value="redeemed">
                  {t("balances.filters.redeemed")}
                </SelectItem>
                <SelectItem value="expired">
                  {t("balances.filters.expired")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredBalances.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              {t("balances.table.noResults")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || programFilter !== "all" || statusFilter !== "all"
                ? t("balances.table.adjustFilters")
                : t("balances.emptyState.description")}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("balances.table.program")}</TableHead>
                  <TableHead className="text-right">
                    {t("balances.table.points")}
                  </TableHead>
                  <TableHead>{t("balances.table.earnedAt")}</TableHead>
                  <TableHead>{t("balances.table.expiresAt")}</TableHead>
                  <TableHead>{t("balances.table.source")}</TableHead>
                  <TableHead>{t("balances.table.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBalances.map((balance) => {
                  const program = programsMap.get(balance.programId);
                  const statusConfig =
                    STATUS_CONFIG[balance.status as keyof typeof STATUS_CONFIG];
                  const StatusIcon = statusConfig?.icon || CheckCircle;
                  const expirationBadge = getExpirationBadge(
                    balance.expiresAt,
                    balance.status,
                  );

                  return (
                    <TableRow
                      key={balance.id}
                      className="cursor-pointer"
                      onClick={() => onBalanceClick?.(balance)}
                    >
                      <TableCell>
                        {program ? (
                          <div className="flex items-center gap-2">
                            <ProgramIcon program={program.program} />
                            <span>
                              {getProgramDisplayName(program.program)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatPoints(balance.points)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(balance.earnedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{formatDate(balance.expiresAt)}</span>
                          {expirationBadge && (
                            <Badge
                              variant="secondary"
                              className={expirationBadge.className}
                            >
                              <expirationBadge.icon className="size-3 mr-1" />
                              {expirationBadge.label}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {balance.source ? (
                          <Badge variant="outline" className="text-xs">
                            {SOURCE_LABELS[balance.source] || balance.source}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={statusConfig?.className}
                        >
                          <StatusIcon className="size-3 mr-1" />
                          {t(`balances.status.${balance.status}`)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredBalances.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div>
              {t("balances.table.showing")} {filteredBalances.length}{" "}
              {t("balances.table.of")} {balances.length}{" "}
              {t("balances.table.balances")}
            </div>
            <div className="font-semibold">
              {t("balances.table.totalPoints")}:{" "}
              {formatPoints(
                filteredBalances
                  .filter((b) => b.status === "active")
                  .reduce((sum, b) => sum + b.points, 0),
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
