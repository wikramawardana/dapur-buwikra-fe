"use client";

import type { RowSelectionState } from "@tanstack/react-table";
import * as React from "react";
import { toast } from "sonner";
import { BulkActionsBar } from "@/components/orders/bulk-actions-bar";
import { CreateOrderDialog } from "@/components/orders/create-order-dialog";
import { CustomerActivity } from "@/components/orders/customer-activity";
import { ExportMarkdownButton } from "@/components/orders/export-markdown-button";
import { OrderStatsCards } from "@/components/orders/order-stats-cards";
import { OrdersFilters } from "@/components/orders/orders-filters";
import { OrdersPagination } from "@/components/orders/orders-pagination";
import { OrdersTable } from "@/components/orders/orders-table";
import { WeekSelector } from "@/components/orders/week-selector";
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
import { getDefaultWeek, getWeekValue } from "@/lib/week-utils";
import {
  getOrderCustomerActivity,
  getOrders,
  getOrdersCount,
  getOrdersCountByDay,
  getOrdersSum,
} from "@/services/orders.service";
import { getWeeklyExpense } from "@/services/weekly-expense.service";
import type {
  Order,
  OrderCustomerActivity,
  OrderFilters,
  OrderStats,
  PaginationInfo,
} from "@/types/order.types";
import type { WeeklyExpense } from "@/types/weekly-expense.types";

