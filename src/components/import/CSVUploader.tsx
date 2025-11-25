"use client";

import { FileText, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CSVUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile?: File;
  onClear?: () => void;
  disabled?: boolean;
}

export function CSVUploader({
  onFileSelect,
  selectedFile,
  onClear,
  disabled,
}: CSVUploaderProps) {
  const t = useTranslations("import");

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file && file.type === "text/csv") {
        onFileSelect(file);
      }
    },
    [onFileSelect, disabled],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect],
  );

  if (selectedFile) {
    return (
      <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <p className="font-medium">{selectedFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
        </div>
        {onClear && !disabled && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:border-primary hover:bg-primary/5",
      )}
      role="document"
    >
      <input
        type="file"
        accept=".csv"
        onChange={handleFileInput}
        disabled={disabled}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
      <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
      <h3 className="mb-2 text-lg font-semibold">{t("uploader.title")}</h3>
      <p className="mb-4 text-center text-sm text-muted-foreground">
        {t("uploader.description")}
      </p>
      <Button disabled={disabled} variant="outline">
        {t("uploader.button")}
      </Button>
    </div>
  );
}
