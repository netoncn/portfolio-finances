import { Skeleton } from "@/components/ui/skeleton";

interface ChartSkeletonProps {
  height?: string;
  showLegend?: boolean;
  showTitle?: boolean;
}

export function ChartSkeleton({
  height = "h-80",
  showLegend = true,
  showTitle = true,
}: ChartSkeletonProps) {
  return (
    <div
      className="rounded-lg border bg-card p-6"
      role="status"
      aria-label="Loading chart..."
      aria-busy="true"
    >
      {showTitle && <Skeleton className="h-6 w-48 mb-4" />}
      <div className={`${height} flex items-end gap-2 mb-4`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            style={{
              height: `${Math.random() * 60 + 40}%`,
            }}
          />
        ))}
      </div>
      {showLegend && (
        <div className="flex gap-4 justify-center">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PieChartSkeleton({
  showTitle = true,
}: {
  showTitle?: boolean;
}) {
  return (
    <div
      className="rounded-lg border bg-card p-6"
      role="status"
      aria-label="Loading chart..."
      aria-busy="true"
    >
      {showTitle && <Skeleton className="h-6 w-48 mb-4" />}
      <div className="flex items-center justify-center py-8">
        <Skeleton className="h-48 w-48 rounded-full" />
      </div>
      <div className="space-y-2 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-sm" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
