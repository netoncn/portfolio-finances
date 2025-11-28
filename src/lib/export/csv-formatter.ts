import type { ExportColumn } from "./types";

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const str = String(value);

  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

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

export function formatCSV<T extends object>(
  data: T[],
  columns: ExportColumn<T>[],
  includeHeaders = true,
): string {
  const lines: string[] = [];

  if (includeHeaders) {
    const headerRow = columns.map((col) => escapeCSV(col.header)).join(",");
    lines.push(headerRow);
  }

  for (const row of data) {
    const values = columns.map((col) => {
      const rawValue = getNestedValue(row, col.key as string);
      const formattedValue = col.formatter
        ? col.formatter(rawValue, row)
        : rawValue;
      return escapeCSV(formattedValue);
    });
    lines.push(values.join(","));
  }

  return lines.join("\r\n");
}

export const csvFormatters = {
  date: (value: unknown): string => {
    if (!value || typeof value !== "number") return "";
    return new Date(value).toISOString().split("T")[0];
  },

  datetime: (value: unknown): string => {
    if (!value || typeof value !== "number") return "";
    return new Date(value).toISOString();
  },

  localDate: (value: unknown): string => {
    if (!value || typeof value !== "number") return "";
    return new Date(value).toLocaleDateString("pt-BR");
  },

  currency: (value: unknown): string => {
    if (value === null || value === undefined) return "";
    const cents = Number(value);
    if (Number.isNaN(cents)) return "";
    return (cents / 100).toFixed(2);
  },

  currencyBRL: (value: unknown): string => {
    if (value === null || value === undefined) return "";
    const cents = Number(value);
    if (Number.isNaN(cents)) return "";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  },

  boolean: (value: unknown): string => {
    if (value === null || value === undefined) return "";
    return value ? "Sim" : "Não";
  },

  array: (value: unknown): string => {
    if (!Array.isArray(value)) return "";
    return value.join("; ");
  },

  percentage: (value: unknown): string => {
    if (value === null || value === undefined) return "";
    const num = Number(value);
    if (Number.isNaN(num)) return "";
    return `${(num * 100).toFixed(0)}%`;
  },
};
