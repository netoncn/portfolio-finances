import "server-only";

import type { RAGFinancialContext } from "./rag.types";

export interface SerializerOptions {
  locale: string;
  maxTokens?: number;
  includeSections?: Array<
    | "summary"
    | "historical"
    | "categories"
    | "merchants"
    | "budgets"
    | "goals"
    | "accounts"
    | "insights"
    | "alerts"
    | "points"
  >;
  currencySymbol?: string;
}

const DEFAULT_OPTIONS: Required<SerializerOptions> = {
  locale: "pt-BR",
  maxTokens: 2000,
  includeSections: [
    "summary",
    "historical",
    "categories",
    "budgets",
    "goals",
    "insights",
    "alerts",
    "points",
  ],
  currencySymbol: "R$",
};

export class RAGContextSerializerService {
  static serialize(
    context: RAGFinancialContext,
    options: Partial<SerializerOptions> = {},
  ): string {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const sections: string[] = [];

    sections.push(RAGContextSerializerService.serializeHeader(context, opts));

    if (opts.includeSections.includes("summary")) {
      sections.push(
        RAGContextSerializerService.serializeCurrentPeriod(context, opts),
      );
    }

    if (opts.includeSections.includes("historical")) {
      sections.push(
        RAGContextSerializerService.serializeHistoricalSummary(context, opts),
      );
    }

    if (opts.includeSections.includes("categories")) {
      sections.push(
        RAGContextSerializerService.serializeCategories(context, opts),
      );
    }

    if (opts.includeSections.includes("merchants")) {
      sections.push(
        RAGContextSerializerService.serializeMerchants(context, opts),
      );
    }

    if (
      opts.includeSections.includes("budgets") &&
      context.budgets.length > 0
    ) {
      sections.push(
        RAGContextSerializerService.serializeBudgets(context, opts),
      );
    }

    if (opts.includeSections.includes("goals") && context.goals.length > 0) {
      sections.push(RAGContextSerializerService.serializeGoals(context, opts));
    }

    if (
      opts.includeSections.includes("accounts") &&
      context.accounts.length > 0
    ) {
      sections.push(
        RAGContextSerializerService.serializeAccounts(context, opts),
      );
    }

    if (
      opts.includeSections.includes("insights") &&
      context.insights.length > 0
    ) {
      sections.push(RAGContextSerializerService.serializeInsights(context));
    }

    if (opts.includeSections.includes("alerts") && context.alerts.length > 0) {
      sections.push(RAGContextSerializerService.serializeAlerts(context, opts));
    }

    if (opts.includeSections.includes("points") && context.pointsContext) {
      sections.push(context.pointsContext);
    }

    return sections.filter(Boolean).join("\n\n");
  }

  static serializeCompact(
    context: RAGFinancialContext,
    options: Partial<SerializerOptions> = {},
  ): string {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const lines: string[] = [];
    const cs = opts.currencySymbol;

    const { currentPeriod: cp } = context;
    lines.push("RESUMO FINANCEIRO:");
    lines.push(
      `- Receita: ${cs}${RAGContextSerializerService.formatCurrency(cp.income)}`,
    );
    lines.push(
      `- Despesas: ${cs}${RAGContextSerializerService.formatCurrency(cp.expenses)}`,
    );
    lines.push(
      `- Saldo: ${cs}${RAGContextSerializerService.formatCurrency(cp.netBalance)}`,
    );
    lines.push(`- Taxa de economia: ${cp.savingsRate.toFixed(1)}%`);

    if (context.topCategories.length > 0) {
      lines.push("\nTOP GASTOS:");
      for (const cat of context.topCategories.slice(0, 3)) {
        lines.push(
          `- ${cat.categoryName}: ${cs}${RAGContextSerializerService.formatCurrency(cat.totalSpent)} (${cat.percentOfTotal.toFixed(0)}%)`,
        );
      }
    }

    const exceededBudgets = context.budgets.filter(
      (b) => b.status === "exceeded",
    );
    const warningBudgets = context.budgets.filter(
      (b) => b.status === "warning",
    );
    if (exceededBudgets.length > 0 || warningBudgets.length > 0) {
      lines.push("\nALERTAS:");
      for (const b of exceededBudgets) {
        lines.push(`- ${b.name}: EXCEDIDO (${b.percentUsed.toFixed(0)}%)`);
      }
      for (const b of warningBudgets) {
        lines.push(`- ${b.name}: ATENÇÃO (${b.percentUsed.toFixed(0)}%)`);
      }
    }

    if (context.goals.length > 0) {
      lines.push("\nMETAS:");
      for (const goal of context.goals.slice(0, 3)) {
        const status =
          goal.status === "completed"
            ? "CONCLUÍDA"
            : goal.status === "behind"
              ? "ATRASADA"
              : goal.status === "ahead"
                ? "ADIANTADA"
                : "NO PRAZO";
        lines.push(
          `- ${goal.name}: ${goal.progressPercent.toFixed(0)}% (${status})`,
        );
      }
    }

    return lines.join("\n");
  }

