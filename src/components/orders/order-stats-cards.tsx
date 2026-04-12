"use client";

import { format } from "date-fns";
import { Eye, EyeOff, Filter, ShoppingCart, Utensils } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import type { OrderFilters, OrderStats } from "@/types/order.types";

interface OrderStatsCardsProps {
  stats: OrderStats | null;
  filters?: OrderFilters;
  isLoading?: boolean;
}

const DAYS = [
  { name: "Monday", short: "Mon", countKey: "count_monday" as const },
  { name: "Tuesday", short: "Tue", countKey: "count_tuesday" as const },
  { name: "Wednesday", short: "Wed", countKey: "count_wednesday" as const },
  { name: "Thursday", short: "Thu", countKey: "count_thursday" as const },
  { name: "Friday", short: "Fri", countKey: "count_friday" as const },
];

function formatDateRange(dateFrom?: string, dateTo?: string): string | null {
  if (!dateFrom && !dateTo) return null;
  try {
    if (dateFrom && dateTo) {
      return `${format(new Date(dateFrom), "dd MMM")} - ${format(new Date(dateTo), "dd MMM yyyy")}`;
    }
    if (dateFrom) return `From ${format(new Date(dateFrom), "dd MMM yyyy")}`;
    if (dateTo) return `Until ${format(new Date(dateTo), "dd MMM yyyy")}`;
  } catch {
    return null;
  }
  return null;
}

export function OrderStatsCards({
  stats,
  filters,
  isLoading,
}: OrderStatsCardsProps) {
  const [showRevenue, setShowRevenue] = useState(false);

  const dateRange = formatDateRange(filters?.date_from, filters?.date_to);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid gap-3 grid-cols-2">
          <Skeleton className="h-28 rounded-none" />
          <Skeleton className="h-28 rounded-none" />
        </div>
        <div className="grid gap-2 grid-cols-5">
          {DAYS.map((d) => (
            <Skeleton key={d.name} className="h-24 rounded-none" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter Context */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Filter className="h-3 w-3" />
        <span className="font-medium">Stats for:</span>
        {dateRange ? (
          <Badge variant="secondary" className="text-xs font-normal">
            📅 {dateRange}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs font-normal">
            All dates
          </Badge>
        )}
      </div>

      {/* Row 1: Summary cards */}
      <div className="grid gap-3 grid-cols-2">
        {/* Total Orders */}
        <Card className="neo-brutal bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-blue-600 sm:text-sm">
              Total Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500 sm:h-5 sm:w-5" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-blue-700 sm:text-3xl">
              {stats?.total_count ?? 0}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-blue-500 sm:text-xs font-medium">
              <Utensils className="h-3 w-3" />
              <span>Total Nasi:</span>
              <span className="font-bold text-blue-700">
                {stats?.total_nasi ?? 0}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue — kept */}
        <Card className="neo-brutal bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-green-600 sm:text-sm">
              Total Revenue
            </CardTitle>
            <button
              type="button"
              onClick={() => setShowRevenue(!showRevenue)}
              className="p-0.5 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
              aria-label={showRevenue ? "Hide revenue" : "Show revenue"}
            >
              {showRevenue ? (
                <Eye className="h-4 w-4 text-green-500 sm:h-5 sm:w-5" />
              ) : (
                <EyeOff className="h-4 w-4 text-green-500 sm:h-5 sm:w-5" />
              )}
            </button>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-green-700 sm:text-3xl">
              {showRevenue
                ? formatCurrency(stats?.total_sum ?? 0)
                : "Rp ••••••"}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 mt-1.5 text-[11px] text-green-500 sm:text-xs">
              <span>
                Paid:{" "}
                <span className="font-semibold text-green-700">
                  {showRevenue
                    ? formatCurrency(stats?.paid_sum ?? 0)
                    : "••••••"}
                </span>
              </span>
              <span className="text-green-300">•</span>
              <span>
                Unpaid:{" "}
                <span className="font-semibold text-red-600">
                  {showRevenue
                    ? formatCurrency(stats?.unpaid_sum ?? 0)
                    : "••••••"}
                </span>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Per-day breakdown */}
      <div className="grid gap-2 grid-cols-5">
        {DAYS.map(({ name, short, countKey }) => {
          const userCount = stats?.[countKey] ?? 0;
          const nasiCount =
            stats?.days_breakdown?.find((d) => d.day === name)?.nasi_count ?? 0;
          const isActive = userCount > 0;

          return (
            <Card
              key={name}
              className={`neo-brutal border-2 transition-opacity ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                  : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-50"
              }`}
            >
              <CardContent className="px-3 py-3 flex flex-col gap-1">
                <p
                  className={`text-[11px] font-bold uppercase tracking-wide ${isActive ? "text-blue-500" : "text-muted-foreground"}`}
                >
                  {short}
                </p>
                <p
                  className={`text-2xl font-black leading-none ${isActive ? "text-blue-700 dark:text-blue-300" : "text-muted-foreground"}`}
                >
                  {userCount}
                </p>
                <p className="text-[10px] text-muted-foreground">orders</p>
                <div
                  className={`flex items-center gap-1 mt-0.5 text-[11px] font-semibold ${isActive ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}
                >
                  <Utensils className="h-2.5 w-2.5" />
                  {nasiCount} nasi
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
