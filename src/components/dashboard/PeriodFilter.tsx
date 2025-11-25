"use client";

import { Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type PeriodType =
  | "current_month"
  | "last_30_days"
  | "last_90_days"
  | "current_year";

interface PeriodFilterProps {
  value: PeriodType;
  onChange: (value: PeriodType) => void;
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  const t = useTranslations("dashboard.period");

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="current_month">{t("currentMonth")}</SelectItem>
          <SelectItem value="last_30_days">{t("last30Days")}</SelectItem>
          <SelectItem value="last_90_days">{t("last90Days")}</SelectItem>
          <SelectItem value="current_year">{t("currentYear")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
