import type { Account } from "@/domain/accounts/types/account";
import { csvFormatters } from "../csv-formatter";
import type { ExportColumn } from "../types";

export const accountColumns: ExportColumn<Account>[] = [
  { key: "name", header: "Nome" },
  {
    key: "accountType",
    header: "Tipo",
    formatter: (v) => {
      const types: Record<string, string> = {
        card_credit: "Cartao de Credito",
        card_debit: "Cartao de Debito",
        prepaid: "Pre-pago",
        wallet_cash: "Carteira/Dinheiro",
        bank_checking: "Conta Corrente",
        bank_savings: "Poupanca",
      };
      return types[v as string] || String(v);
    },
  },
  { key: "issuer", header: "Emissor" },
  { key: "cardBrand", header: "Bandeira" },
  { key: "last4", header: "Ultimos 4 digitos" },
  { key: "currency", header: "Moeda" },
  { key: "billing.closingDay", header: "Dia Fechamento" },
  { key: "billing.dueDay", header: "Dia Vencimento" },
  {
    key: "billing.creditLimit",
    header: "Limite",
    formatter: csvFormatters.currencyBRL,
  },
  {
    key: "billing.availableCredit",
    header: "Limite Disponivel",
    formatter: csvFormatters.currencyBRL,
  },
  { key: "benefits.cashback", header: "Cashback %" },
  { key: "benefits.fxFee", header: "Taxa Cambio %" },
  {
    key: "benefits.lounge",
    header: "Acesso Sala VIP",
    formatter: csvFormatters.boolean,
  },
  { key: "benefits.airline", header: "Cia Aerea" },
  { key: "archived", header: "Arquivado", formatter: csvFormatters.boolean },
  { key: "createdAt", header: "Criado em", formatter: csvFormatters.datetime },
];
