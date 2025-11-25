"use client";

import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    label: string;
  };
  iconColor?: string;
  iconBgColor?: string;
  isLoading?: boolean;
  onClick?: () => void;
  featured?: boolean;
  featuredColor?: string;
}

export function KPICard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
  isLoading = false,
  onClick,
  featured = false,
  featuredColor = "bg-orange-500",
}: KPICardProps) {
  const isPositiveTrend = trend && trend.value > 0;
  const isNegativeTrend = trend && trend.value < 0;

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-lg border-none",
        onClick && "cursor-pointer",
        featured
          ? cn(featuredColor, "text-white shadow-lg hover:shadow-xl")
          : "bg-white dark:bg-gray-900 shadow-md hover:shadow-lg",
      )}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p
              className={cn(
                "text-sm mb-1",
                featured ? "text-white/90" : "text-muted-foreground",
              )}
            >
              {title}
            </p>
            <p className="text-2xl font-bold">
              {isLoading ? (
                <span
                  className={cn(
                    "inline-block h-8 w-24 animate-pulse rounded",
                    featured ? "bg-white/20" : "bg-muted",
                  )}
                />
              ) : (
                value
              )}
            </p>
            {description && (
              <p
                className={cn(
                  "mt-2 text-xs",
                  featured ? "text-white/80" : "text-muted-foreground",
                )}
              >
                {description}
              </p>
            )}
            {trend && (
              <div className="mt-2 flex items-center gap-1">
                {isPositiveTrend && (
                  <ArrowUp
                    className={cn(
                      "h-3 w-3",
                      featured ? "text-white" : "text-green-600",
                    )}
                  />
                )}
                {isNegativeTrend && (
                  <ArrowDown
                    className={cn(
                      "h-3 w-3",
                      featured ? "text-white" : "text-red-600",
                    )}
                  />
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    featured && "text-white",
                    !featured && isPositiveTrend && "text-green-600",
                    !featured && isNegativeTrend && "text-red-600",
                    !featured &&
                      !isPositiveTrend &&
                      !isNegativeTrend &&
                      "text-muted-foreground",
                  )}
                >
                  {Math.abs(trend.value).toFixed(1)}% {trend.label}
                </span>
              </div>
            )}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-lg",
              featured ? "bg-white/20" : iconBgColor,
            )}
          >
            <Icon
              className={cn("h-6 w-6", featured ? "text-white" : iconColor)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
