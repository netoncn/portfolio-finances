import type { CSVParseResult, CSVRow } from "./types";

export function detectDelimiter(
  text: string,
): "," | ";" | "\t" | "|" | undefined {
  const firstLine = text.split("\n")[0];
  const delimiters = [",", ";", "\t", "|"] as const;

  let maxCount = 0;
  let detectedDelimiter: "," | ";" | "\t" | "|" | undefined;

  for (const delimiter of delimiters) {
    const count = (firstLine.match(new RegExp(`\\${delimiter}`, "g")) || [])
      .length;
    if (count > maxCount) {
      maxCount = count;
      detectedDelimiter = delimiter;
    }
  }

  return detectedDelimiter;
}

export function parseCSV(
  text: string,
  delimiter?: "," | ";" | "\t" | "|",
  hasHeader = true,
): CSVParseResult {
  const lines = text.trim().split("\n");
  const detectedDelimiter = delimiter || detectDelimiter(text) || ",";

  if (lines.length === 0) {
    return {
      headers: [],
      rows: [],
      rowCount: 0,
      delimiter: detectedDelimiter,
    };
  }

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === detectedDelimiter && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = hasHeader
    ? parseRow(lines[0])
    : parseRow(lines[0]).map((_, i) => `Column ${i + 1}`);

  const startRow = hasHeader ? 1 : 0;
  const rows: CSVRow[] = [];

  for (let i = startRow; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseRow(line);
    const row: CSVRow = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    rows.push(row);
  }

  return {
    headers,
    rows,
    rowCount: rows.length,
    delimiter: detectedDelimiter,
  };
}

export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  const isoDate = new Date(dateStr);
  if (!Number.isNaN(isoDate.getTime())) {
    return isoDate;
  }

  const formats = [
    // DD/MM/YYYY
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/,
    // MM/DD/YYYY
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/,
    // YYYY-MM-DD
    /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/,
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      // Try DD/MM/YYYY (Brazilian format)
      const date1 = new Date(
        parseInt(match[3], 10),
        parseInt(match[2], 10) - 1,
        parseInt(match[1], 10),
      );
      if (!Number.isNaN(date1.getTime())) {
        return date1;
      }

      // Try MM/DD/YYYY (US format)
      const date2 = new Date(
        parseInt(match[3], 10),
        parseInt(match[1], 10) - 1,
        parseInt(match[2], 10),
      );
      if (!Number.isNaN(date2.getTime())) {
        return date2;
      }
    }
  }

  return null;
}

export function parseAmount(amountStr: string): number | null {
  if (!amountStr) return null;

  // Remove currency symbols and spaces
  let cleaned = amountStr
    .replace(/[R$€£¥\s]/g, "")
    .replace(/\(/g, "-")
    .replace(/\)/g, "");

  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");

  if (lastDot > lastComma) {
    // . is decimal separator
    cleaned = cleaned.replace(/,/g, "");
  } else if (lastComma > lastDot) {
    // , is decimal separator
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }

  const amount = parseFloat(cleaned);
  return Number.isNaN(amount) ? null : Math.abs(amount);
}

export function detectTransactionType(
  amount: string,
  description: string,
): "expense" | "income" | "transfer" {
  if (amount.includes("-") || amount.includes("(")) {
    return "expense";
  }

  const desc = description.toLowerCase();
  const incomeKeywords = [
    "salary",
    "salário",
    "payment",
    "pagamento",
    "deposit",
    "depósito",
    "credit",
    "crédito",
    "refund",
    "reembolso",
  ];
  const transferKeywords = ["transfer", "transferência", "ted", "pix"];

  if (transferKeywords.some((kw) => desc.includes(kw))) {
    return "transfer";
  }
  if (incomeKeywords.some((kw) => desc.includes(kw))) {
    return "income";
  }

  return "expense";
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
