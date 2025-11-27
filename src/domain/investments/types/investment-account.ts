import type { BaseEntity, Currency } from "@/types/common";

export type InvestmentAccountType =
  | "broker" // Conta em corretora (padrão)
  | "retirement_401k" // Conta de aposentadoria 401(k)
  | "retirement_ira" // Conta de aposentadoria IRA
  | "retirement_roth" // Conta Roth IRA
  | "retirement_pension" // Previdência privada
  | "education_529"; // Conta educacional 529

export interface InvestmentAccount extends BaseEntity {
  name: string; // Nome da conta (ex: "Conta XP Investimentos")
  broker: string; // Nome da corretora/instituição (ex: "XP Investimentos")
  accountNumber?: string; // Número da conta (opcional, pode ser sensível)
  accountType: InvestmentAccountType;
  currency: Currency;
  archived?: boolean;
  archivedAt?: number;
}