  private static serializeHeader(
    context: RAGFinancialContext,
    opts: Required<SerializerOptions>,
  ): string {
    const startDate = new Date(context.dataRange.start).toLocaleDateString(
      opts.locale,
    );
    const endDate = new Date(context.dataRange.end).toLocaleDateString(
      opts.locale,
    );

    return `DADOS FINANCEIROS (${startDate} - ${endDate})`;
  }

  private static serializeCurrentPeriod(
    context: RAGFinancialContext,
    opts: Required<SerializerOptions>,
  ): string {
    const { currentPeriod: cp } = context;
    const cs = opts.currencySymbol;

    const monthName = new Date(`${cp.month}-01`).toLocaleDateString(
      opts.locale,
      {
        month: "long",
        year: "numeric",
      },
    );

    return `RESUMO DO MÊS ATUAL (${monthName}):
- Receita Total: ${cs}${RAGContextSerializerService.formatCurrency(cp.income)}
- Despesas Totais: ${cs}${RAGContextSerializerService.formatCurrency(cp.expenses)}
- Saldo Líquido: ${cs}${RAGContextSerializerService.formatCurrency(cp.netBalance)}
- Taxa de Economia: ${cp.savingsRate.toFixed(1)}%
- Total de Transações: ${cp.transactionCount}`;
  }

  private static serializeHistoricalSummary(
    context: RAGFinancialContext,
    opts: Required<SerializerOptions>,
  ): string {
    const { historicalSummary: hs } = context;
    const cs = opts.currencySymbol;

    const stabilityLabels: Record<string, string> = {
      stable: "Estável",
      variable: "Variável",
      growing: "Crescente",
      declining: "Decrescente",
    };

    const trendLabels: Record<string, string> = {
      increasing: "Aumentando",
      decreasing: "Diminuindo",
      stable: "Estável",
    };

    let text = `HISTÓRICO (últimos 90 dias):
- Média de Receita Mensal: ${cs}${RAGContextSerializerService.formatCurrency(hs.avgMonthlyIncome)}
- Média de Despesas Mensal: ${cs}${RAGContextSerializerService.formatCurrency(hs.avgMonthlyExpenses)}
- Taxa de Economia Média: ${hs.avgSavingsRate.toFixed(1)}%
- Estabilidade da Renda: ${stabilityLabels[hs.incomeStability] || hs.incomeStability}
- Tendência de Gastos: ${trendLabels[hs.expensesTrend] || hs.expensesTrend}`;

    if (hs.monthlyData.length > 0) {
      text += "\n\nEvolução Mensal:";
      for (const month of hs.monthlyData.slice(0, 3)) {
        const monthLabel = new Date(`${month.month}-01`).toLocaleDateString(
          opts.locale,
          {
            month: "short",
          },
        );
        text += `\n- ${monthLabel}: Receita ${cs}${RAGContextSerializerService.formatCurrency(month.income)}, Despesas ${cs}${RAGContextSerializerService.formatCurrency(month.expenses)}`;
      }
    }

    return text;
  }

