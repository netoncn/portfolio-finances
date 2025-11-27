import type { BaseEntity, Currency } from "@/types/common";

export type EarningType =
  | "dividend" // Dividendo
  | "jcp" // Juros sobre Capital Próprio
  | "interest" // Juros/Rendimento de renda fixa
  | "capital_gain" // Ganho de capital distribuído
  | "return_of_capital" // Retorno de capital
  | "rent" // Aluguel (FIIs)
  | "amortization" // Amortização
  | "other"; // Outro

export interface Earning extends BaseEntity {
  investmentAccountId: string; // Conta de investimento
  positionId: string; // Posição relacionada
  ticker: string; // Código do ativo
  earningType: EarningType;
  amount: number; // Valor recebido em centavos
  amountPerShare?: number; // Valor por ação/cota em centavos (opcional)
  quantity?: number; // Quantidade de ações/cotas que receberam o provento
  paymentDate: number; // Data do pagamento (timestamp)
  exDate?: number; // Data ex-dividendo (timestamp, opcional)
  recordDate?: number; // Data de registro (timestamp, opcional)
  currency: Currency;
  taxWithheld?: number; // Imposto retido na fonte em centavos (opcional)
  notes?: string; // Observações
}
