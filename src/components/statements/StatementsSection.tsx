"use client";

import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { useStatements } from "@/hooks/use-statements";
import { StatementCard } from "./StatementCard";

interface StatementsSectionProps {
  accountId?: string;
  accountName?: string;
}

export function StatementsSection({
  accountId,
  accountName,
}: StatementsSectionProps) {
  const t = useTranslations("statements");
  const tCommon = useTranslations("common");
  const { data: statements = [], isLoading, error } = useStatements(accountId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t("section.title")}</h2>
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {tCommon("loading")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t("section.title")}</h2>
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
          {t("section.error")}
        </div>
      </div>
    );
  }

  if (statements.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t("section.title")}</h2>
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-sm font-medium">
            {t("section.emptyTitle")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("section.emptyDescription")}
          </p>
        </div>
      </div>
    );
  }

  const sortedStatements = [...statements].sort((a, b) => {
    return b.closingDate - a.closingDate;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("section.title")}</h2>
        <span className="text-sm text-muted-foreground">
          {statements.length}{" "}
          {statements.length === 1 ? "statement" : "statements"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedStatements.map((statement) => (
          <StatementCard
            key={statement.id}
            statement={statement}
            accountName={accountName}
          />
        ))}
      </div>
    </div>
  );
}
