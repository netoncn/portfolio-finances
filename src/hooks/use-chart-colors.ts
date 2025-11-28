"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ChartColors {
  income: string;
  expense: string;
  balance: string;
  primary: string;
  muted: string;
}

const LIGHT_COLORS: ChartColors = {
  income: "hsl(160, 84%, 39%)", // --finance-gain
  expense: "hsl(0, 72%, 51%)", // --finance-loss
  balance: "hsl(217, 91%, 60%)", // --primary / --chart-1
  primary: "hsl(217, 91%, 60%)",
  muted: "hsl(215, 16%, 47%)",
};

const DARK_COLORS: ChartColors = {
  income: "hsl(160, 84%, 45%)", // --finance-gain dark
  expense: "hsl(0, 72%, 55%)", // --finance-loss dark
  balance: "hsl(217, 91%, 65%)", // --primary dark / --chart-1 dark
  primary: "hsl(217, 91%, 65%)",
  muted: "hsl(215, 20%, 65%)",
};

export function useChartColors(): ChartColors {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState<ChartColors>(LIGHT_COLORS);

  useEffect(() => {
    setColors(resolvedTheme === "dark" ? DARK_COLORS : LIGHT_COLORS);
  }, [resolvedTheme]);

  return colors;
}
