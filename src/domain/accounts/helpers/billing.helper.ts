export interface BillingDates {
  nextClosing: Date;
  nextDue: Date;
  currentClosing: Date;
  currentDue: Date;
}

export function getNextClosingDate(
  closingDay: number,
  referenceDate: Date = new Date(),
): Date {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const day = referenceDate.getDate();

  if (day < closingDay) {
    return new Date(year, month, closingDay);
  }

  return new Date(year, month + 1, closingDay);
}

export function getCurrentClosingDate(
  closingDay: number,
  referenceDate: Date = new Date(),
): Date {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const day = referenceDate.getDate();

  if (day >= closingDay) {
    return new Date(year, month, closingDay);
  }

  return new Date(year, month - 1, closingDay);
}

export function getNextDueDate(
  dueDay: number,
  closingDay: number,
  referenceDate: Date = new Date(),
): Date {
  const nextClosing = getNextClosingDate(closingDay, referenceDate);
  const closingMonth = nextClosing.getMonth();
  const closingYear = nextClosing.getFullYear();

  if (dueDay > closingDay) {
    return new Date(closingYear, closingMonth, dueDay);
  }

  return new Date(closingYear, closingMonth + 1, dueDay);
}

export function getCurrentDueDate(
  dueDay: number,
  closingDay: number,
  referenceDate: Date = new Date(),
): Date {
  const currentClosing = getCurrentClosingDate(closingDay, referenceDate);
  const closingMonth = currentClosing.getMonth();
  const closingYear = currentClosing.getFullYear();

  let currentDue: Date;

  if (dueDay > closingDay) {
    currentDue = new Date(closingYear, closingMonth, dueDay);
  } else {
    currentDue = new Date(closingYear, closingMonth + 1, dueDay);
  }

  if (referenceDate < currentDue) {
    const prevClosing = new Date(closingYear, closingMonth - 1, closingDay);
    const prevClosingMonth = prevClosing.getMonth();
    const prevClosingYear = prevClosing.getFullYear();

    if (dueDay > closingDay) {
      currentDue = new Date(prevClosingYear, prevClosingMonth, dueDay);
    } else {
      currentDue = new Date(prevClosingYear, prevClosingMonth + 1, dueDay);
    }
  }

  return currentDue;
}

export function getBillingDates(
  closingDay: number,
  dueDay: number,
  referenceDate: Date = new Date(),
): BillingDates {
  return {
    nextClosing: getNextClosingDate(closingDay, referenceDate),
    nextDue: getNextDueDate(dueDay, closingDay, referenceDate),
    currentClosing: getCurrentClosingDate(closingDay, referenceDate),
    currentDue: getCurrentDueDate(dueDay, closingDay, referenceDate),
  };
}

export function getDaysUntilClosing(
  closingDay: number,
  referenceDate: Date = new Date(),
): number {
  const nextClosing = getNextClosingDate(closingDay, referenceDate);
  const diff = nextClosing.getTime() - referenceDate.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getDaysUntilDue(
  dueDay: number,
  closingDay: number,
  referenceDate: Date = new Date(),
): number {
  const nextDue = getNextDueDate(dueDay, closingDay, referenceDate);
  const diff = nextDue.getTime() - referenceDate.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isDueDayValid(dueDay: number, closingDay: number): boolean {
  if (closingDay < 1 || closingDay > 28 || dueDay < 1 || dueDay > 28) {
    return false;
  }

  if (closingDay === dueDay) {
    return false;
  }

  if (dueDay > closingDay) {
    return dueDay - closingDay >= 3;
  }

  return true;
}

export function getMinimumDueDay(closingDay: number): number {
  if (closingDay <= 25) {
    return closingDay + 3;
  }

  return 1;
}

export function formatBillingDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function getBillingCycleDescription(
  closingDay: number,
  dueDay: number,
): string {
  const daysBetween =
    dueDay > closingDay ? dueDay - closingDay : 28 - closingDay + dueDay;

  if (dueDay > closingDay) {
    return `Fechamento dia ${closingDay}, vencimento dia ${dueDay} (${daysBetween} dias depois)`;
  }

  return `Fechamento dia ${closingDay}, vencimento dia ${dueDay} do mês seguinte (~${daysBetween} dias depois)`;
}
