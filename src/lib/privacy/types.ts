export interface PrivacyConfig {
  /**
   * Enable data masking (default: true)
   */
  enableMasking: boolean;

  /**
   * Enable description truncation (default: true)
   */
  enableTruncation: boolean;

  /**
   * Enable redlines checking (default: true)
   */
  enableRedlines: boolean;

  /**
   * Maximum description length before truncation (default: 150)
   */
  maxDescriptionLength: number;

  /**
   * Custom redline patterns to block
   */
  customRedlines?: RegExp[];

  /**
   * Mask partial or full (default: 'partial')
   * - 'partial': Show last few characters (e.g., ***.***.789-**)
   * - 'full': Mask everything (e.g., [REDACTED])
   */
  maskingLevel: "partial" | "full";
}

/**
 * Pattern type for sensitive data detection
 */
export interface SensitiveDataPattern {
  name: string;
  pattern: RegExp;
  replacement: (match: string) => string;
  severity: "high" | "medium" | "low";
}

/**
 * Result of privacy sanitization
 */
export interface SanitizationResult {
  /**
   * Sanitized text
   */
  sanitized: string;

  /**
   * Original text (for logging/auditing)
   */
  original: string;

  /**
   * Whether any modifications were made
   */
  modified: boolean;

  /**
   * List of detected sensitive data types
   */
  detectedTypes: string[];

  /**
   * Redline violations found
   */
  redlineViolations: string[];
}

/**
 * Transaction data for privacy sanitization
 */
export interface TransactionPrivacyData {
  description: string;
  merchant?: string;
  tags?: string[];
}

/**
 * Chat message data for privacy sanitization
 */
export interface ChatMessagePrivacyData {
  content: string;
  role: "user" | "assistant" | "system";
}
