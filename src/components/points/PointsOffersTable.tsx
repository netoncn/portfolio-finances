"use client";

import {
  Calendar,
  ExternalLink,
  Filter,
  Gift,
  Search,
  Sparkles,
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
  PointsOffer,
  PointsProgramName,
} from "@/domain/points/types/points";

interface PointsOffersTableProps {
  offers: PointsOffer[];
  isLoading?: boolean;
  onOfferClick?: (offer: PointsOffer) => void;
}

const PROGRAM_OPTIONS: PointsProgramName[] = [
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

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(timestamp));
}

function getDaysUntil(timestamp: number): number {
  const now = Date.now();
  const diff = timestamp - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getBonusColor(bonus: number): string {
  if (bonus >= 100)
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  if (bonus >= 50)
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  if (bonus >= 20)
    return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
  return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
}

function getExpirationBadge(daysUntil: number): {
  className: string;
  label: string;
} {
  if (daysUntil <= 3) {
    return {
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      label: daysUntil <= 0 ? "Expirado" : `${daysUntil}d`,
    };
  }
  if (daysUntil <= 7) {
    return {
      className:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      label: `${daysUntil}d`,
    };
  }
  if (daysUntil <= 30) {
    return {
      className:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      label: `${daysUntil}d`,
    };
  }
  return {
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    label: `${daysUntil}d`,
  };
}

export function PointsOffersTable({
  offers,
  isLoading,
  onOfferClick,
}: PointsOffersTableProps) {
  const t = useTranslations("points");
  const tCommon = useTranslations("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [programFilter, setProgramFilter] = useState<string>("all");

  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      const matchesSearch =
        searchQuery === "" ||
        offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getProgramDisplayName(offer.program)
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesProgram =
        programFilter === "all" || offer.program === programFilter;

      return matchesSearch && matchesProgram;
    });
  }, [offers, searchQuery, programFilter]);

  const sortedOffers = useMemo(() => {
    return [...filteredOffers].sort((a, b) => {
      if (b.bonus !== a.bonus) {
        return b.bonus - a.bonus;
      }
      return a.validUntil - b.validUntil;
    });
  }, [filteredOffers]);

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
        <CardTitle>{t("offers.title")}</CardTitle>
        <CardDescription>{t("offers.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("offers.filters.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={programFilter} onValueChange={setProgramFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="size-4 mr-2" />
              <SelectValue placeholder={t("offers.filters.program")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("offers.filters.allPrograms")}
              </SelectItem>
              {PROGRAM_OPTIONS.map((program) => (
                <SelectItem key={program} value={program}>
                  <div className="flex items-center gap-2">
                    <ProgramIcon program={program} className="size-4" />
                    {getProgramDisplayName(program)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {sortedOffers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Gift className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              {t("offers.table.noResults")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || programFilter !== "all"
                ? t("offers.table.adjustFilters")
                : t("offers.emptyState.description")}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("offers.table.program")}</TableHead>
                  <TableHead>{t("offers.table.offer")}</TableHead>
                  <TableHead className="text-center">
                    {t("offers.table.bonus")}
                  </TableHead>
                  <TableHead>{t("offers.table.validUntil")}</TableHead>
                  <TableHead>{t("offers.table.link")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOffers.map((offer) => {
                  const daysUntil = getDaysUntil(offer.validUntil);
                  const expirationBadge = getExpirationBadge(daysUntil);

                  return (
                    <TableRow
                      key={offer.id}
                      className="cursor-pointer"
                      onClick={() => onOfferClick?.(offer)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ProgramIcon program={offer.program} />
                          <span>{getProgramDisplayName(offer.program)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium truncate">{offer.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {offer.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className={getBonusColor(offer.bonus)}
                        >
                          <Sparkles className="size-3 mr-1" />
                          {offer.bonus}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatDate(offer.validUntil)}
                          </span>
                          <Badge
                            variant="secondary"
                            className={expirationBadge.className}
                          >
                            {expirationBadge.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {offer.termsUrl ? (
                          <a
                            href={offer.termsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="size-4" />
                          </a>
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

        {sortedOffers.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div>
              {t("offers.table.showing")} {sortedOffers.length}{" "}
              {t("offers.table.of")} {offers.length} {t("offers.table.offers")}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
