import "server-only";
import { logger } from "@/lib/logger";
import { REDLINE_PATTERNS, SENSITIVE_DATA_PATTERNS } from "./patterns";
import type {
  ChatMessagePrivacyData,
  PrivacyConfig,
  SanitizationResult,
  TransactionPrivacyData,
} from "./types";

export class PrivacyService {
  private static readonly DEFAULT_CONFIG: PrivacyConfig = {
    enableMasking: true,
    enableTruncation: true,
    enableRedlines: true,
    maxDescriptionLength: 150,
    maskingLevel: "partial",
  };

  static sanitizeText(
    text: string,
    config: Partial<PrivacyConfig> = {},
  ): SanitizationResult {
    const finalConfig = { ...PrivacyService.DEFAULT_CONFIG, ...config };
    let sanitized = text;
    const detectedTypes: string[] = [];
    const redlineViolations: string[] = [];
    let modified = false;

    if (finalConfig.enableRedlines) {
      const redlineResult = PrivacyService.checkRedlines(
        sanitized,
        finalConfig,
      );
      if (redlineResult.modified) {
        sanitized = redlineResult.text;
        redlineViolations.push(...redlineResult.violations);
        modified = true;
      }
    }

    if (finalConfig.enableMasking) {
      const maskingResult = PrivacyService.applyMasking(sanitized, finalConfig);
      if (maskingResult.modified) {
        sanitized = maskingResult.text;
        detectedTypes.push(...maskingResult.detectedTypes);
        modified = true;
      }
    }

    if (finalConfig.enableTruncation) {
      const truncationResult = PrivacyService.applyTruncation(
        sanitized,
        finalConfig,
      );
      if (truncationResult.modified) {
        sanitized = truncationResult.text;
        modified = true;
      }
    }

    return {
      sanitized,
      original: text,
      modified,
      detectedTypes,
      redlineViolations,
    };
  }

  static sanitizeTransaction(
    transaction: TransactionPrivacyData,
    config: Partial<PrivacyConfig> = {},
  ): {
    description: string;
    merchant?: string;
    tags?: string[];
    privacyLog: SanitizationResult;
  } {
    const descriptionResult = PrivacyService.sanitizeText(
      transaction.description,
      config,
    );

    const merchantResult = transaction.merchant
      ? PrivacyService.sanitizeText(transaction.merchant, {
          ...config,
          enableTruncation: false, // Don't truncate merchant names
          maxDescriptionLength: 100,
        })
      : null;

    if (descriptionResult.detectedTypes.length > 0) {
      logger.warn("Sensitive data detected in transaction description", {
        types: descriptionResult.detectedTypes.join(", "),
        redlines: descriptionResult.redlineViolations.join(", "),
      });
    }

    return {
      description: descriptionResult.sanitized,
      merchant: merchantResult?.sanitized || transaction.merchant,
      tags: transaction.tags, // Tags are user-controlled and typically safe
      privacyLog: descriptionResult,
    };
  }

  static sanitizeChatMessage(
    message: ChatMessagePrivacyData,
    config: Partial<PrivacyConfig> = {},
  ): {
    content: string;
    privacyLog: SanitizationResult;
  } {
    if (message.role !== "user") {
      return {
        content: message.content,
        privacyLog: {
          sanitized: message.content,
          original: message.content,
          modified: false,
          detectedTypes: [],
          redlineViolations: [],
        },
      };
    }

    const result = PrivacyService.sanitizeText(message.content, {
      ...config,
      maxDescriptionLength: 500, // Allow longer messages in chat
    });

    if (result.detectedTypes.length > 0) {
      logger.warn("Sensitive data detected in chat message", {
        types: result.detectedTypes.join(", "),
        redlines: result.redlineViolations.join(", "),
      });
    }

    return {
      content: result.sanitized,
      privacyLog: result,
    };
  }

  private static checkRedlines(
    text: string,
    config: PrivacyConfig,
  ): {
    text: string;
    violations: string[];
    modified: boolean;
  } {
    let sanitized = text;
    const violations: string[] = [];
    let modified = false;

    for (const pattern of REDLINE_PATTERNS) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          violations.push(match);
          sanitized = sanitized.replace(pattern, "[REDACTED]");
          modified = true;
        }
      }
    }

    if (config.customRedlines) {
      for (const pattern of config.customRedlines) {
        const matches = text.match(pattern);
        if (matches) {
          for (const match of matches) {
            violations.push(match);
            sanitized = sanitized.replace(pattern, "[REDACTED]");
            modified = true;
          }
        }
      }
    }

    return { text: sanitized, violations, modified };
  }

  private static applyMasking(
    text: string,
    config: PrivacyConfig,
  ): {
    text: string;
    detectedTypes: string[];
    modified: boolean;
  } {
    let sanitized = text;
    const detectedTypes: string[] = [];
    let modified = false;

    for (const pattern of SENSITIVE_DATA_PATTERNS) {
      const matches = text.match(pattern.pattern);
      if (matches) {
        detectedTypes.push(pattern.name);
        modified = true;

        if (config.maskingLevel === "full") {
          // Full masking - replace entire match with [MASKED]
          sanitized = sanitized.replace(pattern.pattern, "[MASKED]");
        } else {
          // Partial masking - use pattern's replacement function
          sanitized = sanitized.replace(pattern.pattern, (match) =>
            pattern.replacement(match),
          );
        }
      }
    }

    return { text: sanitized, detectedTypes, modified };
  }

  private static applyTruncation(
    text: string,
    config: PrivacyConfig,
  ): {
    text: string;
    modified: boolean;
  } {
    if (text.length <= config.maxDescriptionLength) {
      return { text, modified: false };
    }

    let truncated = text.slice(0, config.maxDescriptionLength);
    const lastSpace = truncated.lastIndexOf(" ");

    if (lastSpace > config.maxDescriptionLength * 0.8) {
      truncated = truncated.slice(0, lastSpace);
    }

    return {
      text: `${truncated}...`,
      modified: true,
    };
  }

  static sanitizeTransactionsBatch(
    transactions: TransactionPrivacyData[],
    config: Partial<PrivacyConfig> = {},
  ): Array<{
    description: string;
    merchant?: string;
    tags?: string[];
    privacyLog: SanitizationResult;
  }> {
    return transactions.map((t) =>
      PrivacyService.sanitizeTransaction(t, config),
    );
  }

  static getDefaultConfig(): PrivacyConfig {
    return { ...PrivacyService.DEFAULT_CONFIG };
  }

  static validateConfig(config: Partial<PrivacyConfig>): boolean {
    if (
      config.maxDescriptionLength !== undefined &&
      config.maxDescriptionLength < 10
    ) {
      logger.warn("maxDescriptionLength is too small, using minimum of 10");
      return false;
    }

    if (
      config.maskingLevel !== undefined &&
      !["partial", "full"].includes(config.maskingLevel)
    ) {
      logger.warn("Invalid maskingLevel, must be 'partial' or 'full'");
      return false;
    }

    return true;
  }
}
