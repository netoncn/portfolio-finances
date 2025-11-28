import type {
  PointsBalance,
  PointsOperation,
  PointsProgram,
} from "@/domain/points/types/points";
import { csvFormatters } from "../csv-formatter";
import type { ExportColumn } from "../types";

const programNameFormatter = (v: unknown) => {
  const programs: Record<string, string> = {
    livelo: "Livelo",
    esfera: "Esfera",
    iupp: "Iupp",
    smiles: "Smiles",
    latam_pass: "LATAM Pass",
    tudoazul: "TudoAzul",
    ame: "Ame",
    meli: "Mercado Livre",
    outro: "Outro",
  };
  return programs[v as string] || String(v);
};

export const pointsProgramColumns: ExportColumn<PointsProgram>[] = [
  { key: "program", header: "Programa", formatter: programNameFormatter },
  { key: "memberId", header: "Numero Membro" },
  {
    key: "linkedAccounts",
    header: "Contas Vinculadas",
    formatter: csvFormatters.array,
  },
  { key: "notes", header: "Observacoes" },
  { key: "createdAt", header: "Criado em", formatter: csvFormatters.datetime },
];

export const pointsBalanceColumns: ExportColumn<PointsBalance>[] = [
  { key: "programId", header: "Programa ID" },
  { key: "points", header: "Pontos" },
  { key: "earnedAt", header: "Data Ganho", formatter: csvFormatters.localDate },
  { key: "expiresAt", header: "Expira em", formatter: csvFormatters.localDate },
  {
    key: "source",
    header: "Origem",
    formatter: (v) => {
      const sources: Record<string, string> = {
        credit_card: "Cartao de Credito",
        partner: "Parceiro",
        promo: "Promocao",
        transfer: "Transferencia",
      };
      return sources[v as string] || String(v || "");
    },
  },
  { key: "promoTag", header: "Tag Promocao" },
  {
    key: "status",
    header: "Status",
    formatter: (v) => {
      const statuses: Record<string, string> = {
        active: "Ativo",
        redeemed: "Resgatado",
        expired: "Expirado",
      };
      return statuses[v as string] || String(v);
    },
  },
  { key: "createdAt", header: "Criado em", formatter: csvFormatters.datetime },
];

export const pointsOperationColumns: ExportColumn<PointsOperation>[] = [
  { key: "programId", header: "Programa ID" },
  { key: "date", header: "Data", formatter: csvFormatters.localDate },
  {
    key: "type",
    header: "Tipo",
    formatter: (v) => {
      const types: Record<string, string> = {
        earn: "Acumulo",
        redeem: "Resgate",
        transfer_in: "Transferencia Entrada",
        transfer_out: "Transferencia Saida",
        adjust: "Ajuste",
      };
      return types[v as string] || String(v);
    },
  },
  { key: "pointsDelta", header: "Pontos" },
  { key: "partnerOrAirline", header: "Parceiro/Cia Aerea" },
  { key: "rateOrBonus", header: "Taxa/Bonus" },
  { key: "notes", header: "Observacoes" },
  { key: "createdAt", header: "Criado em", formatter: csvFormatters.datetime },
];
