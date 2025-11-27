"use client";

import { CreditCard, Search, Trash2 } from "lucide-react";
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
import type { Account } from "@/domain/accounts/types/account";
import type {
  PointsProgram,
  PointsProgramName,
} from "@/domain/points/types/points";

interface PointsProgramsTableProps {
  programs: PointsProgram[];
  accounts?: Account[];
  isLoading?: boolean;
  onProgramClick?: (program: PointsProgram) => void;
}

const PROGRAM_NAME_KEYS: PointsProgramName[] = [
  "livelo",
  "esfera",
  "iupp",
  "smiles",
  "latam_pass",
  "tudoazul",
  "ame",
  "meli",
  "outro",
];

const PROGRAM_BADGE_COLORS: Record<PointsProgramName, string> = {
  livelo:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  esfera: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  iupp: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  smiles: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  latam_pass: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  tudoazul: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  ame: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  meli: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  outro: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export function PointsProgramsTable({
  programs,
  accounts = [],
  isLoading,
  onProgramClick,
}: PointsProgramsTableProps) {
  const t = useTranslations("points");
  const tCommon = useTranslations("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [programFilter, setProgramFilter] = useState<string>("all");

  const accountsMap = useMemo(() => {
    const map = new Map<string, Account>();
    for (const account of accounts) {
      map.set(account.id, account);
    }
    return map;
  }, [accounts]);

  const filteredPrograms = useMemo(() => {
    return programs.filter((program) => {
      const programName = getProgramDisplayName(program.program);
      const matchesSearch =
        searchQuery === "" ||
        programName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        program.memberId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        program.notes?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesProgram =
        programFilter === "all" || program.program === programFilter;

      return matchesSearch && matchesProgram;
    });
  }, [programs, searchQuery, programFilter]);

  const getLinkedAccountNames = (linkedAccountIds?: string[]): string[] => {
    if (!linkedAccountIds || linkedAccountIds.length === 0) return [];
    return linkedAccountIds
      .map((id) => accountsMap.get(id)?.name)
      .filter(Boolean) as string[];
  };

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
        <CardTitle>{t("programs.title")}</CardTitle>
        <CardDescription>{t("programs.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("programs.filters.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={programFilter} onValueChange={setProgramFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("programs.filters.program")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("programs.filters.allPrograms")}
              </SelectItem>
              {PROGRAM_NAME_KEYS.map((program) => (
                <SelectItem key={program} value={program}>
                  {getProgramDisplayName(program)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredPrograms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Trash2 className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              {t("programs.table.noResults")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || programFilter !== "all"
                ? t("programs.table.adjustFilters")
                : t("programs.emptyState.description")}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("programs.table.program")}</TableHead>
                  <TableHead>{t("programs.table.memberId")}</TableHead>
                  <TableHead>{t("programs.table.linkedAccounts")}</TableHead>
                  <TableHead>{t("programs.table.notes")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrograms.map((program) => {
                  const linkedNames = getLinkedAccountNames(
                    program.linkedAccounts,
                  );
                  return (
                    <TableRow
                      key={program.id}
                      className="cursor-pointer"
                      onClick={() => onProgramClick?.(program)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ProgramIcon program={program.program} />
                          <Badge
                            variant="secondary"
                            className={PROGRAM_BADGE_COLORS[program.program]}
                          >
                            {getProgramDisplayName(program.program)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {program.memberId ? (
                          <span className="font-mono text-sm">
                            {program.memberId}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {linkedNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {linkedNames.map((name, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-xs"
                              >
                                <CreditCard className="size-3 mr-1" />
                                {name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {program.notes ? (
                          <span className="text-sm text-muted-foreground line-clamp-1">
                            {program.notes}
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

        {filteredPrograms.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div>
              {t("programs.table.showing")} {filteredPrograms.length}{" "}
              {t("programs.table.of")} {programs.length}{" "}
              {t("programs.table.programs")}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
