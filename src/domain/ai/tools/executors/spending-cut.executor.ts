import "server-only";

import { CategoryService } from "@/domain/categories/services/category.service";
import { TransactionService } from "@/domain/transactions/services/transaction.service";
import type {
  AllToolName,
  ToolExecutionContext,
  ToolResult,
} from "../base.types";
import { formatMoney } from "../base.types";
import type {
  CategoryCutRecommendation,
  CutPriority,
  CutRisk,
  GetSpendingCutPlanInput,
  GetSpendingCutPlanOutput,
  SpendingCutPattern,
  TimelineAction,
  TimelinePhase,
} from "../spending-cut.tools";

// Keywords to identify essential categories (lower priority for cuts)
const ESSENTIAL_CATEGORY_KEYWORDS = [
  "moradia",
  "aluguel",
  "housing",
  "rent",
  "mortgage",
  "hipoteca",
  "condomínio",
  "condominio",
  "água",
  "agua",
  "water",
  "luz",
  "energia",
  "electricity",
  "gás",
  "gas",
  "internet",
  "telefone",
  "phone",
  "saúde",
  "saude",
  "health",
  "médico",
  "medico",
  "remédio",
  "remedio",
  "medicine",
  "pharmacy",
  "farmácia",
  "farmacia",
  "educação",
  "educacao",
  "education",
  "escola",
  "school",
  "faculdade",
  "transporte",
  "transport",
  "combustível",
  "combustivel",
  "fuel",
  "supermercado",
  "mercado",
  "grocery",
  "alimentação",
  "alimentacao",
  "food",
];

// Keywords to identify discretionary/reducible categories
const DISCRETIONARY_CATEGORY_KEYWORDS = [
  "lazer",
  "entertainment",
  "restaurante",
  "restaurant",
  "delivery",
  "ifood",
  "uber eats",
  "streaming",
  "netflix",
  "spotify",
  "assinatura",
  "subscription",
  "shopping",
  "compras",
  "roupa",
  "clothes",
  "vestuário",
  "vestuario",
  "eletrônicos",
  "eletronicos",
  "electronics",
  "games",
  "jogos",
  "viagem",
  "travel",
  "hotel",
  "bar",
  "café",
  "cafe",
  "coffee",
  "hobby",
  "hobbies",
  "beleza",
  "beauty",
  "salão",
  "salao",
  "academia",
  "gym",
];

function isEssentialCategory(categoryName: string): boolean {
  const lowerName = categoryName.toLowerCase();
  return ESSENTIAL_CATEGORY_KEYWORDS.some((keyword) =>
    lowerName.includes(keyword.toLowerCase()),
  );
}

function isDiscretionaryCategory(categoryName: string): boolean {
  const lowerName = categoryName.toLowerCase();
  return DISCRETIONARY_CATEGORY_KEYWORDS.some((keyword) =>
    lowerName.includes(keyword.toLowerCase()),
  );
}

function calculateTrend(monthlySpending: number[]): "up" | "down" | "stable" {
  if (monthlySpending.length < 2) return "stable";

  const recent = monthlySpending.slice(-2);
  const older = monthlySpending.slice(0, -2);

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg =
    older.length > 0
      ? older.reduce((a, b) => a + b, 0) / older.length
      : recentAvg;

  const changePercent = ((recentAvg - olderAvg) / (olderAvg || 1)) * 100;

  if (changePercent > 10) return "up";
  if (changePercent < -10) return "down";
  return "stable";
}

function determinePriority(
  isEssential: boolean,
  trend: "up" | "down" | "stable",
  spendingPercent: number,
): CutPriority {
  if (!isEssential && spendingPercent > 15) return "high";
  if (!isEssential && trend === "up") return "high";
  if (!isEssential) return "medium";
  if (isEssential && spendingPercent > 25) return "medium";
  return "low";
}

function determineRisk(
  isEssential: boolean,
  reductionPercent: number,
): CutRisk {
  if (isEssential) {
    if (reductionPercent > 20) return "aggressive";
    if (reductionPercent > 10) return "moderate";
    return "safe";
  }
  if (reductionPercent > 40) return "aggressive";
  if (reductionPercent > 25) return "moderate";
  return "safe";
}

