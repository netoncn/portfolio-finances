export type DistributionStrategy = "equal" | "first" | "last" | "proportional";

export interface InstallmentData {
  installmentNumber: number;
  installmentCount: number;
  amount: number; // principal amount in cents
  interestAmount?: number; // interest in cents
  feesAmount?: number; // fees in cents
  dueDate: number; // timestamp in milliseconds
  statementMonth?: string; // yyyymm format
}

export function calculateInstallmentDueDate(
  firstDueDate: number,
  installmentNumber: number,
): number {
  const date = new Date(firstDueDate);
  date.setMonth(date.getMonth() + (installmentNumber - 1));
  return date.getTime();
}

export function calculateStatementMonth(
  dueDate: number,
  closingDay: number,
): string {
  const date = new Date(dueDate);
  const day = date.getDate();
  if (day <= closingDay) {
    date.setMonth(date.getMonth() - 1);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}${month}`;
}

export function distributeAmountEqually(
  totalAmount: number,
  installmentCount: number,
): number[] {
  const baseAmount = Math.floor(totalAmount / installmentCount);
  const remainder = totalAmount - baseAmount * installmentCount;

  const amounts: number[] = [];
  for (let i = 0; i < installmentCount; i++) {
    amounts.push(i === 0 ? baseAmount + remainder : baseAmount);
  }

  return amounts;
}

export function distributeWithStrategy(
  totalAmount: number,
  installmentCount: number,
  strategy: DistributionStrategy,
  principalAmounts?: number[],
): number[] {
  const amounts = new Array(installmentCount).fill(0);

  if (totalAmount === 0) {
    return amounts;
  }

  switch (strategy) {
    case "equal":
      return distributeAmountEqually(totalAmount, installmentCount);

    case "first":
      amounts[0] = totalAmount;
      return amounts;

    case "last":
      amounts[installmentCount - 1] = totalAmount;
      return amounts;

    case "proportional": {
      if (!principalAmounts || principalAmounts.length !== installmentCount) {
        return distributeAmountEqually(totalAmount, installmentCount);
      }

      const totalPrincipal = principalAmounts.reduce(
        (sum, amt) => sum + amt,
        0,
      );
      if (totalPrincipal === 0) {
        return distributeAmountEqually(totalAmount, installmentCount);
      }

      let distributed = 0;
      for (let i = 0; i < installmentCount - 1; i++) {
        const proportion = principalAmounts[i] / totalPrincipal;
        amounts[i] = Math.floor(totalAmount * proportion);
        distributed += amounts[i];
      }

      amounts[installmentCount - 1] = totalAmount - distributed;
      return amounts;
    }

    default:
      return distributeAmountEqually(totalAmount, installmentCount);
  }
}

export interface GenerateInstallmentsConfig {
  installmentCount: number;
  originalAmount: number; // total in cents
  interestTotal?: number; // total interest in cents
  feesTotal?: number; // total fees in cents
  firstDueDate: number; // timestamp
  statementStartMonth?: string; // yyyymm
  closingDay?: number; // for statement month calculation (1-28)
  interestStrategy?: DistributionStrategy;
  feesStrategy?: DistributionStrategy;
}

export function generateInstallments(
  config: GenerateInstallmentsConfig,
): InstallmentData[] {
  const {
    installmentCount,
    originalAmount,
    interestTotal = 0,
    feesTotal = 0,
    firstDueDate,
    statementStartMonth,
    closingDay,
    interestStrategy = "equal",
    feesStrategy = "first",
  } = config;

  const principalAmounts = distributeAmountEqually(
    originalAmount,
    installmentCount,
  );

  const interestAmounts = distributeWithStrategy(
    interestTotal,
    installmentCount,
    interestStrategy,
    principalAmounts,
  );

  const feesAmounts = distributeWithStrategy(
    feesTotal,
    installmentCount,
    feesStrategy,
    principalAmounts,
  );

  const installments: InstallmentData[] = [];

  for (let i = 0; i < installmentCount; i++) {
    const installmentNumber = i + 1;
    const dueDate = calculateInstallmentDueDate(
      firstDueDate,
      installmentNumber,
    );

    let statementMonth: string | undefined;
    if (statementStartMonth && closingDay) {
      const startYear = Number.parseInt(
        statementStartMonth.substring(0, 4),
        10,
      );
      const startMonth = Number.parseInt(
        statementStartMonth.substring(4, 6),
        10,
      );

      const stmtDate = new Date(startYear, startMonth - 1 + i, 1);
      statementMonth = `${stmtDate.getFullYear()}${String(stmtDate.getMonth() + 1).padStart(2, "0")}`;
    } else if (closingDay) {
      statementMonth = calculateStatementMonth(dueDate, closingDay);
    }

    installments.push({
      installmentNumber,
      installmentCount,
      amount: principalAmounts[i],
      interestAmount: interestAmounts[i] > 0 ? interestAmounts[i] : undefined,
      feesAmount: feesAmounts[i] > 0 ? feesAmounts[i] : undefined,
      dueDate,
      statementMonth,
    });
  }

  return installments;
}

export function calculateInstallmentTotal(
  installment: InstallmentData,
): number {
  return (
    installment.amount +
    (installment.interestAmount || 0) +
    (installment.feesAmount || 0)
  );
}

export function validateInstallmentTotals(
  installments: InstallmentData[],
  expectedOriginalAmount: number,
  expectedInterestTotal: number = 0,
  expectedFeesTotal: number = 0,
): boolean {
  const totalPrincipal = installments.reduce(
    (sum, inst) => sum + inst.amount,
    0,
  );
  const totalInterest = installments.reduce(
    (sum, inst) => sum + (inst.interestAmount || 0),
    0,
  );
  const totalFees = installments.reduce(
    (sum, inst) => sum + (inst.feesAmount || 0),
    0,
  );

  return (
    totalPrincipal === expectedOriginalAmount &&
    totalInterest === expectedInterestTotal &&
    totalFees === expectedFeesTotal
  );
}
