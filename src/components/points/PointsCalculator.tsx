"use client";

import {
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
  HelpCircle,
  Sparkles,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  getProgramDisplayName,
  ProgramIcon,
} from "@/components/points/ProgramIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  calculatePointsVsCash,
  getProgramValuation,
  type PointsVsCashRecommendation,
  PROGRAM_VALUATIONS,
} from "@/domain/points/config/points-valuation.config";
import type { PointsProgramName } from "@/domain/points/types/points";
import { cn } from "@/lib/utils";

interface PointsCalculatorProps {
  defaultProgram?: PointsProgramName;
  className?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatPercentage(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function PointsCalculator({
  defaultProgram = "livelo",
  className,
}: PointsCalculatorProps) {
  const t = useTranslations("points");

  const [program, setProgram] = useState<PointsProgramName>(defaultProgram);
  const [points, setPoints] = useState<string>("");
  const [cashPrice, setCashPrice] = useState<string>("");
  const [showDetails, setShowDetails] = useState(false);

  const recommendation = useMemo<PointsVsCashRecommendation | null>(() => {
    const pointsNum = Number.parseInt(points.replace(/\D/g, ""), 10);
    const cashNum = Number.parseFloat(
      cashPrice.replace(/[^\d,]/g, "").replace(",", "."),
    );

    if (
      Number.isNaN(pointsNum) ||
      Number.isNaN(cashNum) ||
      pointsNum <= 0 ||
      cashNum <= 0
    ) {
      return null;
    }

    return calculatePointsVsCash(program, pointsNum, cashNum);
  }, [program, points, cashPrice]);

  const programValuation = getProgramValuation(program);

  const handlePointsChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    if (cleanValue) {
      setPoints(formatNumber(Number.parseInt(cleanValue, 10)));
    } else {
      setPoints("");
    }
  };

  const handleCashChange = (value: string) => {
    const cleanValue = value.replace(/[^\d,]/g, "");
    setCashPrice(cleanValue);
  };

  const handleReset = () => {
    setPoints("");
    setCashPrice("");
    setShowDetails(false);
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Calculator className="size-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{t("calculator.title")}</CardTitle>
            <CardDescription>{t("calculator.description")}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        <div className="space-y-2">
          <Label>{t("calculator.fields.program")}</Label>
          <Select
            value={program}
            onValueChange={(v) => setProgram(v as PointsProgramName)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(PROGRAM_VALUATIONS).map((prog) => (
                <SelectItem key={prog} value={prog}>
                  <div className="flex items-center gap-2">
                    <ProgramIcon
                      program={prog as PointsProgramName}
                      className="size-4"
                    />
                    {getProgramDisplayName(prog as PointsProgramName)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t("calculator.programValue", {
              value: formatCurrency(programValuation.avgValue),
            })}
          </p>
        </div>

        <div className="space-y-2">
          <Label>{t("calculator.fields.points")}</Label>
          <div className="relative">
            <Coins className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              type="text"
              inputMode="numeric"
              placeholder="10.000"
              className="pl-9"
              value={points}
              onChange={(e) => handlePointsChange(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("calculator.fields.cashPrice")}</Label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-sm text-muted-foreground">
              R$
            </span>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="150,00"
              className="pl-9"
              value={cashPrice}
              onChange={(e) => handleCashChange(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("calculator.fields.cashPriceHint")}
          </p>
        </div>

        {recommendation && (
          <div className="space-y-4">
            <div
              className={cn(
                "p-4 rounded-lg border-2",
                recommendation.usePoints
                  ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                  : "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "p-2 rounded-full",
                    recommendation.usePoints
                      ? "bg-green-100 dark:bg-green-900"
                      : "bg-amber-100 dark:bg-amber-900",
                  )}
                >
                  {recommendation.usePoints ? (
                    <CheckCircle2
                      className={cn(
                        "size-5",
                        recommendation.usePoints
                          ? "text-green-600 dark:text-green-400"
                          : "text-amber-600 dark:text-amber-400",
                      )}
                    />
                  ) : (
                    <XCircle className="size-5 text-amber-600 dark:text-amber-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        "font-semibold",
                        recommendation.usePoints
                          ? "text-green-700 dark:text-green-300"
                          : "text-amber-700 dark:text-amber-300",
                      )}
                    >
                      {recommendation.usePoints
                        ? t("calculator.result.usePoints")
                        : t("calculator.result.useCash")}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        recommendation.confidence === "high"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : recommendation.confidence === "medium"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
                      )}
                    >
                      {t(`calculator.confidence.${recommendation.confidence}`)}
                    </Badge>
                  </div>
                  <p
                    className={cn(
                      "text-sm",
                      recommendation.usePoints
                        ? "text-green-600 dark:text-green-400"
                        : "text-amber-600 dark:text-amber-400",
                    )}
                  >
                    {recommendation.reason}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-1">
                  <Coins className="size-4 text-primary" />
                  <span className="text-sm font-medium">
                    {t("calculator.result.pointsValue")}
                  </span>
                </div>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(recommendation.pointsValue.avg)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("calculator.result.range", {
                    min: formatCurrency(recommendation.pointsValue.min),
                    max: formatCurrency(recommendation.pointsValue.max),
                  })}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {t("calculator.result.effectiveValue")}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="size-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-sm">
                          {t("calculator.result.effectiveValueTooltip")}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "text-lg font-bold",
                      recommendation.isGoodValue
                        ? "text-green-600 dark:text-green-400"
                        : "text-amber-600 dark:text-amber-400",
                    )}
                  >
                    {formatCurrency(recommendation.effectiveValuePerPoint)}
                  </p>
                  {recommendation.isGoodValue ? (
                    <TrendingUp className="size-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="size-4 text-amber-600 dark:text-amber-400" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("calculator.result.perPoint")} •{" "}
                  {t("calculator.result.avgIs", {
                    value: formatCurrency(recommendation.avgValuePerPoint),
                  })}
                </p>
              </div>
            </div>

            <div
              className={cn(
                "flex items-center justify-between p-3 rounded-lg",
                recommendation.savingsOrLoss >= 0
                  ? "bg-green-50 dark:bg-green-950"
                  : "bg-red-50 dark:bg-red-950",
              )}
            >
              <span className="text-sm font-medium">
                {recommendation.savingsOrLoss >= 0
                  ? t("calculator.result.youSave")
                  : t("calculator.result.youLose")}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "font-bold",
                    recommendation.savingsOrLoss >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                >
                  {formatCurrency(Math.abs(recommendation.savingsOrLoss))}
                </span>
                <Badge
                  variant="secondary"
                  className={cn(
                    recommendation.savingsOrLoss >= 0
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                  )}
                >
                  {formatPercentage(recommendation.percentageGainLoss)}
                </Badge>
              </div>
            </div>

            <Collapsible open={showDetails} onOpenChange={setShowDetails}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between text-muted-foreground"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="size-4" />
                    {t("calculator.details.title")}
                  </span>
                  {showDetails ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("calculator.details.programAvg")}
                    </span>
                    <span>
                      {formatCurrency(programValuation.avgValue)}/ponto
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("calculator.details.programRange")}
                    </span>
                    <span>
                      {formatCurrency(programValuation.minValue)} -{" "}
                      {formatCurrency(programValuation.maxValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("calculator.details.pointsPerReal")}
                    </span>
                    <span>~{programValuation.pointsPerReal} pontos</span>
                  </div>
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground text-xs">
                      {t("calculator.details.bestRedemptions")}
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {programValuation.bestRedemptions.map((redemption) => (
                        <Badge
                          key={redemption}
                          variant="outline"
                          className="text-xs"
                        >
                          {redemption}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Button variant="outline" className="w-full" onClick={handleReset}>
              {t("calculator.actions.reset")}
            </Button>
          </div>
        )}

        {!recommendation && (points || cashPrice) && (
          <div className="text-center py-4 text-muted-foreground">
            <Calculator className="size-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("calculator.enterValues")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
