import { ChartSkeleton, PieChartSkeleton } from "./ChartSkeleton";
import { KPICardsGridSkeleton } from "./KPICardSkeleton";
import { ListSkeleton } from "./TableSkeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading dashboard...">
      <section aria-label="Key metrics">
        <KPICardsGridSkeleton count={4} />
      </section>

      <section aria-label="Budget overview">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height="h-64" showTitle />
          <ListSkeleton items={3} />
        </div>
      </section>

      <section aria-label="Analytics charts">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PieChartSkeleton />
          <ChartSkeleton height="h-80" />
        </div>
      </section>
    </div>
  );
}
