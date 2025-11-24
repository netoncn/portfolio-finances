import { Calendar, Clock, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  formatBillingDate,
  getBillingCycleDescription,
  getBillingDates,
  getDaysUntilClosing,
  getDaysUntilDue,
} from "@/domain/accounts/helpers/billing.helper";

interface BillingInfoProps {
  closingDay: number;
  dueDay: number;
  creditLimit?: number;
  availableCredit?: number;
  compact?: boolean;
}

export function BillingInfo({
  closingDay,
  dueDay,
  creditLimit,
  availableCredit,
  compact = false,
}: BillingInfoProps) {
  const dates = getBillingDates(closingDay, dueDay);
  const daysUntilClosing = getDaysUntilClosing(closingDay);
  const daysUntilDue = getDaysUntilDue(dueDay, closingDay);
  const cycleDescription = getBillingCycleDescription(closingDay, dueDay);

  const creditUsagePercent =
    creditLimit && availableCredit !== undefined
      ? ((creditLimit - availableCredit) / creditLimit) * 100
      : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="size-4" />
          <span>
            Fecha {closingDay}, vence {dueDay}
          </span>
        </div>
        {creditLimit && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <TrendingUp className="size-4" />
            <span>
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                minimumFractionDigits: 0,
              }).format(creditLimit)}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-accent/50 border">
        <p className="text-sm text-muted-foreground">{cycleDescription}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg border bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="size-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              Próximo Fechamento
            </span>
          </div>
          <p className="text-sm font-semibold">
            {formatBillingDate(dates.nextClosing)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {daysUntilClosing === 0
              ? "Hoje"
              : daysUntilClosing === 1
                ? "Amanhã"
                : `em ${daysUntilClosing} dias`}
          </p>
        </div>

        <div className="p-3 rounded-lg border bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="size-4 text-chart-2" />
            <span className="text-xs font-medium text-muted-foreground">
              Próximo Vencimento
            </span>
          </div>
          <p className="text-sm font-semibold">
            {formatBillingDate(dates.nextDue)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {daysUntilDue === 0
              ? "Hoje"
              : daysUntilDue === 1
                ? "Amanhã"
                : `em ${daysUntilDue} dias`}
          </p>
        </div>
      </div>

      {creditLimit !== undefined && (
        <div className="p-3 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-chart-3" />
              <span className="text-xs font-medium text-muted-foreground">
                Limite de Crédito
              </span>
            </div>
            {creditUsagePercent > 0 && (
              <Badge
                variant="secondary"
                className={
                  creditUsagePercent > 80
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    : creditUsagePercent > 50
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                }
              >
                {creditUsagePercent.toFixed(0)}% usado
              </Badge>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Disponível</span>
              <span className="font-semibold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(availableCredit || 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(creditLimit)}
              </span>
            </div>
          </div>

          {creditUsagePercent > 0 && (
            <div className="mt-3">
              <div className="h-2 bg-accent rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    creditUsagePercent > 80
                      ? "bg-red-500"
                      : creditUsagePercent > 50
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(creditUsagePercent, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function BillingDates({
  closingDay,
  dueDay,
}: {
  closingDay: number;
  dueDay: number;
}) {
  const dates = getBillingDates(closingDay, dueDay);

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        <Calendar className="size-3" />
        <span>{formatBillingDate(dates.nextClosing)}</span>
      </div>
      <span>→</span>
      <div className="flex items-center gap-1">
        <Clock className="size-3" />
        <span>{formatBillingDate(dates.nextDue)}</span>
      </div>
    </div>
  );
}
