"use client";

import { format } from "date-fns";
import { Calendar, Eye, EyeOff, Filter, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCardSkeleton } from "@/components/ui/page-loading";
import { formatCurrency } from "@/lib/format";
import type { OrderFilters, OrderStats } from "@/types/order.types";

interface OrderStatsCardsProps {
  stats: OrderStats | null;
  filters?: OrderFilters;
  isLoading?: boolean;
}

/**
 * Format the date range for display
 */
function formatDateRange(dateFrom?: string, dateTo?: string): string | null {
  if (!dateFrom && !dateTo) return null;

  try {
    if (dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      return `${format(from, "dd MMM")} - ${format(to, "dd MMM yyyy")}`;
    }
    if (dateFrom) {
      return `From ${format(new Date(dateFrom), "dd MMM yyyy")}`;
    }
    if (dateTo) {
      return `Until ${format(new Date(dateTo), "dd MMM yyyy")}`;
    }
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

  // Build filter context info
  const dateRange = formatDateRange(filters?.date_from, filters?.date_to);
  const hasFilters =
    filters?.search || filters?.name || filters?.day || filters?.payment_status;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="grid gap-3 grid-cols-3 sm:gap-4">
          <StatsCardSkeleton color="blue" />
          <StatsCardSkeleton color="purple" />
          <StatsCardSkeleton color="green" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Filter Context Info */}
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
        {filters?.day && (
          <Badge variant="secondary" className="text-xs font-normal">
            {filters.day}
          </Badge>
        )}
        {filters?.payment_status && (
          <Badge variant="secondary" className="text-xs font-normal">
            {filters.payment_status === "paid" ? "💰 Paid" : "⏳ Unpaid"}
          </Badge>
        )}
        {filters?.name && (
          <Badge variant="secondary" className="text-xs font-normal">
            👤 {filters.name}
          </Badge>
        )}
        {!dateRange && !hasFilters && (
          <span className="text-muted-foreground/70 italic">
            No filters applied - showing all data
          </span>
        )}
      </div>

      <div className="grid gap-3 grid-cols-3 sm:gap-4">
        <Card className="neo-brutal bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
            <CardTitle className="text-xs font-medium text-blue-600 sm:text-sm">
              Total Order User
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500 sm:h-5 sm:w-5" />
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-xl font-bold text-blue-700 sm:text-3xl">
              {stats?.total_count ?? 0}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10px] text-blue-500 sm:text-xs">
              {stats?.count_monday !== undefined && (
                <>
                  <span>
                    Mon:{" "}
                    <span className="font-semibold text-blue-700">
                      {stats.count_monday}
                    </span>
                  </span>
                  <span className="text-blue-300">•</span>
                </>
              )}
              {stats?.count_tuesday !== undefined && (
                <>
                  <span>
                    Tue:{" "}
                    <span className="font-semibold text-blue-700">
                      {stats.count_tuesday}
                    </span>
                  </span>
                  <span className="text-blue-300">•</span>
                </>
              )}
              {stats?.count_wednesday !== undefined && (
                <>
                  <span>
                    Wed:{" "}
                    <span className="font-semibold text-blue-700">
                      {stats.count_wednesday}
                    </span>
                  </span>
                  <span className="text-blue-300">•</span>
                </>
              )}
              {stats?.count_thursday !== undefined && (
                <>
                  <span>
                    Thu:{" "}
                    <span className="font-semibold text-blue-700">
                      {stats.count_thursday}
                    </span>
                  </span>
                  <span className="text-blue-300">•</span>
                </>
              )}
              {stats?.count_friday !== undefined && (
                <span>
                  Fri:{" "}
                  <span className="font-semibold text-blue-700">
                    {stats.count_friday}
                  </span>
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="neo-brutal bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
            <CardTitle className="text-xs font-medium text-purple-600 sm:text-sm">
              Total Order By Day
            </CardTitle>
            <Calendar className="h-4 w-4 text-purple-500 sm:h-5 sm:w-5" />
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-xl font-bold text-purple-700 sm:text-3xl">
              {stats?.count_by_day ?? 0}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10px] text-purple-500 sm:text-xs">
              <span>
                Nasi:{" "}
                <span className="font-semibold text-purple-700">
                  {stats?.total_nasi ?? 0}
                </span>
              </span>
              <span className="text-purple-300">•</span>
              <span>
                Kulit Kecil:{" "}
                <span className="font-semibold text-purple-700">
                  {stats?.total_kulit_kecil ?? 0}
                </span>
              </span>
              <span className="text-purple-300">•</span>
              <span>
                Kulit Besar:{" "}
                <span className="font-semibold text-purple-700">
                  {stats?.total_kulit_besar ?? 0}
                </span>
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="neo-brutal bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
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
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-xl font-bold text-green-700 sm:text-3xl">
              {showRevenue
                ? formatCurrency(stats?.total_sum ?? 0)
                : "Rp ••••••"}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10px] text-green-500 sm:text-xs">
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
    </div>
  );
}
