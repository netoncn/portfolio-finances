import type { Budget } from "@/domain/budgets/types/budget";
import { csvFormatters } from "../csv-formatter";
import type { ExportColumn } from "../types";

export const budgetColumns: ExportColumn<Budget>[] = [
  { key: "name", header: "Nome" },
  { key: "amount", header: "Orcamento", formatter: csvFormatters.currencyBRL },
  { key: "spent", header: "Gasto", formatter: csvFormatters.currencyBRL },
  {
    key: "period",
    header: "Periodo",
    formatter: (v) => {
      const periods: Record<string, string> = {
        monthly: "Mensal",
        yearly: "Anual",
        quarterly: "Trimestral",
        custom: "Personalizado",
      };
      return periods[v as string] || String(v);
    },
  },
  {
    key: "status",
    header: "Status",
    formatter: (v) => {
      const statuses: Record<string, string> = {
        active: "Ativo",
        inactive: "Inativo",
        completed: "Concluido",
      };
      return statuses[v as string] || String(v);
    },
  },
  {
    key: "alertThreshold",
    header: "Alerta (%)",
    formatter: csvFormatters.percentage,
  },
  {
    key: "startDate",
    header: "Data Inicio",
    formatter: csvFormatters.localDate,
  },
  { key: "endDate", header: "Data Fim", formatter: csvFormatters.localDate },
  { key: "categoryIds", header: "Categorias", formatter: csvFormatters.array },
  {
    key: "rollover",
    header: "Acumula Saldo",
    formatter: csvFormatters.boolean,
  },
  { key: "notes", header: "Observacoes" },
  { key: "createdAt", header: "Criado em", formatter: csvFormatters.datetime },
];
