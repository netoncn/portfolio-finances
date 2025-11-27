import type { BaseEntity, Currency } from "@/types/common";

export type InvestmentTransactionType =
  | "buy" // Compra
  | "sell" // Venda
  | "dividend" // Dividendo
  | "jcp" // Juros sobre Capital Próprio
  | "interest" // Juros/Rendimento
  | "fee" // Taxa/Corretagem
  | "deposit" // Depósito (aporte)
  | "withdrawal" // Retirada (resgate)
  | "transfer_in" // Transferência recebida
  | "transfer_out" // Transferência enviada
  | "split" // Desdobramento
  | "reverse_split" // Agrupamento
  | "bonus" // Bonificação
  | "other"; // Outro

export interface InvestmentTransaction extends BaseEntity {
  investmentAccountId: string; // Conta de investimento
  positionId?: string; // Posição relacionada (opcional, para compra/venda)
  ticker?: string; // Código do ativo (para transações relacionadas a ativos)
  transactionType: InvestmentTransactionType;
  quantity?: number; // Quantidade (para compra/venda/split/etc)
  price?: number; // Preço unitário em centavos (para compra/venda)
  amount: number; // Valor total em centavos (pode ser negativo para saídas)
  fees?: number; // Taxas em centavos
  currency: Currency;
  date: number; // Timestamp da transação
  notes?: string; // Observações
}
