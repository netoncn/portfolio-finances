import type { SensitiveDataPattern } from "./types";

/**
 * Sensitive data patterns for detection and masking
 */

/**
 * Mask email address
 * Example: john.doe@example.com → j***.doe@example.com
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;

  const maskedLocal =
    local.length <= 2
      ? "***"
      : `${local[0]}***${local.length > 3 ? local.slice(-1) : ""}`;

  return `${maskedLocal}@${domain}`;
}

/**
 * Mask phone number
 * Example: (11) 98765-4321 → (11) ****-4321
 */
function maskPhone(phone: string): string {
  // Keep area code and last 4 digits
  return phone.replace(/(\d{2,3})\D*(\d{4,5})\D*(\d{4})/, "($1) ****-$3");
}

/**
 * Mask CPF (Brazilian tax ID)
 * Example: 123.456.789-00 → ***.456.***-**
 */
function maskCPF(cpf: string): string {
  return cpf.replace(/(\d{3})\D*(\d{3})\D*(\d{3})\D*(\d{2})/, "***.$2.***-**");
}

/**
 * Mask credit card number
 * Example: 1234 5678 9012 3456 → **** **** **** 3456
 */
function maskCreditCard(card: string): string {
  return card.replace(
    /(\d{4})\D*(\d{4})\D*(\d{4})\D*(\d{4})/,
    "**** **** **** $4",
  );
}

/**
 * Mask SSN (Social Security Number)
 * Example: 123-45-6789 → ***-**-6789
 */
function maskSSN(ssn: string): string {
  return ssn.replace(/(\d{3})\D*(\d{2})\D*(\d{4})/, "***-**-$3");
}

/**
 * Mask street number in address
 * Example: Rua das Flores, 123 → Rua das Flores, ***
 */
function maskAddress(address: string): string {
  // Mask street numbers
  return address.replace(/,?\s*\d{1,6}\s*[A-Za-z]?(?=\s|,|$)/g, ", ***");
}

/**
 * Mask bank account number
 * Example: 12345-6 → ****5-*
 */
function maskBankAccount(account: string): string {
  return account.replace(/(\d+)(-?\d)/, (_, digits, check) => {
    const last = digits.slice(-1);
    return `${"*".repeat(4)}${last}${check ? "-*" : ""}`;
  });
}

/**
 * Built-in sensitive data patterns
 */
export const SENSITIVE_DATA_PATTERNS: SensitiveDataPattern[] = [
  {
    name: "email",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: maskEmail,
    severity: "medium",
  },
  {
    name: "phone_br",
    pattern: /\(?\d{2}\)?\s?\d{4,5}-?\d{4}/g,
    replacement: maskPhone,
    severity: "medium",
  },
  {
    name: "phone_us",
    pattern: /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    replacement: maskPhone,
    severity: "medium",
  },
  {
    name: "cpf",
    pattern: /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g,
    replacement: maskCPF,
    severity: "high",
  },
  {
    name: "ssn",
    pattern: /\d{3}-?\d{2}-?\d{4}/g,
    replacement: maskSSN,
    severity: "high",
  },
  {
    name: "credit_card",
    pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    replacement: maskCreditCard,
    severity: "high",
  },
  {
    name: "address_number",
    pattern:
      /\b(Rua|Av|Avenida|Alameda|Travessa|Praça|R\.|Av\.)([^,\n]+),?\s*\d{1,6}\s*[A-Za-z]?/gi,
    replacement: maskAddress,
    severity: "low",
  },
  {
    name: "bank_account",
    pattern: /\b\d{4,8}-?\d\b/g,
    replacement: maskBankAccount,
    severity: "high",
  },
];

/**
 * Redline patterns - Terms that should be completely blocked
 */
export const REDLINE_PATTERNS: RegExp[] = [
  // Passwords and secrets
  /\b(password|senha|secret|token|api[_-]?key|private[_-]?key)\s*[:=]\s*\S+/gi,

  // Full bank account with routing
  /\b(conta|account)\s*[:=]?\s*\d{5,}\s*(ag[êe]ncia|routing)\s*[:=]?\s*\d{4,}/gi,

  // Medical/health identifiers
  /\b(prontu[áa]rio|medical[_-]?record|patient[_-]?id)\s*[:=]?\s*\S+/gi,

  // Government IDs with context
  /\b(rg|identidade|passport|driver[_-]?license)\s*[:=]?\s*\S+/gi,

  // Security questions/answers
  /\b(security[_-]?question|mother[''']s[_-]?maiden[_-]?name)\s*[:=]?\s*\S+/gi,
];

/**
 * Get all pattern names
 */
export function getPatternNames(): string[] {
  return SENSITIVE_DATA_PATTERNS.map((p) => p.name);
}

/**
 * Get patterns by severity
 */
export function getPatternsBySeverity(
  severity: "high" | "medium" | "low",
): SensitiveDataPattern[] {
  return SENSITIVE_DATA_PATTERNS.filter((p) => p.severity === severity);
}