function generateActionItems(
  categoryName: string,
  _isEssential: boolean,
  reductionPercent: number,
): string[] {
  const actions: string[] = [];
  const lowerName = categoryName.toLowerCase();

  if (lowerName.includes("restaurante") || lowerName.includes("delivery")) {
    actions.push("Cozinhar mais em casa durante a semana");
    actions.push("Limitar pedidos de delivery a 1-2 vezes por semana");
    actions.push("Substituir restaurantes por marmitas preparadas");
  } else if (
    lowerName.includes("streaming") ||
    lowerName.includes("assinatura")
  ) {
    actions.push("Revisar assinaturas não utilizadas");
    actions.push("Considerar planos compartilhados");
    actions.push("Cancelar serviços redundantes");
  } else if (
    lowerName.includes("lazer") ||
    lowerName.includes("entertainment")
  ) {
    actions.push("Buscar alternativas gratuitas de entretenimento");
    actions.push("Estabelecer um limite mensal para lazer");
    actions.push("Planejar atividades com antecedência para melhores preços");
  } else if (lowerName.includes("compras") || lowerName.includes("shopping")) {
    actions.push("Criar lista de compras e seguir rigorosamente");
    actions.push("Aguardar 48h antes de compras não essenciais");
    actions.push("Comparar preços antes de comprar");
  } else if (
    lowerName.includes("supermercado") ||
    lowerName.includes("mercado")
  ) {
    actions.push("Fazer lista de compras semanal");
    actions.push("Aproveitar promoções e comparar preços");
    actions.push("Evitar compras por impulso");
    actions.push("Considerar marcas próprias dos mercados");
  } else if (
    lowerName.includes("transporte") ||
    lowerName.includes("combustível")
  ) {
    actions.push("Considerar caronas compartilhadas");
    actions.push("Planejar rotas mais eficientes");
    actions.push("Avaliar transporte público quando possível");
  } else {
    if (reductionPercent > 20) {
      actions.push(`Revisar todos os gastos de ${categoryName}`);
      actions.push("Identificar despesas que podem ser eliminadas");
    }
    actions.push(`Estabelecer limite mensal para ${categoryName}`);
    actions.push("Monitorar gastos semanalmente");
  }

  return actions.slice(0, 3); // Return max 3 actions
}

function generateRiskWarning(
  categoryName: string,
  isEssential: boolean,
  reductionPercent: number,
): string | undefined {
  if (!isEssential && reductionPercent < 30) return undefined;

  if (isEssential) {
    if (reductionPercent > 20) {
      return `Atenção: ${categoryName} é uma categoria essencial. Cortes agressivos podem afetar qualidade de vida.`;
    }
    return `${categoryName} é uma despesa essencial. Reduza com cuidado.`;
  }

  if (reductionPercent > 40) {
    return `Corte de ${reductionPercent}% é agressivo. Implemente gradualmente para evitar frustração.`;
  }

  return undefined;
}

function generateRationale(
  categoryName: string,
  isEssential: boolean,
  trend: "up" | "down" | "stable",
  spendingPercent: number,
): string {
  const reasons: string[] = [];

  if (!isEssential) {
    reasons.push("categoria discricionária");
  }

  if (trend === "up") {
    reasons.push("tendência de aumento nos últimos meses");
  }

  if (spendingPercent > 15) {
    reasons.push(`representa ${spendingPercent.toFixed(0)}% dos gastos totais`);
  }

  if (reasons.length === 0) {
    return `Oportunidade de redução em ${categoryName} sem impacto significativo.`;
  }

  return `Selecionado para corte devido a: ${reasons.join(", ")}.`;
}

function getPhaseLabel(phase: TimelinePhase): string {
  const labels: Record<TimelinePhase, string> = {
    immediate: "Imediato",
    "30_days": "30 dias",
    "60_days": "60 dias",
    "90_days": "90 dias",
  };
  return labels[phase];
}