  private static serializeCategories(
    context: RAGFinancialContext,
    opts: Required<SerializerOptions>,
  ): string {
    const cs = opts.currencySymbol;
    let text = "GASTOS POR CATEGORIA:";

    for (const cat of context.topCategories.slice(0, 5)) {
      const trendIcon =
        cat.trend === "up" ? "↑" : cat.trend === "down" ? "↓" : "→";
      text += `\n- ${cat.categoryName}: ${cs}${RAGContextSerializerService.formatCurrency(cat.totalSpent)} (${cat.percentOfTotal.toFixed(1)}%) ${trendIcon}${Math.abs(cat.trendPercent).toFixed(0)}%`;
    }

    if (context.categoryTrends.length > 0) {
      text += "\n\nMudanças significativas este mês:";
      for (const trend of context.categoryTrends.slice(0, 3)) {
        const direction = trend.change > 0 ? "aumentou" : "diminuiu";
        text += `\n- ${trend.categoryName} ${direction} ${Math.abs(trend.changePercent).toFixed(0)}%`;
      }
    }

    return text;
  }

  private static serializeMerchants(
    context: RAGFinancialContext,
    opts: Required<SerializerOptions>,
  ): string {
    const cs = opts.currencySymbol;
    let text = "PRINCIPAIS ESTABELECIMENTOS:";

    for (const merchant of context.topMerchants.slice(0, 5)) {
      text += `\n- ${merchant.merchant}: ${cs}${RAGContextSerializerService.formatCurrency(merchant.totalSpent)} (${merchant.transactionCount}x)`;
    }

    if (context.frequentTransactions.length > 0) {
      text += "\n\nGastos Recorrentes:";
      for (const tx of context.frequentTransactions.slice(0, 3)) {
        text += `\n- ${tx.description}: ${cs}${RAGContextSerializerService.formatCurrency(tx.amount)} (~${tx.frequency}x/período)`;
      }
    }

    return text;
  }

  private static serializeBudgets(
    context: RAGFinancialContext,
    opts: Required<SerializerOptions>,
  ): string {
    const cs = opts.currencySymbol;
    const { budgetSummary: bs } = context;

    const statusLabels: Record<string, string> = {
      on_track: "✓ No limite",
      warning: "⚠️ Atenção",
      exceeded: "❌ Excedido",
    };

    let text = `ORÇAMENTOS:
- Total Orçado: ${cs}${RAGContextSerializerService.formatCurrency(bs.totalBudgeted)}
- Total Gasto: ${cs}${RAGContextSerializerService.formatCurrency(bs.totalSpent)}
- Status Geral: ${statusLabels[bs.overallStatus] || bs.overallStatus}`;

    text += "\n\nDetalhe por orçamento:";
    for (const budget of context.budgets) {
      const status = statusLabels[budget.status] || budget.status;
      text += `\n- ${budget.name}: ${cs}${RAGContextSerializerService.formatCurrency(budget.spent)}/${cs}${RAGContextSerializerService.formatCurrency(budget.limit)} (${budget.percentUsed.toFixed(0)}%) ${status}`;

      if (budget.daysRemaining > 0 && budget.status !== "exceeded") {
        text += ` - ${cs}${RAGContextSerializerService.formatCurrency(budget.remaining / budget.daysRemaining)}/dia restante`;
      }
    }

    return text;
  }

