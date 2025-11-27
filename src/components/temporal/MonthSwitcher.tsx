"use client";

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Infinity as InfinityIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTemporal } from "@/contexts/temporal-context";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface MonthSwitcherProps {
  compact?: boolean;
  className?: string;
}

export function MonthSwitcher({
  compact = false,
  className,
}: MonthSwitcherProps) {
  const {
    period,
    nextMonth,
    previousMonth,
    goToToday,
    setViewAll,
    isCurrentMonth,
  } = useTemporal();
  const t = useTranslations("temporal");

  const formatPeriod = (): string => {
    if (period.type === "all") {
      return t("allTime");
    }

    const monthName = compact
      ? MONTH_NAMES_SHORT[period.month]
      : MONTH_NAMES[period.month];

    return `${monthName} ${period.year}`;
  };

  const isToday = isCurrentMonth();
  const isAllTime = period.type === "all";

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <Button
        variant="outline"
        size="icon"
        onClick={previousMonth}
        disabled={isAllTime}
        className="h-8 w-8"
        aria-label={t("previousMonth")}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-8 min-w-[140px] justify-center font-medium"
          >
            {isAllTime ? (
              <InfinityIcon className="mr-2 h-4 w-4" />
            ) : (
              <Calendar className="mr-2 h-4 w-4" />
            )}
            {formatPeriod()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuItem onClick={goToToday} disabled={isToday}>
            <Calendar className="mr-2 h-4 w-4" />
            {t("goToToday")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={setViewAll} disabled={isAllTime}>
            <InfinityIcon className="mr-2 h-4 w-4" />
            {t("viewAllTime")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="icon"
        onClick={nextMonth}
        disabled={isAllTime}
        className="h-8 w-8"
        aria-label={t("nextMonth")}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
