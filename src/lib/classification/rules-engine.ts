import type {
  MappingRule,
  RuleAction,
  RuleCondition,
  RuleMatchResult,
} from "@/domain/categories/types/mapping-rule";
import type { Transaction } from "@/domain/transactions/types/transaction";

function evaluateCondition(
  condition: RuleCondition,
  transaction: Transaction,
): boolean {
  const { type, value, caseSensitive = false } = condition;

  const normalize = (str: string) => (caseSensitive ? str : str.toLowerCase());

  switch (type) {
    case "description_contains": {
      if (typeof value !== "string") return false;
      const description = normalize(transaction.description || "");
      const searchValue = normalize(value);
      return description.includes(searchValue);
    }

    case "description_matches": {
      if (typeof value !== "string") return false;
      const description = normalize(transaction.description || "");
      const pattern = normalize(value);
      try {
        const regex = new RegExp(pattern, caseSensitive ? "" : "i");
        return regex.test(description);
      } catch {
        return description === pattern;
      }
    }

    case "amount_greater_than": {
      if (typeof value !== "number") return false;
      return transaction.amount > value;
    }

    case "amount_less_than": {
      if (typeof value !== "number") return false;
      return transaction.amount < value;
    }

    case "amount_equals": {
      if (typeof value !== "number") return false;
      return Math.abs(transaction.amount - value) < 0.01;
    }

    case "amount_between": {
      if (!Array.isArray(value) || value.length !== 2) return false;
      const [min, max] = value;
      return transaction.amount >= min && transaction.amount <= max;
    }

    case "merchant_equals": {
      if (typeof value !== "string") return false;
      const merchant = normalize(transaction.merchant || "");
      const searchValue = normalize(value);
      return merchant === searchValue;
    }

    case "merchant_contains": {
      if (typeof value !== "string") return false;
      const merchant = normalize(transaction.merchant || "");
      const searchValue = normalize(value);
      return merchant.includes(searchValue);
    }

    default:
      return false;
  }
}

function evaluateRule(rule: MappingRule, transaction: Transaction): boolean {
  if (rule.categoryType && transaction.type !== rule.categoryType) {
    return false;
  }

  return rule.conditions.every((condition) =>
    evaluateCondition(condition, transaction),
  );
}

function calculateConfidence(rule: MappingRule): number {
  let confidence = 0.5; // Base confidence

  confidence += Math.min(rule.conditions.length * 0.1, 0.3);

  const hasExactMatch = rule.conditions.some(
    (c) =>
      c.type === "description_matches" ||
      c.type === "amount_equals" ||
      c.type === "merchant_equals",
  );
  if (hasExactMatch) confidence += 0.1;

  const priorityBonus = {
    low: 0,
    medium: 0.05,
    high: 0.1,
  };
  confidence += priorityBonus[rule.priority];

  return Math.min(confidence, 1.0);
}

export function findMatchingRules(
  transaction: Transaction,
  rules: MappingRule[],
): RuleMatchResult[] {
  const matches: RuleMatchResult[] = [];

  const enabledRules = rules
    .filter((rule) => rule.enabled)
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      const aCreated = a.createdAt || 0;
      const bCreated = b.createdAt || 0;
      return bCreated - aCreated;
    });

  for (const rule of enabledRules) {
    if (evaluateRule(rule, transaction)) {
      matches.push({
        rule,
        actions: rule.actions,
        confidence: calculateConfidence(rule),
      });
    }
  }

  return matches;
}

export function applyRuleActions(
  transaction: Partial<Transaction>,
  actions: RuleAction[],
): Partial<Transaction> {
  const updated = { ...transaction };

  for (const action of actions) {
    switch (action.type) {
      case "assign_category": {
        if (typeof action.value === "string") {
          updated.categoryId = action.value;
        }
        break;
      }

      case "add_tags": {
        const newTags = Array.isArray(action.value)
          ? action.value
          : [action.value];
        const existingTags = updated.tags || [];
        updated.tags = [...new Set([...existingTags, ...newTags])];
        break;
      }

      case "set_merchant": {
        if (typeof action.value === "string") {
          updated.merchant = action.value;
        }
        break;
      }
    }
  }

  return updated;
}

export function autoClassifyTransaction(
  transaction: Transaction,
  rules: MappingRule[],
): RuleMatchResult | null {
  const matches = findMatchingRules(transaction, rules);

  if (matches.length === 0) return null;

  return matches[0];
}

export function autoClassifyTransactions(
  transactions: Transaction[],
  rules: MappingRule[],
): Map<string, RuleMatchResult> {
  const results = new Map<string, RuleMatchResult>();

  for (const transaction of transactions) {
    const match = autoClassifyTransaction(transaction, rules);
    if (match && transaction.id) {
      results.set(transaction.id, match);
    }
  }

  return results;
}
