import type { Goal } from "@/domain/goals/types/goal";
import { csvFormatters } from "../csv-formatter";
import type { ExportColumn } from "../types";

export const goalColumns: ExportColumn<Goal>[] = [
  { key: "name", header: "Nome" },
  { key: "description", header: "Descricao" },
  { key: "targetAmount", header: "Meta", formatter: csvFormatters.currencyBRL },
  {
    key: "currentAmount",
    header: "Atual",
    formatter: csvFormatters.currencyBRL,
  },
  {
    key: "category",
    header: "Categoria",
    formatter: (v) => {
      const categories: Record<string, string> = {
        emergency_fund: "Fundo de Emergencia",
        vacation: "Viagem/Ferias",
        house: "Casa/Imovel",
        car: "Carro/Veiculo",
        education: "Educacao",
        retirement: "Aposentadoria",
        investment: "Investimento",
        debt_payoff: "Pagar Dividas",
        wedding: "Casamento",
        business: "Negocio",
        other: "Outro",
      };
      return categories[v as string] || String(v);
    },
  },
  {
    key: "priority",
    header: "Prioridade",
    formatter: (v) => {
      const priorities: Record<string, string> = {
        low: "Baixa",
        medium: "Media",
        high: "Alta",
      };
      return priorities[v as string] || String(v);
    },
  },
  {
    key: "status",
    header: "Status",
    formatter: (v) => {
      const statuses: Record<string, string> = {
        active: "Ativo",
        completed: "Concluido",
        canceled: "Cancelado",
        paused: "Pausado",
      };
      return statuses[v as string] || String(v);
    },
  },
  {
    key: "startDate",
    header: "Data Inicio",
    formatter: csvFormatters.localDate,
  },
  {
    key: "targetDate",
    header: "Data Meta",
    formatter: csvFormatters.localDate,
  },
  {
    key: "completedDate",
    header: "Data Conclusao",
    formatter: csvFormatters.localDate,
  },
  { key: "notes", header: "Observacoes" },
  { key: "createdAt", header: "Criado em", formatter: csvFormatters.datetime },
];
