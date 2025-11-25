"use client";

import { Calendar, ChevronRight, DollarSign } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InstallmentGroup } from "@/domain/installments";
import { useInstallmentTransactions } from "@/hooks/use-installments";
import { formatCurrency } from "@/lib/utils";
import { InstallmentGroupDialog } from "./InstallmentGroupDialog";

interface InstallmentGroupCardProps {
  group: InstallmentGroup;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function InstallmentGroupCard({ group }: InstallmentGroupCardProps) {
  const t = useTranslations("installments");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: transactions = [] } = useInstallmentTransactions(
    group.id || "",
  );

  const paidCount = transactions.filter((t) => t.status === "paid").length;
  const canceledCount = transactions.filter(
    (t) => t.status === "canceled",
  ).length;
  const activeCount = group.installmentCount - canceledCount;
  const progress = activeCount > 0 ? (paidCount / activeCount) * 100 : 0;

  const totalAmount =
    group.originalAmount + (group.interestTotal || 0) + (group.feesTotal || 0);
  const installmentAmount = totalAmount / group.installmentCount;

  if (!group.id) {
    return null;
  }

  return (
    <>
      <Card className="cursor-pointer transition-colors hover:bg-muted/50">
        <CardHeader
          className="pb-3"
          onClick={() => setDialogOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setDialogOpen(true);
            }
          }}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-medium">
                {group.merchant || t("card.unknownMerchant")}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(group.purchaseDate)}</span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>

        <CardContent onClick={() => setDialogOpen(true)}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                <span>
                  {group.installmentCount}x {t("card.of")}{" "}
                  {formatCurrency(installmentAmount)}
                </span>
              </div>
              <span className="text-sm font-medium">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {t("card.progress")}
                </span>
                <span className="font-medium">
                  {paidCount}/{activeCount}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {group.plan && (
                <Badge variant="outline" className="text-xs">
                  {t(`plans.${group.plan}`)}
                </Badge>
              )}
              {canceledCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {canceledCount} {t("card.canceled")}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <InstallmentGroupDialog
        group={group}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