export default function OrdersPage() {
  const { data: session, isPending: isSessionLoading } = useSession();

  const [orders, setOrders] = React.useState<Order[]>([]);
  const [stats, setStats] = React.useState<OrderStats | null>(null);
  const [customerActivity, setCustomerActivity] = React.useState<
    OrderCustomerActivity[]
  >([]);
  const [pagination, setPagination] = React.useState<PaginationInfo>({
    page: 1,
    page_size: DEFAULT_PAGE_SIZE,
    total_items: 0,
    total_pages: 0,
  });
  const defaultWeek = React.useMemo(() => getDefaultWeek(), []);
  const [filters, setFilters] = React.useState<OrderFilters>(() => ({
    page: 1,
    page_size: DEFAULT_PAGE_SIZE,
    sort_by: "name",
    sort_order: "asc",
    date_from: defaultWeek.dateFrom,
    date_to: defaultWeek.dateTo,
  }));
  const [isLoading, setIsLoading] = React.useState(true);
  const [isStatsLoading, setIsStatsLoading] = React.useState(true);
  const [isActivityLoading, setIsActivityLoading] = React.useState(true);
  const [weeklyExpense, setWeeklyExpense] =
    React.useState<WeeklyExpense | null>(null);
  const [isWeeklyExpenseLoading, setIsWeeklyExpenseLoading] =
    React.useState(true);
  const ordersRequestId = React.useRef(0);
  const statsRequestId = React.useRef(0);
  const activityRequestId = React.useRef(0);

  // Row selection state for bulk actions
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const isAuthenticated = !!session?.user;
  const canViewWeeklyProfit = session?.user?.role !== "user";

  const fetchWeeklyExpense = React.useCallback(async () => {
    if (!filters.date_from || !canViewWeeklyProfit) {
      setWeeklyExpense(null);
      setIsWeeklyExpenseLoading(false);
      return;
    }

    setIsWeeklyExpenseLoading(true);
    setWeeklyExpense(null);
    try {
      const response = await getWeeklyExpense(filters.date_from);
      setWeeklyExpense(response.data);
    } catch (error) {
      if (!(error instanceof Error && error.message.includes("401"))) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to fetch weekly shopping cost",
        );
      }
      setWeeklyExpense(null);
    } finally {
      setIsWeeklyExpenseLoading(false);
    }
  }, [canViewWeeklyProfit, filters.date_from]);

  // Derive selected orders from the selection state
  const selectedOrders = React.useMemo(
    () => orders.filter((order) => rowSelection[order.id]),
    [orders, rowSelection],
  );

  const fetchOrders = React.useCallback(async () => {
    const requestId = ++ordersRequestId.current;
    setIsLoading(true);
    try {
      const response = await getOrders(filters);
      if (requestId !== ordersRequestId.current) return;
      setOrders(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      if (requestId !== ordersRequestId.current) return;
      // Don't show toast for auth errors - let the redirect handle it
      if (error instanceof Error && error.message.includes("401")) {
        return;
      }
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch orders",
      );
      setOrders([]);
    } finally {
      if (requestId === ordersRequestId.current) {
        setIsLoading(false);
      }
    }
  }, [filters]);

  const fetchStats = React.useCallback(async () => {
    const requestId = ++statsRequestId.current;
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

      if (requestId !== statsRequestId.current) return;

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
        days_breakdown: countByDayResponse.data.days,
      });
    } catch (error) {
      if (requestId !== statsRequestId.current) return;
      // Don't show toast for auth errors - let the redirect handle it
      if (error instanceof Error && error.message.includes("401")) {
        return;
      }
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch statistics",
      );
      setStats(null);
    } finally {
      if (requestId === statsRequestId.current) {
        setIsStatsLoading(false);
      }
    }
  }, [filters]);

  const fetchCustomerActivity = React.useCallback(async () => {
    const requestId = ++activityRequestId.current;
    setIsActivityLoading(true);
    try {
      const response = await getOrderCustomerActivity();
      if (requestId === activityRequestId.current) {
        setCustomerActivity(response.data);
      }
    } catch (error) {
      if (requestId !== activityRequestId.current) return;
      if (!(error instanceof Error && error.message.includes("401"))) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to fetch customer activity",
        );
      }
      setCustomerActivity([]);
    } finally {
      if (requestId === activityRequestId.current) {
        setIsActivityLoading(false);
      }
    }
  }, []);

  // Fetch data when authenticated and when filters change
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only react to filters changes, not callback identity changes
  React.useEffect(() => {
    if (!isAuthenticated) return;

    fetchOrders();
    fetchStats();
  }, [isAuthenticated, filters]);

  React.useEffect(() => {
    if (!isAuthenticated || session?.user?.role === "user") return;

    fetchCustomerActivity();
  }, [isAuthenticated, fetchCustomerActivity, session?.user?.role]);

  React.useEffect(() => {
    if (!isAuthenticated || !canViewWeeklyProfit) return;

    fetchWeeklyExpense();
  }, [isAuthenticated, canViewWeeklyProfit, fetchWeeklyExpense]);

  // Clear selection when filters/page changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally clearing selection on filter change
  React.useEffect(() => {
    setRowSelection({});
  }, [filters]);

  const handleWeekChange = (dateFrom: string, dateTo: string) => {
    setFilters((prev) => ({
      ...prev,
      date_from: dateFrom,
      date_to: dateTo,
      page: 1,
    }));
  };

  const handleFiltersChange = (newFilters: OrderFilters) => {
    setFilters({
      ...newFilters,
      date_from: newFilters.date_from || defaultWeek.dateFrom,
      date_to: newFilters.date_to || defaultWeek.dateTo,
    });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handlePageSizeChange = (pageSize: number) => {
    setFilters({ ...filters, page_size: pageSize, page: 1 });
  };

  const handleBulkActionComplete = () => {
    fetchOrders();
    fetchStats();
    fetchCustomerActivity();
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
        <CardHeader className="flex flex-col gap-4 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                fetchCustomerActivity();
              }}
            />
          </div>
          <WeekSelector
            value={getWeekValue(filters.date_from || defaultWeek.dateFrom)}
            onChange={handleWeekChange}
          />
        </CardHeader>
        <CardContent className="space-y-4 px-3 sm:space-y-6 sm:px-6">
          {session?.user?.role !== "user" && (
            <OrderStatsCards
              stats={stats}
              filters={filters}
              isLoading={isStatsLoading}
              weeklyExpense={weeklyExpense}
              isWeeklyExpenseLoading={isWeeklyExpenseLoading}
              onWeeklyExpenseSaved={setWeeklyExpense}
            />
          )}
          {session?.user?.role !== "user" && (
            <CustomerActivity
              activities={customerActivity}
              isLoading={isActivityLoading}
            />
          )}
          <OrdersFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
          <div className="flex items-center justify-between gap-3">
            {isLoading || isStatsLoading ? (
              <div
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
                role="status"
              >
                <Spinner className="h-3.5 w-3.5" />
                Updating results...
              </div>
            ) : (
              <div />
            )}
            <ExportMarkdownButton filters={filters} disabled={isLoading} />
          </div>
          {session?.user?.role !== "user" && (
            <BulkActionsBar
              selectedOrders={selectedOrders}
              onActionComplete={handleBulkActionComplete}
              onClearSelection={() => setRowSelection({})}
            />
          )}
          <OrdersTable
            orders={orders}
            isLoading={isLoading}
            onOrderUpdated={() => {
              fetchOrders();
              fetchStats();
              fetchCustomerActivity();
            }}
            onOrderDeleted={() => {
              fetchOrders();
              fetchStats();
              fetchCustomerActivity();
            }}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
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
