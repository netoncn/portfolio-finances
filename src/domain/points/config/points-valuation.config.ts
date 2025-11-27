import type { PointsProgramName } from "../types/points";

export interface ProgramValuation {
  program: PointsProgramName;
  displayName: string;
  /** Minimum value per point in BRL */
  minValue: number;
  /** Average/typical value per point in BRL */
  avgValue: number;
  /** Maximum value per point in BRL (optimal redemption) */
  maxValue: number;
  /** Common redemption types for this program */
  bestRedemptions: string[];
  /** Typical points needed for R$1 */
  pointsPerReal: number;
  /** Last updated date */
  lastUpdated: string;
}

export const PROGRAM_VALUATIONS: Record<PointsProgramName, ProgramValuation> = {
  livelo: {
    program: "livelo",
    displayName: "Livelo",
    minValue: 0.005, // R$0,005 per point
    avgValue: 0.012, // R$0,012 per point
    maxValue: 0.025, // R$0,025 per point (with bonuses)
    bestRedemptions: ["Passagens aéreas", "Transferência com bônus"],
    pointsPerReal: 83, // ~83 pontos = R$1
    lastUpdated: "2025-01",
  },
  esfera: {
    program: "esfera",
    displayName: "Esfera",
    minValue: 0.004,
    avgValue: 0.01,
    maxValue: 0.02,
    bestRedemptions: ["Passagens aéreas", "Milhas parceiras"],
    pointsPerReal: 100,
    lastUpdated: "2025-01",
  },
  iupp: {
    program: "iupp",
    displayName: "iupp",
    minValue: 0.005,
    avgValue: 0.01,
    maxValue: 0.015,
    bestRedemptions: ["Produtos Itaú", "Cashback"],
    pointsPerReal: 100,
    lastUpdated: "2025-01",
  },
  smiles: {
    program: "smiles",
    displayName: "Smiles",
    minValue: 0.015,
    avgValue: 0.025,
    maxValue: 0.05,
    bestRedemptions: ["Voos GOL", "Smiles & Money"],
    pointsPerReal: 40,
    lastUpdated: "2025-01",
  },
  latam_pass: {
    program: "latam_pass",
    displayName: "LATAM Pass",
    minValue: 0.012,
    avgValue: 0.022,
    maxValue: 0.045,
    bestRedemptions: ["Voos LATAM", "Upgrade de cabine"],
    pointsPerReal: 45,
    lastUpdated: "2025-01",
  },
  tudoazul: {
    program: "tudoazul",
    displayName: "TudoAzul",
    minValue: 0.01,
    avgValue: 0.02,
    maxValue: 0.04,
    bestRedemptions: ["Voos Azul", "Milhas parceiras"],
    pointsPerReal: 50,
    lastUpdated: "2025-01",
  },
  ame: {
    program: "ame",
    displayName: "Ame",
    minValue: 0.01,
    avgValue: 0.01,
    maxValue: 0.01,
    bestRedemptions: ["Cashback Americanas", "Compras no app"],
    pointsPerReal: 100,
    lastUpdated: "2025-01",
  },
  meli: {
    program: "meli",
    displayName: "Mercado Pontos",
    minValue: 0.008,
    avgValue: 0.01,
    maxValue: 0.012,
    bestRedemptions: ["Descontos ML", "Cupons"],
    pointsPerReal: 100,
    lastUpdated: "2025-01",
  },
  outro: {
    program: "outro",
    displayName: "Outro",
    minValue: 0.005,
    avgValue: 0.01,
    maxValue: 0.015,
    bestRedemptions: ["Variável"],
    pointsPerReal: 100,
    lastUpdated: "2025-01",
  },
};

export function getProgramValuation(
  program: PointsProgramName,
): ProgramValuation {
  return PROGRAM_VALUATIONS[program];
}

export function calculatePointsValue(
  program: PointsProgramName,
  points: number,
  method: "min" | "avg" | "max" = "avg",
): number {
  const valuation = PROGRAM_VALUATIONS[program];
  const valuePerPoint =
    method === "min"
      ? valuation.minValue
      : method === "max"
        ? valuation.maxValue
        : valuation.avgValue;

  return points * valuePerPoint;
}

export interface PointsVsCashRecommendation {
  usePoints: boolean;
  confidence: "high" | "medium" | "low";
  reason: string;
  pointsValue: {
    min: number;
    avg: number;
    max: number;
  };
  cashPrice: number;
  savingsOrLoss: number;
  percentageGainLoss: number;
  effectiveValuePerPoint: number;
  avgValuePerPoint: number;
  isGoodValue: boolean;
}

export function calculatePointsVsCash(
  program: PointsProgramName,
  pointsRequired: number,
  cashPrice: number,
): PointsVsCashRecommendation {
  const valuation = PROGRAM_VALUATIONS[program];

  const pointsValueMin = pointsRequired * valuation.minValue;
  const pointsValueAvg = pointsRequired * valuation.avgValue;
  const pointsValueMax = pointsRequired * valuation.maxValue;

  const effectiveValuePerPoint = cashPrice / pointsRequired;

  const savingsOrLoss = pointsValueAvg - cashPrice;
  const percentageGainLoss = ((pointsValueAvg - cashPrice) / cashPrice) * 100;

  const isGoodValue = effectiveValuePerPoint >= valuation.avgValue;

  let usePoints = false;
  let confidence: "high" | "medium" | "low" = "medium";
  let reason = "";

  if (effectiveValuePerPoint >= valuation.maxValue) {
    usePoints = true;
    confidence = "high";
    reason =
      "Excelente uso! Você está obtendo valor acima da média do programa.";
  } else if (effectiveValuePerPoint >= valuation.avgValue) {
    // Good redemption - above average
    usePoints = true;
    confidence = "high";
    reason = "Bom uso dos pontos. O valor está acima da média do programa.";
  } else if (effectiveValuePerPoint >= valuation.minValue * 1.5) {
    // Acceptable redemption - between min and avg
    usePoints = true;
    confidence = "medium";
    reason = "Uso razoável. Considere aguardar uma promoção para melhor valor.";
  } else if (effectiveValuePerPoint >= valuation.minValue) {
    // Poor redemption - near minimum
    usePoints = false;
    confidence = "medium";
    reason =
      "Valor abaixo da média. Recomendamos guardar os pontos para melhor oportunidade.";
  } else {
    // Very poor redemption - below minimum
    usePoints = false;
    confidence = "high";
    reason =
      "Não recomendado! O valor está muito abaixo do potencial dos seus pontos.";
  }

  return {
    usePoints,
    confidence,
    reason,
    pointsValue: {
      min: pointsValueMin,
      avg: pointsValueAvg,
      max: pointsValueMax,
    },
    cashPrice,
    savingsOrLoss,
    percentageGainLoss,
    effectiveValuePerPoint,
    avgValuePerPoint: valuation.avgValue,
    isGoodValue,
  };
}

export function getProgramsByValue(): ProgramValuation[] {
  return Object.values(PROGRAM_VALUATIONS).sort(
    (a, b) => b.avgValue - a.avgValue,
  );
}
