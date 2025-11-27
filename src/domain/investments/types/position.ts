import type { BaseEntity, Currency } from "@/types/common";

export type AssetType =
  | "stock" // Ação
  | "fii" // Fundo Imobiliário (Brasil)
  | "reit" // Real Estate Investment Trust (Internacional)
  | "etf" // Exchange Traded Fund
  | "mutual_fund" // Fundo de Investimento
  | "bond" // Título/Renda Fixa
  | "crypto" // Criptomoeda
  | "commodity" // Commodity
  | "option" // Opção
  | "other"; // Outro

export interface Position extends BaseEntity {
  investmentAccountId: string; // Referência para a conta de investimento
  ticker: string; // Código do ativo (ex: AAPL, PETR4, BTC-USD)
  assetType: AssetType;
  assetName: string; // Nome do ativo (ex: "Apple Inc.", "Petrobras PN")
  quantity: number; // Quantidade de cotas/ações/unidades
  averagePrice: number; // Preço médio de compra (em centavos para consistência)
  currency: Currency;
  notes?: string; // Observações sobre a posição
}