export async function executeInsightTool(
  context: ToolExecutionContext,
  toolName: AllToolName,
  input: Record<string, unknown>,
): Promise<ToolResult<unknown>> {
  try {
    switch (toolName) {
      case "get_spending_cut_plan":
        return await getSpendingCutPlan(
          context,
          input as GetSpendingCutPlanInput,
        );

      default:
        return { success: false, error: `Unknown insight tool: ${toolName}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function getSpendingCutPlan(
  context: ToolExecutionContext,
  input: GetSpendingCutPlanInput,
): Promise<ToolResult<GetSpendingCutPlanOutput>> {
  const targetPercent = input.targetSavingsPercent || 15;
  const analysisMonths = input.analysisMonths || 3;
  const includeTimeline = input.includeTimeline !== false;

  const categories = await CategoryService.listByUser(context.userId);
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const now = new Date();
  const startDate = new Date(
    now.getFullYear(),
    now.getMonth() - analysisMonths,
    1,
  ).getTime();
  const endDate = now.getTime();

  const transactions = await TransactionService.listByDateRange(
    context.userId,
    startDate,
    endDate,
  );

  const expenses = transactions.filter((tx) => tx.type === "expense");

  const categoryMonthlySpending = new Map<
    string,
    {
      total: number;
      months: Map<string, number>;
      categoryName: string;
      icon?: string;
    }
  >();

  for (const tx of expenses) {
    const categoryId = tx.categoryId || "uncategorized";
    const category = categoryMap.get(categoryId);
    const categoryName = category?.name || "Não categorizado";
    const month = new Date(tx.date).toISOString().slice(0, 7);

    const existing = categoryMonthlySpending.get(categoryId) || {
      total: 0,
      months: new Map<string, number>(),
      categoryName,
      icon: category?.icon,
    };

    existing.total += Math.abs(tx.amount);
    existing.months.set(
      month,
      (existing.months.get(month) || 0) + Math.abs(tx.amount),
    );
    categoryMonthlySpending.set(categoryId, existing);
  }

  const totalSpending = Array.from(categoryMonthlySpending.values()).reduce(
    (sum, cat) => sum + cat.total,
    0,
  );
  const avgMonthlySpending = totalSpending / analysisMonths;

  let targetSavings: number;
  if (input.targetSavingsAmount) {
    targetSavings = input.targetSavingsAmount;
  } else {
    targetSavings = Math.round(avgMonthlySpending * (targetPercent / 100));
  }

  const recommendations: CategoryCutRecommendation[] = [];
  let achievedSavings = 0;

  const sortedCategories = Array.from(categoryMonthlySpending.entries())
    .filter(([categoryId]) => {
      if (input.excludeCategoryIds?.includes(categoryId)) return false;
      if (
        input.focusCategoryIds &&
        !input.focusCategoryIds.includes(categoryId)
      )
        return false;
      return true;
    })
    .sort((a, b) => b[1].total - a[1].total);

  const highSpendingCategories: string[] = [];
  const increasingCategories: string[] = [];
  const reducibleCategories: string[] = [];

  for (const [categoryId, data] of sortedCategories) {
    const avgSpending = data.total / analysisMonths;
    const spendingPercent = (avgSpending / avgMonthlySpending) * 100;
    const monthlyValues = Array.from(data.months.values());
    const trend = calculateTrend(monthlyValues);
    const isEssential = isEssentialCategory(data.categoryName);
    const isDiscretionary = isDiscretionaryCategory(data.categoryName);

    if (spendingPercent > 15) {
      highSpendingCategories.push(data.categoryName);
    }
    if (trend === "up") {
      increasingCategories.push(data.categoryName);
    }
    if (isDiscretionary || (!isEssential && spendingPercent > 5)) {
      reducibleCategories.push(data.categoryName);
    }

    if (spendingPercent < 2) continue;

    let reductionPercent: number;
    if (isEssential) {
      reductionPercent = Math.min(10, targetPercent * 0.5);
    } else if (isDiscretionary) {
      reductionPercent = Math.min(35, targetPercent * 1.5);
    } else {
      reductionPercent = Math.min(25, targetPercent);
    }

    const remainingTarget = targetSavings - achievedSavings;
    if (remainingTarget <= 0) {
      reductionPercent = Math.min(reductionPercent, 5); // Minimal cuts
    }

    const potentialSavings = Math.round(avgSpending * (reductionPercent / 100));
    const recommendedSpending = avgSpending - potentialSavings;

    const priority = determinePriority(isEssential, trend, spendingPercent);
    const risk = determineRisk(isEssential, reductionPercent);

    recommendations.push({
      categoryId,
      categoryName: data.categoryName,
      categoryIcon: data.icon,
      currentSpending: formatMoney(Math.round(avgSpending)),
      recommendedSpending: formatMoney(Math.round(recommendedSpending)),
      potentialSavings: formatMoney(Math.round(potentialSavings)),
      reductionPercent: Math.round(reductionPercent),
      priority,
      risk,
      rationale: generateRationale(
        data.categoryName,
        isEssential,
        trend,
        spendingPercent,
      ),
      actionItems: generateActionItems(
        data.categoryName,
        isEssential,
        reductionPercent,
      ),
      riskWarning: generateRiskWarning(
        data.categoryName,
        isEssential,
        reductionPercent,
      ),
      trend,
      isEssential,
    });

    achievedSavings += potentialSavings;
  }

  const priorityOrder: Record<CutPriority, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };
  recommendations.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );

  const totalPotentialSavings = recommendations.reduce(
    (sum, r) => sum + r.potentialSavings.value,
    0,
  );
  const savingsPercent = (totalPotentialSavings / avgMonthlySpending) * 100;

  const aggressiveCount = recommendations.filter(
    (r) => r.risk === "aggressive",
  ).length;
  const moderateCount = recommendations.filter(
    (r) => r.risk === "moderate",
  ).length;
  let overallRisk: CutRisk = "safe";
  if (aggressiveCount > 2 || savingsPercent > 30) {
    overallRisk = "aggressive";
  } else if (aggressiveCount > 0 || moderateCount > 3 || savingsPercent > 20) {
    overallRisk = "moderate";
  }

  const confidenceScore = Math.min(
    95,
    Math.max(
      50,
      70 +
        (analysisMonths >= 3 ? 10 : 0) +
        (expenses.length > 50 ? 10 : 0) +
        (recommendations.length >= 5 ? 5 : 0),
    ),
  );

  let timeline: TimelineAction[] | undefined;
  if (includeTimeline && recommendations.length > 0) {
    const highPriority = recommendations.filter((r) => r.priority === "high");
    const mediumPriority = recommendations.filter(
      (r) => r.priority === "medium",
    );
    const lowPriority = recommendations.filter((r) => r.priority === "low");

    timeline = [];
    let cumulativeSavings = 0;

    const immediateActions = highPriority
      .filter((r) => r.risk === "safe")
      .slice(0, 3);
    if (immediateActions.length > 0) {
      const immediateSavings = immediateActions.reduce(
        (sum, r) => sum + r.potentialSavings.value,
        0,
      );
      cumulativeSavings += immediateSavings;
      timeline.push({
        phase: "immediate",
        phaseLabel: getPhaseLabel("immediate"),
        actions: immediateActions.map((r) => ({
          description:
            r.actionItems[0] || `Reduzir gastos em ${r.categoryName}`,
          categoryName: r.categoryName,
          expectedSavings: r.potentialSavings,
        })),
        cumulativeSavings: formatMoney(cumulativeSavings),
      });
    }

    const thirtyDayActions = [
      ...highPriority.filter((r) => r.risk !== "safe").slice(0, 2),
      ...mediumPriority.slice(0, 2),
    ];
    if (thirtyDayActions.length > 0) {
      const thirtySavings = thirtyDayActions.reduce(
        (sum, r) => sum + r.potentialSavings.value,
        0,
      );
      cumulativeSavings += thirtySavings;
      timeline.push({
        phase: "30_days",
        phaseLabel: getPhaseLabel("30_days"),
        actions: thirtyDayActions.map((r) => ({
          description:
            r.actionItems[0] || `Implementar redução em ${r.categoryName}`,
          categoryName: r.categoryName,
          expectedSavings: r.potentialSavings,
        })),
        cumulativeSavings: formatMoney(cumulativeSavings),
      });
    }

    const sixtyDayActions = mediumPriority.slice(2, 5);
    if (sixtyDayActions.length > 0) {
      const sixtySavings = sixtyDayActions.reduce(
        (sum, r) => sum + r.potentialSavings.value,
        0,
      );
      cumulativeSavings += sixtySavings;
      timeline.push({
        phase: "60_days",
        phaseLabel: getPhaseLabel("60_days"),
        actions: sixtyDayActions.map((r) => ({
          description: r.actionItems[0] || `Otimizar ${r.categoryName}`,
          categoryName: r.categoryName,
          expectedSavings: r.potentialSavings,
        })),
        cumulativeSavings: formatMoney(cumulativeSavings),
      });
    }

    if (lowPriority.length > 0) {
      const ninetyDayActions = lowPriority.slice(0, 3);
      const ninetySavings = ninetyDayActions.reduce(
        (sum, r) => sum + r.potentialSavings.value,
        0,
      );
      cumulativeSavings += ninetySavings;
      timeline.push({
        phase: "90_days",
        phaseLabel: getPhaseLabel("90_days"),
        actions: ninetyDayActions.map((r) => ({
          description: r.actionItems[0] || `Ajuste fino em ${r.categoryName}`,
          categoryName: r.categoryName,
          expectedSavings: r.potentialSavings,
        })),
        cumulativeSavings: formatMoney(cumulativeSavings),
      });
    }
  }

  const merchantCounts = new Map<
    string,
    { count: number; totalAmount: number }
  >();
  for (const tx of expenses) {
    if (tx.merchant) {
      const existing = merchantCounts.get(tx.merchant) || {
        count: 0,
        totalAmount: 0,
      };
      existing.count++;
      existing.totalAmount += Math.abs(tx.amount);
      merchantCounts.set(tx.merchant, existing);
    }
  }

  const recurringExpenses = Array.from(merchantCounts.entries())
    .filter(([_, data]) => data.count >= analysisMonths) // Appears at least once per month
    .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
    .slice(0, 5)
    .map(([description, data]) => ({
      description,
      amount: formatMoney(Math.round(data.totalAmount / analysisMonths)),
      frequency: "monthly" as const,
    }));

  const patterns: SpendingCutPattern = {
    highSpendingCategories: highSpendingCategories.slice(0, 5),
    increasingCategories: increasingCategories.slice(0, 5),
    reducibleCategories: reducibleCategories.slice(0, 5),
    recurringExpenses,
  };

  const avgSavingsPerCategory =
    recommendations.length > 0
      ? Math.round(totalPotentialSavings / recommendations.length)
      : 0;
  const highestCategorySavings =
    recommendations.length > 0
      ? Math.max(...recommendations.map((r) => r.potentialSavings.value))
      : 0;

  const generalTips = [
    "Revise suas assinaturas e serviços recorrentes mensalmente",
    "Estabeleça metas semanais de gastos para acompanhar melhor",
    "Use a regra 50/30/20: 50% necessidades, 30% desejos, 20% poupança",
    "Antes de comprar, pergunte: 'Isso é necessário agora?'",
    "Planeje refeições semanais para evitar gastos com delivery",
  ];

  const startMonth = new Date(startDate).toISOString().slice(0, 7);
  const endMonth = new Date(endDate).toISOString().slice(0, 7);

  const output: GetSpendingCutPlanOutput = {
    summary: {
      currentTotalSpending: formatMoney(Math.round(avgMonthlySpending)),
      recommendedTargetSpending: formatMoney(
        Math.round(avgMonthlySpending - totalPotentialSavings),
      ),
      totalPotentialSavings: formatMoney(totalPotentialSavings),
      savingsPercent: Math.round(savingsPercent * 10) / 10,
      categoriesAffected: recommendations.length,
      overallRisk,
      confidenceScore,
    },
    recommendations: recommendations.slice(0, 10), // Return top 10
    timeline,
    metrics: {
      monthlyImpact: formatMoney(totalPotentialSavings),
      quarterlyImpact: formatMoney(totalPotentialSavings * 3),
      yearlyImpact: formatMoney(totalPotentialSavings * 12),
      avgSavingsPerCategory: formatMoney(avgSavingsPerCategory),
      highestCategorySavings: formatMoney(highestCategorySavings),
    },
    patterns,
    analysisPeriod: {
      startMonth,
      endMonth,
      monthsAnalyzed: analysisMonths,
    },
    generalTips,
  };

  return { success: true, data: output };
}
