import { csvFormatters, formatCSV } from "./csv-formatter";
import { formatJSON, formatJSONWithMetadata } from "./json-formatter";
import type { ExportColumn, ExportFormat, ExportResult } from "./types";

interface ExporterOptions<T extends object> {
  format: ExportFormat;
  filename: string;
  module: string;
  columns: ExportColumn<T>[];
  includeMetadata?: boolean;
  userId?: string;
  filters?: Record<string, unknown>;
}

export function exportData<T extends object>(
  data: T[],
  options: ExporterOptions<T>,
): ExportResult {
  const {
    format,
    filename,
    module,
    columns,
    includeMetadata,
    userId,
    filters,
  } = options;

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const fullFilename = `${filename}-${timestamp}.${format}`;

  let content: string;
  let mimeType: string;

  if (format === "csv") {
    content = formatCSV(data, columns, true);
    mimeType = "text/csv;charset=utf-8";
  } else {
    if (includeMetadata) {
      content = formatJSONWithMetadata(data, {
        exportedAt: new Date().toISOString(),
        exportedBy: userId,
        module,
        totalRecords: data.length,
        filters,
      });
    } else {
      content = formatJSON(data, columns);
    }
    mimeType = "application/json;charset=utf-8";
  }

  return {
    content,
    filename: fullFilename,
    mimeType,
  };
}

export function createExportResponse(result: ExportResult): Response {
  const bom = result.mimeType.includes("csv") ? "\uFEFF" : "";
  const content = bom + result.content;

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": result.mimeType,
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export { formatCSV, csvFormatters, formatJSON, formatJSONWithMetadata };
export type { ExportColumn, ExportFormat, ExportResult };
