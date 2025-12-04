"use client";

import { DollarSign, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCardSkeleton } from "@/components/ui/page-loading";
import { formatCurrency } from "@/lib/format";
import type { OrderStats } from "@/types/order.types";

interface OrderStatsCardsProps {
  stats: OrderStats | null;
  isLoading?: boolean;
}

export function OrderStatsCards({ stats, isLoading }: OrderStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <StatsCardSkeleton color="blue" />
        <StatsCardSkeleton color="green" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="neo-brutal bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-600">
            Total Orders
          </CardTitle>
          <ShoppingCart className="h-5 w-5 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-700">
            {stats?.total_count ?? 0}
          </div>
          <p className="text-xs text-blue-500 mt-1">Orders in current filter</p>
        </CardContent>
      </Card>
      <Card className="neo-brutal bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-600">
            Total Revenue
          </CardTitle>
          <DollarSign className="h-5 w-5 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-700">
            {formatCurrency(stats?.total_sum ?? 0)}
          </div>
          <p className="text-xs text-green-500 mt-1">
            Revenue in current filter
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
