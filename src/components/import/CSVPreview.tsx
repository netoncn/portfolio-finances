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
  CSVFieldMapping,
  CSVParseResult,
  ParsedTransaction,
} from "@/lib/csv/types";
import { formatCurrency } from "@/lib/utils";

interface CSVPreviewProps {
  parseResult: CSVParseResult;
  mapping: CSVFieldMapping;
  onMappingChange: (mapping: CSVFieldMapping) => void;
  parsedTransactions?: ParsedTransaction[];
  maxPreviewRows?: number;
}

const FIELD_OPTIONS = [
  { value: "none", label: "Ignore" },
  { value: "date", label: "Date" },
  { value: "description", label: "Description" },
  { value: "merchant", label: "Merchant" },
  { value: "amount", label: "Amount" },
  { value: "type", label: "Type" },
  { value: "category", label: "Category" },
  { value: "tags", label: "Tags" },
];

export function CSVPreview({
  parseResult,
  mapping,
  onMappingChange,
  parsedTransactions,
  maxPreviewRows = 10,
}: CSVPreviewProps) {
  const t = useTranslations("import");

  const handleMappingChange = (header: string, value: string) => {
    const newMapping = { ...mapping };

    Object.keys(newMapping).forEach((key) => {
      if (newMapping[key as keyof CSVFieldMapping] === header) {
        delete newMapping[key as keyof CSVFieldMapping];
      }
    });

    if (value !== "none") {
      newMapping[value as keyof CSVFieldMapping] = header;
    }

    onMappingChange(newMapping);
  };

  const getMappedField = (header: string): string => {
    const field = Object.entries(mapping).find(([_, h]) => h === header)?.[0];
    return field || "none";
  };

  const validCount = parsedTransactions?.filter((t) => !t.error).length || 0;
  const errorCount = parsedTransactions?.filter((t) => t.error).length || 0;
  const duplicateCount =
    parsedTransactions?.filter((t) => t.isDuplicate).length || 0;

  const previewRows = parseResult.rows.slice(0, maxPreviewRows);

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
        <div className="space-y-2">
          {parseResult.headers.map((header) => (
            <div key={header} className="flex items-center gap-3">
              <div className="w-1/3 text-sm font-medium">{header}</div>
              <div className="flex-1">
                <Select
                  value={getMappedField(header)}
                  onValueChange={(value) => handleMappingChange(header, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!mapping.date ||
        !mapping.description ||
        (!mapping.amount && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t("preview.requiredFields")}</AlertDescription>
          </Alert>
        ))}

      <div>
        <h3 className="mb-3 text-sm font-medium">
          {t("preview.previewTitle")} ({previewRows.length} {t("preview.of")}{" "}
          {parseResult.rowCount})
        </h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {parseResult.headers.map((header) => (
                  <TableHead key={header}>{header}</TableHead>
                ))}
                {parsedTransactions && <TableHead>Status</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row, index) => (
                <TableRow key={index}>
                  {parseResult.headers.map((header) => (
                    <TableCell key={header} className="text-sm">
                      {row[header]}
                    </TableCell>
                  ))}
                  {parsedTransactions?.[index] && (
                    <TableCell>
                      {parsedTransactions[index].error ? (
                        <Badge variant="destructive" className="text-xs">
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
                    ? "border-red-200 bg-red-50"
                    : transaction.isDuplicate
                      ? "border-orange-200 bg-orange-50"
                      : "bg-muted/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{transaction.description}</div>
                    {transaction.merchant && (
                      <div className="text-sm text-muted-foreground">
                        {transaction.merchant}
                      </div>
                    )}
                    {transaction.date && (
                      <div className="text-xs text-muted-foreground">
                        {transaction.date.toLocaleDateString()}
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
                      {formatCurrency(transaction.amount * 100)}
                    </div>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {transaction.type}
                    </Badge>
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
