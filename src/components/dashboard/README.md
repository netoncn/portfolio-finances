# Dashboard Components

This directory contains reusable components for building dashboard interfaces with KPIs and metrics.

## Components

### KPICard

A reusable card component for displaying key performance indicators (KPIs) with:
- Main value display
- Icon with customizable colors
- Optional description text
- Trend indicator (percentage change with up/down arrows)
- Loading state with skeleton
- Click handler for navigation

**Usage:**

```tsx
import { KPICard } from "@/components/dashboard/KPICard";
import { TrendingUp } from "lucide-react";

<KPICard
  title="Total Revenue"
  value="$45,231"
  icon={TrendingUp}
  iconColor="text-green-600"
  iconBgColor="bg-green-600/10"
  description="vs. last month"
  trend={{
    value: 12.5,
    label: "vs. last month"
  }}
  isLoading={false}
  onClick={() => console.log("Navigate to details")}
/>
```

### PeriodFilter

A dropdown filter for selecting time periods with predefined options:
- Current Month
- Last 30 Days
- Last 90 Days
- Current Year

**Usage:**

```tsx
import { PeriodFilter, type PeriodType } from "@/components/dashboard/PeriodFilter";
import { useState } from "react";

const [period, setPeriod] = useState<PeriodType>("current_month");

<PeriodFilter value={period} onChange={setPeriod} />
```

## Hooks

### useDashboardMetrics

A custom hook for fetching and calculating financial metrics for a given period:

**Features:**
- Fetches transactions for current and previous periods
- Calculates income, expenses, balance, and transaction count
- Computes trend percentages (comparison with previous period)
- Automatic caching with React Query
- Loading and error states

**Usage:**

```tsx
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";

const { metrics, isLoading, error } = useDashboardMetrics("current_month");

// Access metrics
console.log(metrics.totalIncome);     // Total income in cents
console.log(metrics.totalExpense);    // Total expenses in cents
console.log(metrics.balance);         // Balance (income - expense)
console.log(metrics.transactionCount);// Number of transactions
console.log(metrics.trends.income);   // Income trend percentage
```

## Layout Structure

The dashboard uses a responsive grid layout:

1. **Header** - Welcome message with period filter and action button
2. **Financial Metrics** - 4 KPI cards showing income, expenses, balance, and transaction count
3. **Account Summary** - 4 KPI cards showing account statistics
4. **Content Grid** - 2/3 recent accounts list + 1/3 quick actions sidebar

All sections are responsive and adapt to mobile, tablet, and desktop screens.
