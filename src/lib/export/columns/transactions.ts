import type { Transaction } from "@/domain/transactions/types/transaction";
import { csvFormatters } from "../csv-formatter";
import type { ExportColumn } from "../types";

export const transactionColumns: ExportColumn<Transaction>[] = [
  { key: "date", header: "Data", formatter: csvFormatters.localDate },
  { key: "description", header: "Descricao" },
  { key: "merchant", header: "Estabelecimento" },
  { key: "amount", header: "Valor", formatter: csvFormatters.currencyBRL },
  {
    key: "type",
    header: "Tipo",
    formatter: (v) => {
      const types: Record<string, string> = {
        expense: "Despesa",
        income: "Receita",
        transfer: "Transferencia",
      };
      return types[v as string] || String(v);
    },
  },
  {
    key: "accountType",
    header: "Tipo de Conta",
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
  { key: "cardBrand", header: "Bandeira" },
  { key: "categoryId", header: "Categoria ID" },
  { key: "tags", header: "Tags", formatter: csvFormatters.array },
  {
    key: "status",
    header: "Status",
    formatter: (v) => {
      const statuses: Record<string, string> = {
        scheduled: "Agendado",
        posted: "Lancado",
        paid: "Pago",
        canceled: "Cancelado",
        refunded: "Estornado",
      };
      return statuses[v as string] || String(v || "");
    },
  },
  { key: "installmentNumber", header: "Parcela" },
  { key: "installmentCount", header: "Total Parcelas" },
  {
    key: "purchaseDate",
    header: "Data Compra",
    formatter: csvFormatters.localDate,
  },
  { key: "dueDate", header: "Vencimento", formatter: csvFormatters.localDate },
  { key: "statementMonth", header: "Fatura" },
  { key: "createdAt", header: "Criado em", formatter: csvFormatters.datetime },
];
