import "server-only";

import {
  calculatePointsValue,
  calculatePointsVsCash,
  PROGRAM_VALUATIONS,
} from "../config/points-valuation.config";
import { PointsBalanceService } from "../services/points-balance.service";
import { PointsOfferService } from "../services/points-offer.service";
import { PointsOperationService } from "../services/points-operation.service";
import { PointsProgramService } from "../services/points-program.service";
import type { PointsProgramName } from "../types/points";
import type {
  BestOffersOutput,
  CalculatePointsValueInput,
  ComparePointsVsCashInput,
  ExpiringPointsOutput,
  GetBestOffersInput,
  GetExpiringPointsInput,
  GetPointsByProgramInput,
  GetPointsHistoryInput,
  PointsByProgramOutput,
  PointsHistoryOutput,
  PointsSummaryOutput,
  PointsToolName,
  PointsValueOutput,
  PointsVsCashOutput,
} from "./points-tools.types";

type ToolResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export class PointsContextService {
  static async executeTool(
    userId: string,
    toolName: PointsToolName,
    input: Record<string, unknown>,
  ): Promise<ToolResult<unknown>> {
    try {
      switch (toolName) {
        case "get_points_summary":
          return {
            success: true,
            data: await PointsContextService.getPointsSummary(userId),
          };

        case "get_points_by_program":
          return {
            success: true,
            data: await PointsContextService.getPointsByProgram(userId, {
              program: input.program as PointsProgramName | undefined,
              status: input.status as
                | "active"
                | "redeemed"
                | "expired"
                | undefined,
            }),
          };

        case "get_expiring_points":
          return {
            success: true,
            data: await PointsContextService.getExpiringPoints(userId, {
              daysAhead: input.daysAhead as number | undefined,
              program: input.program as PointsProgramName | undefined,
            }),
          };

        case "calculate_points_value":
          return {
            success: true,
            data: await PointsContextService.calculatePointsValueTool({
              program: input.program as PointsProgramName,
              points: input.points as number,
              method: input.method as "min" | "avg" | "max" | undefined,
            }),
          };

        case "compare_points_vs_cash":
          return {
            success: true,
            data: await PointsContextService.comparePointsVsCash({
              program: input.program as PointsProgramName,
              pointsRequired: input.pointsRequired as number,
              cashPrice: input.cashPrice as number,
            }),
          };

        case "get_best_offers":
          return {
            success: true,
            data: await PointsContextService.getBestOffers({
              program: input.program as PointsProgramName | undefined,
              minBonus: input.minBonus as number | undefined,
              limit: input.limit as number | undefined,
            }),
          };

        case "get_points_history":
          return {
            success: true,
            data: await PointsContextService.getPointsHistory(userId, {
              program: input.program as PointsProgramName | undefined,
              type: input.type as
                | "earn"
                | "redeem"
                | "transfer_in"
                | "transfer_out"
                | "adjust"
                | undefined,
              daysBack: input.daysBack as number | undefined,
              limit: input.limit as number | undefined,
            }),
          };

        default:
          return { success: false, error: `Unknown tool: ${toolName}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async getPointsSummary(userId: string): Promise<PointsSummaryOutput> {
    const [programs, balances] = await Promise.all([
      PointsProgramService.listByUser(userId),
      PointsBalanceService.listByUser(userId),
    ]);

    const activeBalances = balances.filter((b) => b.status === "active");

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const expiringBalances = activeBalances.filter(
      (b) => b.expiresAt >= now && b.expiresAt <= now + thirtyDays,
    );

    const programBreakdown = programs.map((program) => {
      const programBalances = activeBalances.filter(
        (b) => b.programId === program.id,
      );
      const points = programBalances.reduce((sum, b) => sum + b.points, 0);
      const estimatedValue = calculatePointsValue(
        program.program,
        points,
        "avg",
      );
      const expiringPoints = programBalances
        .filter((b) => b.expiresAt >= now && b.expiresAt <= now + thirtyDays)
        .reduce((sum, b) => sum + b.points, 0);

      return {
        program: program.program,
        programName: PROGRAM_VALUATIONS[program.program].displayName,
        points,
        estimatedValue,
        expiringPoints,
      };
    });

    const totalActivePoints = programBreakdown.reduce(
      (sum, p) => sum + p.points,
      0,
    );
    const totalEstimatedValue = programBreakdown.reduce(
      (sum, p) => sum + p.estimatedValue,
      0,
    );
    const expiringIn30Days = expiringBalances.reduce(
      (sum, b) => sum + b.points,
      0,
    );
    const expiringIn30DaysValue = programBreakdown.reduce(
      (sum, p) =>
        sum + calculatePointsValue(p.program, p.expiringPoints, "avg"),
      0,
    );

    return {
      totalPrograms: programs.length,
      totalActivePoints,
      totalEstimatedValue,
      expiringIn30Days,
      expiringIn30DaysValue,
      programBreakdown,
    };
  }

  static async getPointsByProgram(
    userId: string,
    input: GetPointsByProgramInput,
  ): Promise<PointsByProgramOutput[]> {
    const programs = await PointsProgramService.listByUser(userId);
    const balances = await PointsBalanceService.listByUser(userId);

    const filteredPrograms = input.program
      ? programs.filter((p) => p.program === input.program)
      : programs;

    return filteredPrograms.map((program) => {
      let programBalances = balances.filter((b) => b.programId === program.id);

      if (input.status) {
        programBalances = programBalances.filter(
          (b) => b.status === input.status,
        );
      }

      const activePoints = programBalances
        .filter((b) => b.status === "active")
        .reduce((sum, b) => sum + b.points, 0);
      const redeemedPoints = programBalances
        .filter((b) => b.status === "redeemed")
        .reduce((sum, b) => sum + b.points, 0);
      const expiredPoints = programBalances
        .filter((b) => b.status === "expired")
        .reduce((sum, b) => sum + b.points, 0);

      return {
        program: program.program,
        programName: PROGRAM_VALUATIONS[program.program].displayName,
        memberId: program.memberId,
        totalPoints: activePoints + redeemedPoints + expiredPoints,
        activePoints,
        redeemedPoints,
        expiredPoints,
        estimatedValue: calculatePointsValue(
          program.program,
          activePoints,
          "avg",
        ),
        balances: programBalances.map((b) => ({
          id: b.id,
          points: b.points,
          earnedAt: new Date(b.earnedAt).toISOString(),
          expiresAt: new Date(b.expiresAt).toISOString(),
          status: b.status,
          source: b.source,
        })),
      };
    });
  }

  static async getExpiringPoints(
    userId: string,
    input: GetExpiringPointsInput,
  ): Promise<ExpiringPointsOutput> {
    const daysAhead = input.daysAhead || 30;
    const programs = await PointsProgramService.listByUser(userId);
    let balances = await PointsBalanceService.listExpiringSoon(
      userId,
      daysAhead,
    );

    if (input.program) {
      const targetProgram = programs.find((p) => p.program === input.program);
      if (targetProgram) {
        balances = balances.filter((b) => b.programId === targetProgram.id);
      }
    }

    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const _sixtyDays = 60 * 24 * 60 * 60 * 1000;

    let critical = 0;
    let high = 0;
    let medium = 0;

    const expiringBalances = balances.map((balance) => {
      const program = programs.find((p) => p.id === balance.programId);
      const programName = program
        ? PROGRAM_VALUATIONS[program.program].displayName
        : "Unknown";
      const programType = program?.program || "outro";

      const daysUntilExpiration = Math.ceil(
        (balance.expiresAt - now) / (24 * 60 * 60 * 1000),
      );

      let urgency: "critical" | "high" | "medium";
      if (balance.expiresAt - now < sevenDays) {
        urgency = "critical";
        critical += balance.points;
      } else if (balance.expiresAt - now < thirtyDays) {
        urgency = "high";
        high += balance.points;
      } else {
        urgency = "medium";
        medium += balance.points;
      }

      return {
        id: balance.id,
        program: programType as PointsProgramName,
        programName,
        points: balance.points,
        estimatedValue: calculatePointsValue(
          programType as PointsProgramName,
          balance.points,
          "avg",
        ),
        expiresAt: new Date(balance.expiresAt).toISOString(),
        daysUntilExpiration,
        urgency,
      };
    });

    const totalExpiring = balances.reduce((sum, b) => sum + b.points, 0);
    const totalEstimatedValue = expiringBalances.reduce(
      (sum, b) => sum + b.estimatedValue,
      0,
    );

    return {
      totalExpiring,
      totalEstimatedValue,
      urgencyBreakdown: { critical, high, medium },
      expiringBalances: expiringBalances.sort(
        (a, b) => a.daysUntilExpiration - b.daysUntilExpiration,
      ),
    };
  }

  static async calculatePointsValueTool(
    input: CalculatePointsValueInput,
  ): Promise<PointsValueOutput> {
    const method = input.method || "avg";
    const valuation = PROGRAM_VALUATIONS[input.program];
    const valuePerPoint =
      method === "min"
        ? valuation.minValue
        : method === "max"
          ? valuation.maxValue
          : valuation.avgValue;

    return {
      program: input.program,
      programName: valuation.displayName,
      points: input.points,
      method,
      valuePerPoint,
      totalValue: input.points * valuePerPoint,
      currency: "BRL",
      disclaimer:
        "Values are estimates based on typical redemption rates. Actual value may vary based on redemption method.",
    };
  }

  static async comparePointsVsCash(
    input: ComparePointsVsCashInput,
  ): Promise<PointsVsCashOutput> {
    const result = calculatePointsVsCash(
      input.program,
      input.pointsRequired,
      input.cashPrice / 100, // Convert from centavos to BRL
    );

    const valuation = PROGRAM_VALUATIONS[input.program];

    return {
      recommendation: result.usePoints ? "use_points" : "pay_cash",
      confidence: result.confidence,
      reason: result.reason,
      analysis: {
        program: input.program,
        programName: valuation.displayName,
        pointsRequired: input.pointsRequired,
        cashPrice: input.cashPrice / 100,
        pointsValue: result.pointsValue,
        effectiveValuePerPoint: result.effectiveValuePerPoint,
        avgValuePerPoint: result.avgValuePerPoint,
        savingsOrLoss: result.savingsOrLoss,
        percentageGainLoss: result.percentageGainLoss,
        isGoodValue: result.isGoodValue,
      },
    };
  }

  static async getBestOffers(
    input: GetBestOffersInput,
  ): Promise<BestOffersOutput> {
    let offers = await PointsOfferService.listAll();

    if (input.program) {
      offers = offers.filter((o) => o.program === input.program);
    }

    if (input.minBonus !== undefined) {
      offers = offers.filter((o) => o.bonus >= (input.minBonus || 0));
    }

    offers.sort((a, b) => b.bonus - a.bonus);

    const limit = input.limit || 10;
    offers = offers.slice(0, limit);

    const now = Date.now();

    return {
      offers: offers.map((offer) => ({
        id: offer.id,
        program: offer.program,
        programName: PROGRAM_VALUATIONS[offer.program].displayName,
        title: offer.title,
        description: offer.description,
        bonus: offer.bonus,
        validUntil: new Date(offer.validUntil).toISOString(),
        daysRemaining: Math.ceil(
          (offer.validUntil - now) / (24 * 60 * 60 * 1000),
        ),
        termsUrl: offer.termsUrl,
      })),
      totalOffers: offers.length,
    };
  }

  static async getPointsHistory(
    userId: string,
    input: GetPointsHistoryInput,
  ): Promise<PointsHistoryOutput> {
    const daysBack = input.daysBack || 30;
    const now = Date.now();
    const startDate = now - daysBack * 24 * 60 * 60 * 1000;

    const programs = await PointsProgramService.listByUser(userId);
    let operations = await PointsOperationService.listByDateRange(
      userId,
      startDate,
      now,
    );

    if (input.program) {
      const targetProgram = programs.find((p) => p.program === input.program);
      if (targetProgram) {
        operations = operations.filter((o) => o.programId === targetProgram.id);
      }
    }

    if (input.type) {
      operations = operations.filter((o) => o.type === input.type);
    }

    const limit = input.limit || 50;
    operations = operations.slice(0, limit);

    const typeLabels: Record<string, string> = {
      earn: "Ganho",
      redeem: "Resgate",
      transfer_in: "Transferência Recebida",
      transfer_out: "Transferência Enviada",
      adjust: "Ajuste",
    };

    const totalEarned = operations
      .filter((o) => o.type === "earn" || o.type === "transfer_in")
      .reduce((sum, o) => sum + o.pointsDelta, 0);

    const totalSpent = operations
      .filter((o) => o.type === "redeem" || o.type === "transfer_out")
      .reduce((sum, o) => sum + Math.abs(o.pointsDelta), 0);

    return {
      operations: operations.map((op) => {
        const program = programs.find((p) => p.id === op.programId);
        const programType = program?.program || "outro";

        return {
          id: op.id,
          program: programType as PointsProgramName,
          programName: program
            ? PROGRAM_VALUATIONS[program.program].displayName
            : "Unknown",
          date: new Date(op.date).toISOString(),
          type: op.type,
          typeLabel: typeLabels[op.type] || op.type,
          pointsDelta: op.pointsDelta,
          partner: op.partnerOrAirline,
          notes: op.notes,
        };
      }),
      summary: {
        totalEarned,
        totalSpent,
        netChange: totalEarned - totalSpent,
        operationCount: operations.length,
      },
    };
  }

  static async buildPointsContext(userId: string): Promise<string> {
    try {
      const summary = await PointsContextService.getPointsSummary(userId);
      const expiring = await PointsContextService.getExpiringPoints(userId, {
        daysAhead: 30,
      });
      const offers = await PointsContextService.getBestOffers({ limit: 5 });

      let context = `\nPOINTS & MILES SUMMARY:\n`;
      context += `- Total Programs: ${summary.totalPrograms}\n`;
      context += `- Total Active Points: ${summary.totalActivePoints.toLocaleString("pt-BR")}\n`;
      context += `- Estimated Value: R$${summary.totalEstimatedValue.toFixed(2)}\n`;
      context += `- Expiring in 30 Days: ${summary.expiringIn30Days.toLocaleString("pt-BR")} points (R$${summary.expiringIn30DaysValue.toFixed(2)})\n`;

      if (summary.programBreakdown.length > 0) {
        context += `\nPOINTS BY PROGRAM:\n`;
        for (const program of summary.programBreakdown) {
          context += `- ${program.programName}: ${program.points.toLocaleString("pt-BR")} points (R$${program.estimatedValue.toFixed(2)})`;
          if (program.expiringPoints > 0) {
            context += ` - ⚠️ ${program.expiringPoints.toLocaleString("pt-BR")} expiring soon`;
          }
          context += `\n`;
        }
      }

      if (expiring.totalExpiring > 0) {
        context += `\n⚠️ EXPIRATION ALERTS:\n`;
        if (expiring.urgencyBreakdown.critical > 0) {
          context += `- CRITICAL (< 7 days): ${expiring.urgencyBreakdown.critical.toLocaleString("pt-BR")} points\n`;
        }
        if (expiring.urgencyBreakdown.high > 0) {
          context += `- HIGH (7-30 days): ${expiring.urgencyBreakdown.high.toLocaleString("pt-BR")} points\n`;
        }
      }

      if (offers.offers.length > 0) {
        context += `\nCURRENT BONUS OFFERS:\n`;
        for (const offer of offers.offers.slice(0, 3)) {
          context += `- ${offer.programName}: ${offer.title} (+${offer.bonus}% bonus, ${offer.daysRemaining} days left)\n`;
        }
      }

      return context;
    } catch {
      return "\nPOINTS & MILES: No data available\n";
    }
  }
}
