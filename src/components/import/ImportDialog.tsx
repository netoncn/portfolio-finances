"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/domain/categories/types/category";
import type { MappingRule } from "@/domain/categories/types/mapping-rule";
import { useAccounts } from "@/hooks/use-accounts";
import { transactionKeys, useTransactions } from "@/hooks/use-transactions";
import { autoClassifyTransaction } from "@/lib/classification/rules-engine";
import {
  findDuplicates,
  removeDuplicatesInBatch,
} from "@/lib/csv/deduplication";
import {
  detectTransactionType,
  parseAmount,
  parseCSV,
  parseDate,
  readFileAsText,
} from "@/lib/csv/parser";
import type {
  CSVFieldMapping,
  CSVParseResult,
  ParsedTransaction,
} from "@/lib/csv/types";
import { CSVPreview } from "./CSVPreview";
import { CSVUploader } from "./CSVUploader";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories?: Category[];
  mappingRules?: MappingRule[];
}

type ImportStep =
  | "upload"
  | "preview"
  | "categories"
  | "importing"
  | "complete";

interface ParsedTransactionWithCategory extends ParsedTransaction {
  categoryId?: string;
  suggestedCategoryId?: string;
  confidence?: number;
}

export function ImportDialog({
  open,
  onOpenChange,
  categories = [],
  mappingRules = [],
}: ImportDialogProps) {
  const t = useTranslations("import");
  const queryClient = useQueryClient();
  const { data: accounts = [] } = useAccounts();
  const { data: existingTransactions = [] } = useTransactions();

  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File>();
  const [parseResult, setParseResult] = useState<CSVParseResult>();
  const [mapping, setMapping] = useState<CSVFieldMapping>({});
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [parsedTransactions, setParsedTransactions] = useState<
    ParsedTransactionWithCategory[]
  >([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState({
    success: 0,
    skipped: 0,
    errors: 0,
  });

  const handleFileSelect = async (selectedFile: File) => {
    try {
      setFile(selectedFile);
      const text = await readFileAsText(selectedFile);
      const result = parseCSV(text);
      setParseResult(result);

      const autoMapping: CSVFieldMapping = {};
      result.headers.forEach((header) => {
        const lower = header.toLowerCase();
        if (lower.includes("data") || lower.includes("date"))
          autoMapping.date = header;
        if (lower.includes("descrição") || lower.includes("description"))
          autoMapping.description = header;
        if (lower.includes("estabelecimento") || lower.includes("merchant"))
          autoMapping.merchant = header;
        if (lower.includes("valor") || lower.includes("amount"))
          autoMapping.amount = header;
      });
      setMapping(autoMapping);
      setStep("preview");
    } catch {
      toast.error(t("errors.parseError"));
    }
  };

  const handleAnalyze = () => {
    if (
      !parseResult ||
      !mapping.date ||
      !mapping.description ||
      !mapping.amount
    ) {
      toast.error(t("errors.mappingRequired"));
      return;
    }

    const parsed: ParsedTransactionWithCategory[] = parseResult.rows.map(
      (row) => {
        try {
          const dateStr = mapping.date ? row[mapping.date] : "";
          const descStr = mapping.description ? row[mapping.description] : "";
          const amountStr = mapping.amount ? row[mapping.amount] : "";
          const merchantStr = mapping.merchant ? row[mapping.merchant] : "";

          const date = parseDate(dateStr);
          const amount = parseAmount(amountStr);
          const type = detectTransactionType(amountStr, descStr);

          if (!date || amount === null) {
            return {
              description: descStr || "Unknown",
              merchant: merchantStr,
              amount: amount || 0,
              type,
              rawRow: row,
              error: !date ? "Invalid date" : "Invalid amount",
            };
          }

          const transaction = {
            date,
            description: descStr,
            merchant: merchantStr,
            amount,
            type,
            rawRow: row,
          };

          if (mappingRules.length > 0) {
            const matchResult = autoClassifyTransaction(
              transaction as any,
              mappingRules,
            );
            if (matchResult) {
              const categoryAction = matchResult.actions.find(
                (a) => a.type === "assign_category",
              );
              if (categoryAction && typeof categoryAction.value === "string") {
                return {
                  ...transaction,
                  suggestedCategoryId: categoryAction.value,
                  categoryId: categoryAction.value,
                  confidence: matchResult.confidence,
                };
              }
            }
          }

          return transaction;
        } catch {
          return {
            description: "Parse error",
            amount: 0,
            type: "expense" as const,
            rawRow: row,
            error: "Failed to parse",
          };
        }
      },
    );

    const unique = removeDuplicatesInBatch(parsed);

    const withDuplicateCheck = findDuplicates(unique, existingTransactions);

    setParsedTransactions(withDuplicateCheck);

    if (categories.length > 0) {
      setStep("categories");
    }
  };

  const handleImport = async () => {
    if (!selectedAccountId) {
      toast.error(t("errors.accountRequired"));
      return;
    }

    const account = accounts.find((a) => a.id === selectedAccountId);
    if (!account) return;

    setStep("importing");
    setImportProgress(0);

    const toImport = parsedTransactions.filter(
      (t) => !t.error && !t.isDuplicate,
    );
    const duplicateCount = parsedTransactions.filter(
      (t) => t.isDuplicate,
    ).length;
    let success = 0;
    let errors = 0;

    const importId = `import_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    for (let i = 0; i < toImport.length; i++) {
      const transaction = toImport[i];
      try {
        const response = await fetch("/api/transactions?source=import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId: selectedAccountId,
            accountType: account.accountType,
            cardBrand: account.cardBrand,
            date: transaction.date!.getTime(),
            description: transaction.description,
            merchant: transaction.merchant,
            amount: Math.round(transaction.amount * 100),
            type: transaction.type,
            status: "posted",
            categoryId: transaction.categoryId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create transaction");
        }

        success++;
      } catch {
        errors++;
      }
      setImportProgress(((i + 1) / toImport.length) * 100);
    }

    const stats = {
      success,
      skipped: duplicateCount,
      errors,
    };

    setImportStats(stats);

    try {
      await fetch("/api/audit/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          importId,
          batchSize: parsedTransactions.length,
          successCount: success,
          errorCount: errors,
          duplicateCount,
        }),
      });
    } catch (error) {
      console.error("Failed to record bulk import audit:", error);
    }

    queryClient.invalidateQueries({ queryKey: transactionKeys.all });

    setStep("complete");
  };

  const handleClose = () => {
    setStep("upload");
    setFile(undefined);
    setParseResult(undefined);
    setMapping({});
    setParsedTransactions([]);
    setImportProgress(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>{t("dialog.title")}</DialogTitle>
          <DialogDescription>{t("dialog.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === "upload" && (
            <CSVUploader
              onFileSelect={handleFileSelect}
              selectedFile={file}
              onClear={() => setFile(undefined)}
            />
          )}

          {step === "preview" && parseResult && (
            <>
              <div className="space-y-2">
                <Label>{t("dialog.selectAccount")}</Label>
                <Select
                  value={selectedAccountId}
                  onValueChange={setSelectedAccountId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("dialog.selectAccountPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id!}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <CSVPreview
                parseResult={parseResult}
                mapping={mapping}
                onMappingChange={setMapping}
                parsedTransactions={parsedTransactions}
              />
            </>
          )}

          {step === "categories" && (
            <div className="space-y-4">
              <div className="rounded-md border bg-muted/50 p-4">
                <h3 className="mb-2 font-semibold">
                  {t("dialog.categoryMapping")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("dialog.categoryMappingDescription")}
                </p>
              </div>

              <div className="max-h-[400px] space-y-2 overflow-y-auto">
                {parsedTransactions
                  .filter((t) => !t.error && !t.isDuplicate)
                  .map((transaction, index) => {
                    const category = categories.find(
                      (c) => c.id === transaction.categoryId,
                    );
                    const hasSuggestion = !!transaction.suggestedCategoryId;

                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded-md border p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">
                            {transaction.description}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{transaction.merchant}</span>
                            <span>•</span>
                            <span>R$ {transaction.amount.toFixed(2)}</span>
                            {hasSuggestion && transaction.confidence && (
                              <>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(transaction.confidence * 100)}%
                                  confidence
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>

                        <Select
                          value={transaction.categoryId || ""}
                          onValueChange={(value) => {
                            const updated = [...parsedTransactions];
                            updated[index] = {
                              ...updated[index],
                              categoryId: value,
                            };
                            setParsedTransactions(updated);
                          }}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue
                              placeholder={t("dialog.selectCategory")}
                            >
                              {category && (
                                <span className="flex items-center gap-2">
                                  {category.icon} {category.name}
                                </span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {categories
                              .filter((c) => c.type === transaction.type)
                              .map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  <span className="flex items-center gap-2">
                                    {cat.icon} {cat.name}
                                  </span>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {step === "importing" && (
            <div className="space-y-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {t("dialog.importing")} {Math.round(importProgress)}%
              </p>
            </div>
          )}

          {step === "complete" && (
            <div className="space-y-4 rounded-lg border bg-muted/50 p-6 text-center">
              <h3 className="text-lg font-semibold">{t("dialog.complete")}</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {importStats.success}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t("dialog.imported")}
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {importStats.skipped}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t("dialog.skipped")}
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {importStats.errors}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t("dialog.errors")}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={handleClose}>
              {t("dialog.cancel")}
            </Button>
          )}

          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>
                {t("dialog.back")}
              </Button>
              {parsedTransactions.length === 0 ? (
                <Button onClick={handleAnalyze}>{t("dialog.analyze")}</Button>
              ) : categories.length === 0 ? (
                <Button
                  onClick={handleImport}
                  disabled={
                    !selectedAccountId ||
                    parsedTransactions.filter((t) => !t.error && !t.isDuplicate)
                      .length === 0
                  }
                >
                  {t("dialog.import")} (
                  {
                    parsedTransactions.filter((t) => !t.error && !t.isDuplicate)
                      .length
                  }
                  )
                </Button>
              ) : (
                <Button onClick={() => setStep("categories")}>
                  {t("dialog.next")}
                </Button>
              )}
            </>
          )}

          {step === "categories" && (
            <>
              <Button variant="outline" onClick={() => setStep("preview")}>
                {t("dialog.back")}
              </Button>
              <Button
                onClick={handleImport}
                disabled={
                  !selectedAccountId ||
                  parsedTransactions.filter((t) => !t.error && !t.isDuplicate)
                    .length === 0
                }
              >
                {t("dialog.import")} (
                {
                  parsedTransactions.filter((t) => !t.error && !t.isDuplicate)
                    .length
                }
                )
              </Button>
            </>
          )}

          {step === "complete" && (
            <Button onClick={handleClose}>{t("dialog.close")}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
