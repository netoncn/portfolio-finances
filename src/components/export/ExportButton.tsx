"use client";

import { Download, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type ExportColumn,
  type ExportFormat,
  exportData,
} from "@/lib/export/exporter";

interface ExportButtonProps<T extends object> {
  data: T[];
  columns: ExportColumn<T>[];
  filename: string;
  module: string;
  disabled?: boolean;
  filters?: object;
}

export function ExportButton<T extends object>({
  data,
  columns,
  filename,
  module,
  disabled,
  filters,
}: ExportButtonProps<T>) {
  const t = useTranslations("common.export");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    if (data.length === 0) {
      toast.error(t("noData"));
      return;
    }

    setIsExporting(true);

    try {
      const result = exportData(data as Record<string, unknown>[], {
        format,
        filename,
        module,
        columns: columns as ExportColumn<Record<string, unknown>>[],
        includeMetadata: format === "json",
        filters: filters as Record<string, unknown>,
      });

      // Create blob and download
      const blob = new Blob(
        [format === "csv" ? `\uFEFF${result.content}` : result.content],
        { type: result.mimeType },
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(
        t("success", { count: data.length, format: format.toUpperCase() }),
      );
    } catch (error) {
      console.error("Export error:", error);
      toast.error(t("error"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {t("button")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          {t("csv")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")}>
          <FileJson className="mr-2 h-4 w-4" />
          {t("json")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