  private static serializeGoals(
    context: RAGFinancialContext,
    opts: Required<SerializerOptions>,
  ): string {
    const cs = opts.currencySymbol;
    const { goalsSummary: gs } = context;

    const statusLabels: Record<string, string> = {
      on_track: "No prazo",
      behind: "Atrasada",
      ahead: "Adiantada",
      completed: "Concluída",
    };

    let text = `METAS FINANCEIRAS:
- Total de Metas: ${context.goals.length}
- Progresso Geral: ${gs.overallProgress.toFixed(1)}%
- No Prazo: ${gs.onTrackCount} | Atrasadas: ${gs.behindCount}
- Total Alvo: ${cs}${RAGContextSerializerService.formatCurrency(gs.totalTargetAmount)}
- Total Economizado: ${cs}${RAGContextSerializerService.formatCurrency(gs.totalSavedAmount)}`;

    text += "\n\nDetalhe por meta:";
    for (const goal of context.goals) {
      const status = statusLabels[goal.status] || goal.status;
      text += `\n- ${goal.name}: ${cs}${RAGContextSerializerService.formatCurrency(goal.currentAmount)}/${cs}${RAGContextSerializerService.formatCurrency(goal.targetAmount)} (${goal.progressPercent.toFixed(0)}%) - ${status}`;

      if (goal.daysRemaining !== undefined && goal.status !== "completed") {
        text += ` | ${goal.daysRemaining} dias restantes`;
        if (goal.monthlyTarget > 0) {
          text += ` | Meta mensal: ${cs}${RAGContextSerializerService.formatCurrency(goal.monthlyTarget)}`;
        }
      }
    }

    return text;
  }

  private static serializeAccounts(
    context: RAGFinancialContext,
    opts: Required<SerializerOptions>,
  ): string {
    const cs = opts.currencySymbol;
    const { accountsSummary: as } = context;

    let text = `CONTAS:
- Total de Contas: ${as.totalAccounts}`;

    if (as.totalCreditLimit > 0) {
      text += `
- Limite de Crédito Total: ${cs}${RAGContextSerializerService.formatCurrency(as.totalCreditLimit)}
- Crédito Utilizado: ${cs}${RAGContextSerializerService.formatCurrency(as.totalCreditUsed)}
- Utilização Média: ${as.avgUtilization.toFixed(1)}%`;
    }

    text += "\n\nMovimentação por conta (este mês):";
    for (const account of context.accounts) {
      text += `\n- ${account.name} (${account.typeLabel}): +${cs}${RAGContextSerializerService.formatCurrency(account.monthlyIncome)} / -${cs}${RAGContextSerializerService.formatCurrency(account.monthlyExpenses)}`;

      if (account.utilizationPercent !== undefined) {
        const utilStatus =
          account.utilizationPercent > 70
            ? "⚠️"
            : account.utilizationPercent > 30
              ? ""
              : "✓";
        text += ` | Utilização: ${account.utilizationPercent.toFixed(0)}% ${utilStatus}`;
      }
    }

    return text;
  }

  private static serializeInsights(context: RAGFinancialContext): string {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const sortedInsights = [...context.insights].sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
    );

    const typeIcons: Record<string, string> = {
      trend: "📊",
      anomaly: "🔍",
      opportunity: "💡",
      warning: "⚠️",
      achievement: "🏆",
    };

    let text = "INSIGHTS FINANCEIROS:";
    for (const insight of sortedInsights) {
      const icon = typeIcons[insight.type] || "•";
      text += `\n${icon} ${insight.title}: ${insight.description}`;
    }

    return text;
  }

  private static serializeAlerts(
    context: RAGFinancialContext,
    opts: Required<SerializerOptions>,
  ): string {
    const cs = opts.currencySymbol;
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    const sortedAlerts = [...context.alerts].sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
    );

    const severityIcons: Record<string, string> = {
      critical: "🚨",
      warning: "⚠️",
      info: "ℹ️",
    };

    let text = "ALERTAS:";
    for (const alert of sortedAlerts) {
      const icon = severityIcons[alert.severity] || "•";
      let line = `\n${icon} ${alert.message}`;
      if (alert.amount !== undefined) {
        line += ` (${cs}${RAGContextSerializerService.formatCurrency(alert.amount)})`;
      }
      text += line;
    }

    return text;
  }

  private static formatCurrency(amountInCents: number): string {
    return (amountInCents / 100)
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
}
