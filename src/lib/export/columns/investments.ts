import type { InvestmentAccount } from "@/domain/investments/types/investment-account";
import { csvFormatters } from "../csv-formatter";
import type { ExportColumn } from "../types";

export const investmentAccountColumns: ExportColumn<InvestmentAccount>[] = [
  { key: "name", header: "Nome" },
  { key: "broker", header: "Corretora" },
  { key: "accountNumber", header: "Numero Conta" },
  {
    key: "accountType",
    header: "Tipo",
    formatter: (v) => {
      const types: Record<string, string> = {
        broker: "Corretora",
        retirement_401k: "Aposentadoria 401(k)",
        retirement_ira: "Aposentadoria IRA",
        retirement_roth: "Roth IRA",
        retirement_pension: "Previdencia Privada",
        education_529: "Educacional 529",
      };
      return types[v as string] || String(v);
    },
  },
  { key: "currency", header: "Moeda" },
  { key: "archived", header: "Arquivado", formatter: csvFormatters.boolean },
  { key: "createdAt", header: "Criado em", formatter: csvFormatters.datetime },
];
