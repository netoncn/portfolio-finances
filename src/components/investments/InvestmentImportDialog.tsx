"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { CSVUploader } from "@/components/import/CSVUploader";
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
import type { InvestmentAccount } from "@/domain/investments/types";
import { useInvestmentTransactions } from "@/hooks/use-investment-transactions";
import {
  autoDetectInvestmentMapping,
  findInvestmentDuplicates,
  parseInvestmentCSVRow,
} from "@/lib/csv/investment-parser";
import type {
  InvestmentCSVFieldMapping,
  ParsedInvestmentTransaction,
} from "@/lib/csv/investment-types";
import { parseCSV, readFileAsText } from "@/lib/csv/parser";
import type { CSVParseResult } from "@/lib/csv/types";
import { InvestmentCSVPreview } from "./InvestmentCSVPreview";

interface InvestmentImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: InvestmentAccount[];
}

type ImportStep = "upload" | "preview" | "importing" | "complete";

export function InvestmentImportDialog({
  open,
  onOpenChange,
  accounts,
}: InvestmentImportDialogProps) {
  const t = useTranslations("investments.import");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();

  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File>();
  const [parseResult, setParseResult] = useState<CSVParseResult>();
  const [mapping, setMapping] = useState<InvestmentCSVFieldMapping>({});
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [parsedTransactions, setParsedTransactions] = useState<
    ParsedInvestmentTransaction[]
  >([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState({
    success: 0,
    skipped: 0,
    errors: 0,
  });

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const { data: existingTransactions = [] } = useInvestmentTransactions({
    accountId: selectedAccountId || undefined,
  });

  const handleFileSelect = async (selectedFile: File) => {
    try {
      setFile(selectedFile);
      const text = await readFileAsText(selectedFile);
      const result = parseCSV(text);
      setParseResult(result);

      const autoMapping = autoDetectInvestmentMapping(result.headers);
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
      !mapping.transactionType ||
      !mapping.amount
    ) {
      toast.error(t("errors.mappingRequired"));
      return;
    }

    if (!selectedAccount) {
      toast.error(t("errors.accountRequired"));
      return;
    }

    const parsed: ParsedInvestmentTransaction[] = parseResult.rows.map((row) =>
      parseInvestmentCSVRow(row, mapping, selectedAccount.currency),
    );

    const existingForCheck = existingTransactions.map((t) => ({
      date: t.date,
      amount: t.amount,
      ticker: t.ticker,
      transactionType: t.transactionType,
    }));

    const withDuplicateCheck = findInvestmentDuplicates(
      parsed,
      existingForCheck,
    );

    setParsedTransactions(withDuplicateCheck);
  };

  const handleImport = async () => {
    if (!selectedAccountId || !selectedAccount) {
      toast.error(t("errors.accountRequired"));
      return;
    }

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

    for (let i = 0; i < toImport.length; i++) {
      const transaction = toImport[i];
      try {
        const response = await fetch("/api/investment-transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            investmentAccountId: selectedAccountId,
            ticker: transaction.ticker,
            transactionType: transaction.transactionType,
            quantity: transaction.quantity,
            price: transaction.price,
            amount: transaction.amount,
            fees: transaction.fees,
            currency: transaction.currency,
            date: transaction.date!.getTime(),
            notes: transaction.notes,
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

    queryClient.invalidateQueries({ queryKey: ["investmentTransactions"] });
    queryClient.invalidateQueries({ queryKey: ["positions"] });

    setStep("complete");
  };

  const handleClose = () => {
    setStep("upload");
    setFile(undefined);
    setParseResult(undefined);
    setMapping({});
    setParsedTransactions([]);
    setImportProgress(0);
    setSelectedAccountId("");
    onOpenChange(false);
  };

  const validTransactionsCount = parsedTransactions.filter(
    (t) => !t.error && !t.isDuplicate,
  ).length;

  const hasRequiredFields =
    mapping.date && mapping.transactionType && mapping.amount;

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
                    {accounts
                      .filter((a) => !a.archived)
                      .map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} ({account.broker})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <InvestmentCSVPreview
                parseResult={parseResult}
                mapping={mapping}
                onMappingChange={setMapping}
                parsedTransactions={parsedTransactions}
              />
            </>
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
              {tCommon("cancel")}
            </Button>
          )}

          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>
                {t("dialog.back")}
              </Button>
              {parsedTransactions.length === 0 ? (
                <Button
                  onClick={handleAnalyze}
                  disabled={!selectedAccountId || !hasRequiredFields}
                >
                  {t("dialog.analyze")}
                </Button>
              ) : (
                <Button
                  onClick={handleImport}
                  disabled={!selectedAccountId || validTransactionsCount === 0}
                >
                  {t("dialog.import")} ({validTransactionsCount})
                </Button>
              )}
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
