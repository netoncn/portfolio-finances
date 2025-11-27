"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  History,
  RefreshCw,
  Search,
  Settings2,
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
  PointsOperation,
  PointsProgram,
} from "@/domain/points/types/points";

interface PointsOperationsTableProps {
  operations: PointsOperation[];
  programs: PointsProgram[];
  isLoading?: boolean;
  onOperationClick?: (operation: PointsOperation) => void;
}

type OperationType = PointsOperation["type"];

const OPERATION_TYPE_CONFIG: Record<
  OperationType,
  { icon: typeof ArrowUpRight; className: string; bgClass: string }
> = {
  earn: {
    icon: ArrowDownLeft,
    className: "text-green-600 dark:text-green-400",
    bgClass:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  redeem: {
    icon: ArrowUpRight,
    className: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  transfer_in: {
    icon: ArrowDownLeft,
    className: "text-purple-600 dark:text-purple-400",
    bgClass:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  transfer_out: {
    icon: ArrowUpRight,
    className: "text-orange-600 dark:text-orange-400",
    bgClass:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  },
  adjust: {
    icon: Settings2,
    className: "text-gray-600 dark:text-gray-400",
    bgClass: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  },
};

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(timestamp));
}

function formatPoints(points: number): string {
  const sign = points >= 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat("pt-BR").format(points)}`;
}

export function PointsOperationsTable({
  operations,
  programs,
  isLoading,
  onOperationClick,
}: PointsOperationsTableProps) {
  const t = useTranslations("points");
  const tCommon = useTranslations("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const programsMap = useMemo(() => {
    const map = new Map<string, PointsProgram>();
    for (const program of programs) {
      map.set(program.id, program);
    }
    return map;
  }, [programs]);

  const filteredOperations = useMemo(() => {
    return operations.filter((operation) => {
      const program = programsMap.get(operation.programId);
      const programName = program ? getProgramDisplayName(program.program) : "";

      const matchesSearch =
        searchQuery === "" ||
        programName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        operation.partnerOrAirline
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        operation.notes?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesProgram =
        programFilter === "all" || operation.programId === programFilter;

      const matchesType = typeFilter === "all" || operation.type === typeFilter;

      return matchesSearch && matchesProgram && matchesType;
    });
  }, [operations, searchQuery, programFilter, typeFilter, programsMap]);

  const totals = useMemo(() => {
    const earned = filteredOperations
      .filter((op) => op.type === "earn" || op.type === "transfer_in")
      .reduce((sum, op) => sum + op.pointsDelta, 0);

    const spent = filteredOperations
      .filter((op) => op.type === "redeem" || op.type === "transfer_out")
      .reduce((sum, op) => sum + Math.abs(op.pointsDelta), 0);

    return { earned, spent, net: earned - spent };
  }, [filteredOperations]);

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
        <CardTitle>{t("operations.title")}</CardTitle>
        <CardDescription>{t("operations.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("operations.filters.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Select value={programFilter} onValueChange={setProgramFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="size-4 mr-2" />
                <SelectValue placeholder={t("operations.filters.program")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("operations.filters.allPrograms")}
                </SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {getProgramDisplayName(program.program)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t("operations.filters.type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("operations.filters.allTypes")}
                </SelectItem>
                <SelectItem value="earn">
                  {t("operations.types.earn")}
                </SelectItem>
                <SelectItem value="redeem">
                  {t("operations.types.redeem")}
                </SelectItem>
                <SelectItem value="transfer_in">
                  {t("operations.types.transfer_in")}
                </SelectItem>
                <SelectItem value="transfer_out">
                  {t("operations.types.transfer_out")}
                </SelectItem>
                <SelectItem value="adjust">
                  {t("operations.types.adjust")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900">
            <p className="text-sm text-green-700 dark:text-green-300 mb-1">
              {t("operations.summary.earned")}
            </p>
            <p className="text-xl font-bold text-green-800 dark:text-green-200">
              +{totals.earned.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900">
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">
              {t("operations.summary.spent")}
            </p>
            <p className="text-xl font-bold text-blue-800 dark:text-blue-200">
              -{totals.spent.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
              {t("operations.summary.net")}
            </p>
            <p
              className={`text-xl font-bold ${totals.net >= 0 ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}`}
            >
              {totals.net >= 0 ? "+" : ""}
              {totals.net.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        {filteredOperations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <History className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              {t("operations.table.noResults")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || programFilter !== "all" || typeFilter !== "all"
                ? t("operations.table.adjustFilters")
                : t("operations.emptyState.description")}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("operations.table.date")}</TableHead>
                  <TableHead>{t("operations.table.program")}</TableHead>
                  <TableHead>{t("operations.table.type")}</TableHead>
                  <TableHead className="text-right">
                    {t("operations.table.points")}
                  </TableHead>
                  <TableHead>{t("operations.table.partner")}</TableHead>
                  <TableHead>{t("operations.table.notes")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOperations.map((operation) => {
                  const program = programsMap.get(operation.programId);
                  const typeConfig = OPERATION_TYPE_CONFIG[operation.type];
                  const TypeIcon = typeConfig?.icon || RefreshCw;
                  const isPositive =
                    operation.type === "earn" ||
                    operation.type === "transfer_in" ||
                    (operation.type === "adjust" && operation.pointsDelta > 0);

                  return (
                    <TableRow
                      key={operation.id}
                      className="cursor-pointer"
                      onClick={() => onOperationClick?.(operation)}
                    >
                      <TableCell className="text-muted-foreground">
                        {formatDate(operation.date)}
                      </TableCell>
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
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={typeConfig?.bgClass}
                        >
                          <TypeIcon className="size-3 mr-1" />
                          {t(`operations.types.${operation.type}`)}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold tabular-nums ${
                          isPositive
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {formatPoints(operation.pointsDelta)}
                      </TableCell>
                      <TableCell>
                        {operation.partnerOrAirline ? (
                          <span className="text-sm">
                            {operation.partnerOrAirline}
                            {operation.rateOrBonus && (
                              <span className="text-muted-foreground ml-1">
                                ({operation.rateOrBonus}x)
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {operation.notes ? (
                          <span className="text-sm text-muted-foreground line-clamp-1">
                            {operation.notes}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredOperations.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div>
              {t("operations.table.showing")} {filteredOperations.length}{" "}
              {t("operations.table.of")} {operations.length}{" "}
              {t("operations.table.operations")}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
