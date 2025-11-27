import "server-only";
import { AIServiceWrapper } from "@/domain/ai-usage";
import { type LLMMessage, LLMProviderFactory } from "@/lib/llm";
import { logger } from "@/lib/logger";
import { getUserLocale } from "@/services/locale";
import type { AIInsightContext, InsightType } from "../types/insight";

export class AIInsightsService {
  static async generateInsights(
    _userId: string,
    _month: string,
    context: AIInsightContext,
  ): Promise<
    Array<{
      type: InsightType;
      title: string;
      description: string;
      severity: "info" | "warning" | "alert" | "success";
      actionable: boolean;
      actionText?: string;
    }>
  > {
    if (!LLMProviderFactory.isAnyProviderAvailable()) {
      logger.warn("No LLM provider available for insights generation");
      return AIInsightsService.generateFallbackInsights(context);
    }

    try {
      const locale = await getUserLocale();

      const prompt = AIInsightsService.buildInsightsPrompt(context, locale);

      const languageInstruction =
        locale === "pt-BR"
          ? "You MUST respond in Brazilian Portuguese (pt-BR). All titles and descriptions should be in Portuguese."
          : "You should respond in English.";

      const messages: LLMMessage[] = [
        {
          role: "system",
          content: `You are a financial advisor AI that analyzes spending patterns and provides actionable insights. Be concise, specific, and helpful. Always respond with valid JSON only.\n\nIMPORTANT LANGUAGE INSTRUCTION:\n${languageInstruction}`,
        },
        {
          role: "user",
          content: prompt,
        },
      ];

      const result = await AIServiceWrapper.generateJSON<{
        insights: Array<{
          type: InsightType;
          title: string;
          description: string;
          severity: "info" | "warning" | "alert" | "success";
          actionable: boolean;
          actionText?: string;
        }>;
      }>(
        _userId,
        "insights",
        messages,
        {
          temperature: 0.7,
          maxTokens: 1000,
        },
        {
          month: _month,
          totalIncome: context.currentMonth.totalIncome,
          totalExpenses: context.currentMonth.totalExpenses,
        },
      );

      return result.insights || [];
    } catch (error) {
      logger.error("Failed to generate AI insights", error as Error);
      return AIInsightsService.generateFallbackInsights(context);
    }
  }

  private static buildInsightsPrompt(
    context: AIInsightContext,
    _locale: string,
  ): string {
    const {
      currentMonth,
      previousMonth,
      topCategories,
      significantChanges,
      budgets,
    } = context;

    let prompt = `Analyze the following financial data and generate 3-5 actionable insights:

**Current Month Summary:**
- Total Income: $${currentMonth.totalIncome.toFixed(2)}
- Total Expenses: $${currentMonth.totalExpenses.toFixed(2)}
- Net Balance: $${currentMonth.netBalance.toFixed(2)}
- Savings Rate: ${currentMonth.savingsRate.toFixed(1)}%
`;

    if (previousMonth) {
      const incomeChange =
        ((currentMonth.totalIncome - previousMonth.totalIncome) /
          previousMonth.totalIncome) *
        100;
      const expenseChange =
        ((currentMonth.totalExpenses - previousMonth.totalExpenses) /
          previousMonth.totalExpenses) *
        100;

      prompt += `
**Comparison to Previous Month:**
- Income Change: ${incomeChange > 0 ? "+" : ""}${incomeChange.toFixed(1)}%
- Expense Change: ${expenseChange > 0 ? "+" : ""}${expenseChange.toFixed(1)}%
`;
    }

    prompt += `
**Top Spending Categories:**
${topCategories.map((cat) => `- ${cat.name}: $${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%)`).join("\n")}
`;

    if (significantChanges.length > 0) {
      prompt += `
**Significant Changes:**
${significantChanges.map((change) => `- ${change.category}: ${change.change > 0 ? "+" : ""}$${change.change.toFixed(2)} (${change.changePercentage > 0 ? "+" : ""}${change.changePercentage.toFixed(1)}%)`).join("\n")}
`;
    }

    if (budgets && budgets.length > 0) {
      prompt += `
**Budget Status:**
${budgets.map((b) => `- ${b.category}: $${b.spent.toFixed(2)} / $${b.limit.toFixed(2)} (${b.percentage.toFixed(1)}%)`).join("\n")}
`;
    }

    prompt += `

Please provide 3-5 insights in the following JSON format:
{
  "insights": [
    {
      "type": "spending_spike" | "spending_decrease" | "category_trend" | "budget_warning" | "savings_opportunity" | "recurring_pattern" | "anomaly" | "achievement",
      "title": "Short, impactful title (max 60 chars)",
      "description": "Detailed explanation with specific numbers and actionable advice (max 200 chars)",
      "severity": "info" | "warning" | "alert" | "success",
      "actionable": true | false,
      "actionText": "Specific action user can take (optional, max 50 chars)"
    }
  ]
}

Guidelines:
1. Focus on the most significant patterns and changes
2. Be specific with numbers and percentages
3. Provide actionable recommendations when possible
4. Use appropriate severity levels:
   - "success": Achievements or positive trends
   - "info": Neutral observations or patterns
   - "warning": Potential concerns that need attention
   - "alert": Critical issues requiring immediate action
5. Keep titles concise and descriptions informative
6. If budget is exceeded or close to limit, create budget_warning insight
7. If savings rate is good (>20%), create achievement insight
8. If there's a significant spike in any category (>30%), create spending_spike insight
`;

    return prompt;
  }

