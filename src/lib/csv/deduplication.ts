import type { Transaction } from "@/domain/transactions/types/transaction";
import type { ParsedTransaction } from "./types";

function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;

  const len1 = s1.length;
  const len2 = s2.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) return 1;

  const matrix: number[][] = [];

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return 1 - matrix[len2][len1] / maxLen;
}

export function isDuplicate(
  parsed: ParsedTransaction,
  existing: Transaction,
  threshold = 0.85,
): boolean {
  if (parsed.date && existing.date) {
    const dayDiff =
      Math.abs(parsed.date.getTime() - existing.date) / (1000 * 60 * 60 * 24);
    if (dayDiff > 1) return false;
  }

  const amountInCents = Math.round(parsed.amount * 100);
  if (Math.abs(amountInCents - existing.amount) > 1) return false;

  const descSimilarity = stringSimilarity(
    parsed.description,
    existing.description,
  );
  if (descSimilarity >= threshold) return true;

  if (parsed.merchant && existing.merchant) {
    const merchantSimilarity = stringSimilarity(
      parsed.merchant,
      existing.merchant,
    );
    if (merchantSimilarity >= threshold) return true;
  }

  return false;
}

export function findDuplicates(
  parsedTransactions: ParsedTransaction[],
  existingTransactions: Transaction[],
  threshold = 0.85,
): ParsedTransaction[] {
  return parsedTransactions.map((parsed) => {
    const hasDuplicate = existingTransactions.some((existing) =>
      isDuplicate(parsed, existing, threshold),
    );

    return {
      ...parsed,
      isDuplicate: hasDuplicate,
    };
  });
}

export function groupSimilarTransactions(
  transactions: ParsedTransaction[],
): ParsedTransaction[][] {
  const groups: ParsedTransaction[][] = [];

  for (const transaction of transactions) {
    let foundGroup = false;

    for (const group of groups) {
      const isSimilar = group.some((t) => {
        const sameDate =
          t.date &&
          transaction.date &&
          Math.abs(t.date.getTime() - transaction.date.getTime()) <
            1000 * 60 * 60 * 24;
        const sameAmount = Math.abs(t.amount - transaction.amount) < 0.01;
        const similarDesc =
          stringSimilarity(t.description, transaction.description) > 0.8;

        return sameDate && sameAmount && similarDesc;
      });

      if (isSimilar) {
        group.push(transaction);
        foundGroup = true;
        break;
      }
    }

    if (!foundGroup) {
      groups.push([transaction]);
    }
  }

  return groups;
}

export function createTransactionKey(
  date: Date | undefined,
  amount: number,
  description: string,
): string {
  const dateStr = date ? date.toISOString().split("T")[0] : "no-date";
  const amountStr = amount.toFixed(2);
  const descStr = description.toLowerCase().trim().slice(0, 50);

  return `${dateStr}-${amountStr}-${descStr}`;
}

export function removeDuplicatesInBatch(
  transactions: ParsedTransaction[],
): ParsedTransaction[] {
  const seen = new Set<string>();
  const unique: ParsedTransaction[] = [];

  for (const transaction of transactions) {
    const key = createTransactionKey(
      transaction.date,
      transaction.amount,
      transaction.description,
    );

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(transaction);
    }
  }

  return unique;
}
