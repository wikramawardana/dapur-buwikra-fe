"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { CreateOrderDialog } from "@/components/orders/create-order-dialog";
import { ExportMarkdownButton } from "@/components/orders/export-markdown-button";
import { OrderStatsCards } from "@/components/orders/order-stats-cards";
import { OrdersFilters } from "@/components/orders/orders-filters";
import { OrdersPagination } from "@/components/orders/orders-pagination";
import { OrdersTable } from "@/components/orders/orders-table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { UserMenu } from "@/components/user-menu";
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

/**
 * Get the current work week (Monday to Friday).
 * If today is Saturday or Sunday, return next week's Monday to Friday.
 */
function getCurrentWorkWeek(): { dateFrom: string; dateTo: string } {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  let monday: Date;

  if (dayOfWeek === 0) {
    // Sunday: get next week (Monday is tomorrow)
    monday = new Date(today);
    monday.setDate(today.getDate() + 1);
  } else if (dayOfWeek === 6) {
    // Saturday: get next week (Monday is in 2 days)
    monday = new Date(today);
    monday.setDate(today.getDate() + 2);
  } else {
    // Weekday: get current week's Monday
    monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek - 1));
  }

  // Friday is 4 days after Monday
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  return {
    dateFrom: format(monday, "yyyy-MM-dd"),
    dateTo: format(friday, "yyyy-MM-dd"),
  };
}

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();

  const [orders, setOrders] = React.useState<Order[]>([]);
  const [allOrdersForExport, setAllOrdersForExport] = React.useState<Order[]>(
    [],
  );
  const [stats, setStats] = React.useState<OrderStats | null>(null);
  const [pagination, setPagination] = React.useState<PaginationInfo>({
    page: 1,
    page_size: DEFAULT_PAGE_SIZE,
    total_items: 0,
    total_pages: 0,
  });
  const [isExportLoading, setIsExportLoading] = React.useState(false);

  // Get current work week for default date filter
  const defaultWorkWeek = React.useMemo(() => getCurrentWorkWeek(), []);

  const [filters, setFilters] = React.useState<OrderFilters>({
    page: 1,
    page_size: 20,
    sort_by: "name",
    sort_order: "asc",
    date_from: defaultWorkWeek.dateFrom,
    date_to: defaultWorkWeek.dateTo,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [isStatsLoading, setIsStatsLoading] = React.useState(true);

  // Track if user is authenticated (stable boolean instead of object reference)
  const isAuthenticated = !!session?.user;

  // Check authentication and redirect if not logged in
  React.useEffect(() => {
    if (!isSessionLoading && !session?.user) {
      router.replace(`/login?callbackUrl=${encodeURIComponent("/orders")}`);
    }
  }, [session, isSessionLoading, router]);

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

  const fetchAllOrdersForExport = React.useCallback(async () => {
    setIsExportLoading(true);
    try {
      // Fetch all orders with page_size 100 for export
      const exportFilters = { ...filters, page: 1, page_size: 100 };
      const response = await getOrders(exportFilters);
      setAllOrdersForExport(response.data.data);
    } catch (error) {
      // Silently fail for export - user can retry
      console.error("Failed to fetch orders for export:", error);
      setAllOrdersForExport([]);
    } finally {
      setIsExportLoading(false);
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
        total_count: countResponse.data.count,
        total_sum: sumResponse.data.total_amount,
        count_by_day: countByDayResponse.data.total,
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
    fetchAllOrdersForExport();
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

  // Show loading state while checking session
  if (isSessionLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // Don't render content if not authenticated (redirect is happening)
  if (!session?.user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Orders</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <UserMenu />
        </div>
      </header>

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
              <OrderStatsCards stats={stats} isLoading={isStatsLoading} />
            )}
            <OrdersFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
            <div className="flex justify-end">
              <ExportMarkdownButton
                orders={allOrdersForExport}
                disabled={isLoading || isExportLoading}
                dayFilter={filters.day}
              />
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
    </>
  );
}
