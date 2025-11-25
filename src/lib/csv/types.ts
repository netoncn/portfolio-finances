export interface CSVFieldMapping {
  date?: string;
  description?: string;
  merchant?: string;
  amount?: string;
  type?: string;
  category?: string;
  tags?: string;
}

export interface CSVRow {
  [key: string]: string;
}

export interface ParsedTransaction {
  date?: Date;
  description: string;
  merchant?: string;
  amount: number;
  type: "expense" | "income" | "transfer";
  categoryId?: string;
  tags?: string[];
  rawRow: CSVRow;
  isDuplicate?: boolean;
  error?: string;
}

export interface CSVParseResult {
  headers: string[];
  rows: CSVRow[];
  rowCount: number;
  encoding?: string;
  delimiter?: string;
}

export interface CSVImportOptions {
  delimiter?: "," | ";" | "\t" | "|";
  hasHeader?: boolean;
  dateFormat?: string;
  accountId: string;
  skipDuplicates?: boolean;
  mapping: CSVFieldMapping;
}

export interface ImportResult {
  success: number;
  skipped: number;
  errors: number;
  duplicates: number;
  messages: string[];
}
