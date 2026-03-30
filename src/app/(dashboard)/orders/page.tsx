"use client";

import * as React from "react";
import { toast } from "sonner";
import { CreateOrderDialog } from "@/components/orders/create-order-dialog";
import { ExportMarkdownButton } from "@/components/orders/export-markdown-button";
import { OrderStatsCards } from "@/components/orders/order-stats-cards";
import { OrdersFilters } from "@/components/orders/orders-filters";
import { OrdersPagination } from "@/components/orders/orders-pagination";
import { OrdersTable } from "@/components/orders/orders-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/auth-client";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import {
  getOrders,
  getOrdersCount,
  getOrdersCountByDay,
  getOrdersSum,
} from "@/services/orders.service";
import type {
  Order,
  OrderFilters,
  OrderStats,
  PaginationInfo,
} from "@/types/order.types";

export default function OrdersPage() {
  const { data: session, isPending: isSessionLoading } = useSession();

  const [orders, setOrders] = React.useState<Order[]>([]);
  const [stats, setStats] = React.useState<OrderStats | null>(null);
  const [pagination, setPagination] = React.useState<PaginationInfo>({
    page: 1,
    page_size: DEFAULT_PAGE_SIZE,
    total_items: 0,
    total_pages: 0,
  });
  // Default filters: sort by date descending, no date filters
  const [filters, setFilters] = React.useState<OrderFilters>({
    page: 1,
    page_size: 20,
    sort_by: "date",
    sort_order: "desc",
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [isStatsLoading, setIsStatsLoading] = React.useState(true);

  const isAuthenticated = !!session?.user;

  const fetchOrders = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getOrders(filters);
      setOrders(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      // Don't show toast for auth errors - let the redirect handle it
      if (error instanceof Error && error.message.includes("401")) {
        return;
      }
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch orders",
      );
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const fetchStats = React.useCallback(async () => {
    setIsStatsLoading(true);
    try {
      // Get stats with the same filters (excluding pagination)
      const statsFilters = { ...filters };
      delete statsFilters.page;
      delete statsFilters.page_size;

      // Call all APIs in parallel
      const [countResponse, sumResponse, countByDayResponse] =
        await Promise.all([
          getOrdersCount(statsFilters),
          getOrdersSum(statsFilters),
          getOrdersCountByDay(statsFilters),
        ]);

      // Combine the results
      setStats({
        total_count: countResponse.data.total_count,
        count_monday: countResponse.data.monday,
        count_tuesday: countResponse.data.tuesday,
        count_wednesday: countResponse.data.wednesday,
        count_thursday: countResponse.data.thursday,
        count_friday: countResponse.data.friday,
        total_sum: sumResponse.data.total_amount,
        paid_sum: sumResponse.data.paid_amount,
        unpaid_sum: sumResponse.data.unpaid_amount,
        count_by_day: countByDayResponse.data.total,
        total_nasi: countByDayResponse.data.total_nasi,
        total_kulit_kecil: countByDayResponse.data.total_kulit_kecil,
        total_kulit_besar: countByDayResponse.data.total_kulit_besar,
      });
    } catch (error) {
      // Don't show toast for auth errors - let the redirect handle it
      if (error instanceof Error && error.message.includes("401")) {
        return;
      }
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch statistics",
      );
      setStats(null);
    } finally {
      setIsStatsLoading(false);
    }
  }, [filters]);

  // Fetch data when authenticated and when filters change
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only react to filters changes, not callback identity changes
  React.useEffect(() => {
    if (!isAuthenticated) return;

    fetchOrders();
    fetchStats();
  }, [isAuthenticated, filters]);

  const handleFiltersChange = (newFilters: OrderFilters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handlePageSizeChange = (pageSize: number) => {
    setFilters({ ...filters, page_size: pageSize, page: 1 });
  };

  if (isSessionLoading || !session?.user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-2 sm:p-4">
      <Card className="neo-brutal neo-brutal-white border-2">
        <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold sm:text-2xl">
              Orders Management
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Manage and track all customer orders
            </CardDescription>
          </div>
          <CreateOrderDialog
            onOrderCreated={() => {
              fetchOrders();
              fetchStats();
            }}
          />
        </CardHeader>
        <CardContent className="space-y-4 px-3 sm:space-y-6 sm:px-6">
          {session?.user?.role !== "user" && (
            <OrderStatsCards
              stats={stats}
              filters={filters}
              isLoading={isStatsLoading}
            />
          )}
          <OrdersFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
          <div className="flex justify-end">
            <ExportMarkdownButton filters={filters} disabled={isLoading} />
          </div>
          <OrdersTable
            orders={orders}
            isLoading={isLoading}
            onOrderUpdated={() => {
              fetchOrders();
              fetchStats();
            }}
            onOrderDeleted={() => {
              fetchOrders();
              fetchStats();
            }}
          />
          {!isLoading && orders.length > 0 && (
            <OrdersPagination
              pagination={pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
