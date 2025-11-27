"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type PeriodType = "month" | "all";

export interface Period {
  type: PeriodType;
  year: number;
  month: number; // 0-11 (JavaScript Date month)
}

interface TemporalContextValue {
  period: Period;
  setPeriod: (period: Period) => void;
  nextMonth: () => void;
  previousMonth: () => void;
  goToToday: () => void;
  setViewAll: () => void;
  isCurrentMonth: () => boolean;
  getStartTimestamp: () => number | undefined;
  getEndTimestamp: () => number | undefined;
}

const TemporalContext = createContext<TemporalContextValue | undefined>(
  undefined,
);

const STORAGE_KEY = "finances_selected_period";

function getCurrentPeriod(): Period {
  const now = new Date();
  return {
    type: "month",
    year: now.getFullYear(),
    month: now.getMonth(),
  };
}

function loadPeriodFromStorage(): Period {
  if (typeof window === "undefined") {
    return getCurrentPeriod();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Period;
      return parsed;
    }
  } catch (error) {
    console.error("Failed to load period from storage:", error);
  }

  return getCurrentPeriod();
}

function savePeriodToStorage(period: Period): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(period));
  } catch (error) {
    console.error("Failed to save period to storage:", error);
  }
}

export function TemporalProvider({ children }: { children: React.ReactNode }) {
  const [period, setPeriodState] = useState<Period>(getCurrentPeriod);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const stored = loadPeriodFromStorage();
    setPeriodState(stored);
  }, []);

  const setPeriod = (newPeriod: Period) => {
    setPeriodState(newPeriod);
    if (isClient) {
      savePeriodToStorage(newPeriod);
    }
  };

  const nextMonth = () => {
    setPeriodState((prev: Period) => {
      if (prev.type === "all") {
        return getCurrentPeriod();
      }

      const date = new Date(prev.year, prev.month + 1, 1);
      const newPeriod = {
        type: "month" as const,
        year: date.getFullYear(),
        month: date.getMonth(),
      };

      if (isClient) {
        savePeriodToStorage(newPeriod);
      }

      return newPeriod;
    });
  };

  const previousMonth = () => {
    setPeriodState((prev: Period) => {
      if (prev.type === "all") {
        return getCurrentPeriod();
      }

      const date = new Date(prev.year, prev.month - 1, 1);
      const newPeriod = {
        type: "month" as const,
        year: date.getFullYear(),
        month: date.getMonth(),
      };

      if (isClient) {
        savePeriodToStorage(newPeriod);
      }

      return newPeriod;
    });
  };

  const goToToday = () => {
    setPeriod(getCurrentPeriod());
  };

  const setViewAll = () => {
    setPeriod({
      type: "all",
      year: new Date().getFullYear(),
      month: new Date().getMonth(),
    });
  };

  const isCurrentMonth = (): boolean => {
    if (period.type === "all") {
      return false;
    }

    const now = new Date();
    return period.year === now.getFullYear() && period.month === now.getMonth();
  };

  const getStartTimestamp = (): number | undefined => {
    if (period.type === "all") {
      return undefined;
    }

    const date = new Date(period.year, period.month, 1);
    return date.getTime();
  };

  const getEndTimestamp = (): number | undefined => {
    if (period.type === "all") {
      return undefined;
    }

    const date = new Date(period.year, period.month + 1, 0, 23, 59, 59, 999);
    return date.getTime();
  };

  const value: TemporalContextValue = {
    period,
    setPeriod,
    nextMonth,
    previousMonth,
    goToToday,
    setViewAll,
    isCurrentMonth,
    getStartTimestamp,
    getEndTimestamp,
  };

  return (
    <TemporalContext.Provider value={value}>
      {children}
    </TemporalContext.Provider>
  );
}

export function useTemporal(): TemporalContextValue {
  const context = useContext(TemporalContext);

  if (!context) {
    throw new Error("useTemporal must be used within TemporalProvider");
  }

  return context;
}

export function isTimestampInPeriod(
  timestamp: number,
  period: Period,
): boolean {
  if (period.type === "all") {
    return true;
  }

  const date = new Date(timestamp);
  return date.getFullYear() === period.year && date.getMonth() === period.month;
}

export function filterByPeriod<T extends { createdAt: number }>(
  items: T[],
  period: Period,
): T[] {
  if (period.type === "all") {
    return items;
  }

  return items.filter((item) => isTimestampInPeriod(item.createdAt, period));
}
