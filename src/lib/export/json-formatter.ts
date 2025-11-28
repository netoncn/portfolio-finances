import type { ExportColumn } from "./types";

function getNestedValue<T>(obj: T, path: string): unknown {
  const keys = path.split(".");
  let value: unknown = obj;

  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined;
    }
    value = (value as Record<string, unknown>)[key];
  }

  return value;
}

export function formatJSON<T extends object>(
  data: T[],
  columns?: ExportColumn<T>[],
): string {
  if (!columns) {
    return JSON.stringify(data, null, 2);
  }

  const transformedData = data.map((row) => {
    const transformed: Record<string, unknown> = {};

    for (const col of columns) {
      const rawValue = getNestedValue(row, col.key as string);
      const formattedValue = col.formatter
        ? col.formatter(rawValue, row)
        : rawValue;
      transformed[col.header] = formattedValue;
    }

    return transformed;
  });

  return JSON.stringify(transformedData, null, 2);
}

export function formatNDJSON<T extends object>(
  data: T[],
  columns?: ExportColumn<T>[],
): string {
  if (!columns) {
    return data.map((row) => JSON.stringify(row)).join("\n");
  }

  return data
    .map((row) => {
      const transformed: Record<string, unknown> = {};

      for (const col of columns) {
        const rawValue = getNestedValue(row, col.key as string);
        const formattedValue = col.formatter
          ? col.formatter(rawValue, row)
          : rawValue;
        transformed[col.header] = formattedValue;
      }

      return JSON.stringify(transformed);
    })
    .join("\n");
}

export function formatJSONWithMetadata<T extends object>(
  data: T[],
  metadata: {
    exportedAt?: string;
    exportedBy?: string;
    module?: string;
    filters?: Record<string, unknown>;
    totalRecords?: number;
  },
): string {
  const exportData = {
    metadata: {
      exportedAt: metadata.exportedAt || new Date().toISOString(),
      exportedBy: metadata.exportedBy,
      module: metadata.module,
      totalRecords: metadata.totalRecords ?? data.length,
      filters: metadata.filters,
    },
    data,
  };

  return JSON.stringify(exportData, null, 2);
}
