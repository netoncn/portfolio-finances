export type ExportFormat = "csv" | "json";

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  dateFrom?: number;
  dateTo?: number;
  includeHeaders?: boolean;
}

export interface ExportColumn<T extends object = Record<string, unknown>> {
  key: keyof T | string;
  header: string;
  formatter?: (value: unknown, row: T) => string;
}

export interface ExportResult {
  content: string;
  filename: string;
  mimeType: string;
}
