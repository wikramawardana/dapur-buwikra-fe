"use client";

import { Calendar, Eye, EyeOff, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCardSkeleton } from "@/components/ui/page-loading";
import { formatCurrency } from "@/lib/format";
import type { OrderStats } from "@/types/order.types";

interface OrderStatsCardsProps {
  stats: OrderStats | null;
  isLoading?: boolean;
}

export function OrderStatsCards({ stats, isLoading }: OrderStatsCardsProps) {
  const [showRevenue, setShowRevenue] = useState(false);

  if (isLoading) {
    return (
      <div className="grid gap-3 grid-cols-3 sm:gap-4">
        <StatsCardSkeleton color="blue" />
        <StatsCardSkeleton color="purple" />
        <StatsCardSkeleton color="green" />
      </div>
    );
  }

  return (
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
            {showRevenue ? formatCurrency(stats?.total_sum ?? 0) : "Rp ••••••"}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10px] text-green-500 sm:text-xs">
            <span>
              Paid:{" "}
              <span className="font-semibold text-green-700">
                {showRevenue ? formatCurrency(stats?.paid_sum ?? 0) : "••••••"}
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
  );
}
