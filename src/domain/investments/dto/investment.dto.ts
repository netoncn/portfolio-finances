import type { Currency } from "@/types/common";
import type {
  AssetType,
  EarningType,
  InvestmentAccountType,
  InvestmentTransactionType,
} from "../types";

export interface CreateInvestmentAccountDTO {
  userId: string;
  name: string;
  broker: string;
  accountNumber?: string;
  accountType: InvestmentAccountType;
  currency: Currency;
}

export interface UpdateInvestmentAccountDTO {
  id: string;
  userId: string;
  name?: string;
  broker?: string;
  accountNumber?: string;
  accountType?: InvestmentAccountType;
  currency?: Currency;
}

export interface CreatePositionDTO {
  userId: string;
  investmentAccountId: string;
  ticker: string;
  assetType: AssetType;
  assetName: string;
  quantity: number;
  averagePrice: number; // in cents
  currency: Currency;
  notes?: string;
}

export interface UpdatePositionDTO {
  id: string;
  userId: string;
  investmentAccountId?: string;
  ticker?: string;
  assetType?: AssetType;
  assetName?: string;
  quantity?: number;
  averagePrice?: number; // in cents
  currency?: Currency;
  notes?: string;
}

export interface CreateInvestmentTransactionDTO {
  userId: string;
  investmentAccountId: string;
  positionId?: string;
  ticker?: string;
  transactionType: InvestmentTransactionType;
  quantity?: number;
  price?: number; // in cents
  amount: number; // in cents
  fees?: number; // in cents
  currency: Currency;
  date: number; // timestamp
  notes?: string;
}

export interface UpdateInvestmentTransactionDTO {
  id: string;
  userId: string;
  investmentAccountId?: string;
  positionId?: string;
  ticker?: string;
  transactionType?: InvestmentTransactionType;
  quantity?: number;
  price?: number; // in cents
  amount?: number; // in cents
  fees?: number; // in cents
  currency?: Currency;
  date?: number; // timestamp
  notes?: string;
}

export interface CreateEarningDTO {
  userId: string;
  investmentAccountId: string;
  positionId: string;
  ticker: string;
  earningType: EarningType;
  amount: number; // in cents
  amountPerShare?: number; // in cents
  quantity?: number;
  paymentDate: number; // timestamp
  exDate?: number; // timestamp
  recordDate?: number; // timestamp
  currency: Currency;
  taxWithheld?: number; // in cents
  notes?: string;
}

export interface UpdateEarningDTO {
  id: string;
  userId: string;
  investmentAccountId?: string;
  positionId?: string;
  ticker?: string;
  earningType?: EarningType;
  amount?: number; // in cents
  amountPerShare?: number; // in cents
  quantity?: number;
  paymentDate?: number; // timestamp
  exDate?: number; // timestamp
  recordDate?: number; // timestamp
  currency?: Currency;
  taxWithheld?: number; // in cents
  notes?: string;
}