  private static generateFallbackInsights(context: AIInsightContext): Array<{
    type: InsightType;
    title: string;
    description: string;
    severity: "info" | "warning" | "alert" | "success";
    actionable: boolean;
    actionText?: string;
  }> {
    const insights: Array<{
      type: InsightType;
      title: string;
      description: string;
      severity: "info" | "warning" | "alert" | "success";
      actionable: boolean;
      actionText?: string;
    }> = [];

    const {
      currentMonth,
      previousMonth: _previousMonth,
      topCategories,
      significantChanges,
      budgets,
    } = context;

    if (currentMonth.savingsRate > 20) {
      insights.push({
        type: "achievement",
        title: "Great Savings Rate!",
        description: `You saved ${currentMonth.savingsRate.toFixed(1)}% of your income this month. Keep up the good work!`,
        severity: "success",
        actionable: false,
      });
    } else if (currentMonth.savingsRate < 0) {
      insights.push({
        type: "budget_warning",
        title: "Spending Exceeds Income",
        description: `Your expenses ($${currentMonth.totalExpenses.toFixed(2)}) exceeded your income ($${currentMonth.totalIncome.toFixed(2)}) this month.`,
        severity: "alert",
        actionable: true,
        actionText: "Review your budget and cut unnecessary expenses",
      });
    }

    if (topCategories.length > 0) {
      const topCategory = topCategories[0];
      insights.push({
        type: "category_trend",
        title: `${topCategory.name} is Your Top Expense`,
        description: `You spent $${topCategory.amount.toFixed(2)} (${topCategory.percentage.toFixed(1)}%) on ${topCategory.name} this month.`,
        severity: "info",
        actionable: topCategory.percentage > 30,
        actionText:
          topCategory.percentage > 30
            ? `Consider ways to reduce ${topCategory.name} expenses`
            : undefined,
      });
    }

    for (const change of significantChanges.slice(0, 2)) {
      if (Math.abs(change.changePercentage) > 30) {
        insights.push({
          type:
            change.changePercentage > 0
              ? "spending_spike"
              : "spending_decrease",
          title: `${change.category} ${change.changePercentage > 0 ? "Increased" : "Decreased"} Significantly`,
          description: `Your ${change.category} spending ${change.changePercentage > 0 ? "increased" : "decreased"} by ${Math.abs(change.changePercentage).toFixed(1)}% ($${Math.abs(change.change).toFixed(2)})`,
          severity: change.changePercentage > 0 ? "warning" : "success",
          actionable: change.changePercentage > 0,
          actionText:
            change.changePercentage > 0
              ? `Review ${change.category} transactions`
              : undefined,
        });
      }
    }

    if (budgets) {
      for (const budget of budgets) {
        if (budget.percentage >= 100) {
          insights.push({
            type: "budget_warning",
            title: `${budget.category} Budget Exceeded`,
            description: `You've spent $${budget.spent.toFixed(2)} of your $${budget.limit.toFixed(2)} budget (${budget.percentage.toFixed(0)}%)`,
            severity: "alert",
            actionable: true,
            actionText: `Reduce ${budget.category} spending`,
          });
        } else if (budget.percentage >= 80) {
          insights.push({
            type: "budget_warning",
            title: `${budget.category} Budget Alert`,
            description: `You've used ${budget.percentage.toFixed(0)}% of your ${budget.category} budget ($${budget.spent.toFixed(2)} / $${budget.limit.toFixed(2)})`,
            severity: "warning",
            actionable: true,
            actionText: "Monitor remaining expenses carefully",
          });
        }
      }
    }

    return insights.slice(0, 5);
  }
}
