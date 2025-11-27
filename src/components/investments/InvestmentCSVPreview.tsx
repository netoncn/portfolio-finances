"use client";

import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
  InvestmentCSVFieldMapping,
  ParsedInvestmentTransaction,
} from "@/lib/csv/investment-types";
import { INVESTMENT_FIELD_OPTIONS } from "@/lib/csv/investment-types";
import type { CSVParseResult } from "@/lib/csv/types";
import { formatCurrency } from "@/lib/utils";

interface InvestmentCSVPreviewProps {
  parseResult: CSVParseResult;
  mapping: InvestmentCSVFieldMapping;
  onMappingChange: (mapping: InvestmentCSVFieldMapping) => void;
  parsedTransactions?: ParsedInvestmentTransaction[];
  maxPreviewRows?: number;
}

export function InvestmentCSVPreview({
  parseResult,
  mapping,
  onMappingChange,
  parsedTransactions,
  maxPreviewRows = 10,
}: InvestmentCSVPreviewProps) {
  const t = useTranslations("investments.import");

  const handleMappingChange = (header: string, value: string) => {
    const newMapping = { ...mapping };

    Object.keys(newMapping).forEach((key) => {
      if (newMapping[key as keyof InvestmentCSVFieldMapping] === header) {
        delete newMapping[key as keyof InvestmentCSVFieldMapping];
      }
    });

    if (value !== "none") {
      newMapping[value as keyof InvestmentCSVFieldMapping] = header;
    }

    onMappingChange(newMapping);
  };

  const getMappedField = (header: string): string => {
    const field = Object.entries(mapping).find(([_, h]) => h === header)?.[0];
    return field || "none";
  };

  const validCount =
    parsedTransactions?.filter((t) => !t.error && !t.isDuplicate).length || 0;
  const errorCount = parsedTransactions?.filter((t) => t.error).length || 0;
  const duplicateCount =
    parsedTransactions?.filter((t) => t.isDuplicate).length || 0;

  const previewRows = parseResult.rows.slice(0, maxPreviewRows);

  const hasRequiredFields =
    mapping.date && mapping.transactionType && mapping.amount;

  return (
    <div className="space-y-4">
      {parsedTransactions && parsedTransactions.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                {t("preview.valid")}
              </span>
            </div>
            <div className="mt-1 text-2xl font-bold text-green-600">
              {validCount}
            </div>
          </div>

          {errorCount > 0 && (
            <div className="rounded-lg border bg-red-50 p-4 dark:bg-red-950/20">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-900 dark:text-red-100">
                  {t("preview.errors")}
                </span>
              </div>
              <div className="mt-1 text-2xl font-bold text-red-600">
                {errorCount}
              </div>
            </div>
          )}

          {duplicateCount > 0 && (
            <div className="rounded-lg border bg-orange-50 p-4 dark:bg-orange-950/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  {t("preview.duplicates")}
                </span>
              </div>
              <div className="mt-1 text-2xl font-bold text-orange-600">
                {duplicateCount}
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-medium">{t("preview.mapping")}</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {parseResult.headers.map((header) => (
            <div key={header} className="flex items-center gap-3">
              <div
                className="w-1/2 truncate text-sm font-medium"
                title={header}
              >
                {header}
              </div>
              <div className="flex-1">
                <Select
                  value={getMappedField(header)}
                  onValueChange={(value) => handleMappingChange(header, value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVESTMENT_FIELD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(`fields.${option.labelKey}`)}
                        {"required" in option && option.required && " *"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!hasRequiredFields && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t("preview.requiredFields")}</AlertDescription>
        </Alert>
      )}

      <div>
        <h3 className="mb-3 text-sm font-medium">
          {t("preview.previewTitle")} ({previewRows.length} {t("preview.of")}{" "}
          {parseResult.rowCount})
        </h3>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {parseResult.headers.slice(0, 6).map((header) => (
                  <TableHead key={header} className="whitespace-nowrap">
                    {header}
                  </TableHead>
                ))}
                {parsedTransactions && <TableHead>Status</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row, index) => (
                <TableRow key={index}>
                  {parseResult.headers.slice(0, 6).map((header) => (
                    <TableCell
                      key={header}
                      className="max-w-[150px] truncate text-sm"
                    >
                      {row[header]}
                    </TableCell>
                  ))}
                  {parsedTransactions?.[index] && (
                    <TableCell>
                      {parsedTransactions[index].error ? (
                        <Badge
                          variant="destructive"
                          className="text-xs"
                          title={parsedTransactions[index].error}
                        >
                          {t("preview.error")}
                        </Badge>
                      ) : parsedTransactions[index].isDuplicate ? (
                        <Badge variant="outline" className="text-xs">
                          {t("preview.duplicate")}
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-xs">
                          {t("preview.ok")}
                        </Badge>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {parsedTransactions && parsedTransactions.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium">
            {t("preview.parsedData")}
          </h3>
          <div className="space-y-2">
            {parsedTransactions.slice(0, 5).map((transaction, index) => (
              <div
                key={index}
                className={`rounded-lg border p-3 ${
                  transaction.error
                    ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                    : transaction.isDuplicate
                      ? "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20"
                      : "bg-muted/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {transaction.ticker && (
                        <span className="font-semibold">
                          {transaction.ticker}
                        </span>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {transaction.transactionType}
                      </Badge>
                    </div>
                    {transaction.quantity !== undefined && (
                      <div className="text-sm text-muted-foreground">
                        {t("preview.qty")}: {transaction.quantity}
                        {transaction.price !== undefined && (
                          <span>
                            {" "}
                            @ {formatCurrency(transaction.price / 100)}
                          </span>
                        )}
                      </div>
                    )}
                    {transaction.date && (
                      <div className="text-xs text-muted-foreground">
                        {transaction.date.toLocaleDateString("pt-BR")}
                      </div>
                    )}
                    {transaction.error && (
                      <div className="mt-1 text-xs text-red-600">
                        {transaction.error}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(transaction.amount / 100)}
                    </div>
                    {transaction.fees !== undefined && transaction.fees > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {t("preview.fees")}:{" "}
                        {formatCurrency(transaction.fees / 100)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
