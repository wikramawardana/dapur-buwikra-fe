"use client";

import type { RowSelectionState } from "@tanstack/react-table";
import * as React from "react";
import { toast } from "sonner";
import { BulkActionsBar } from "@/components/orders/bulk-actions-bar";
import { CreateOrderDialog } from "@/components/orders/create-order-dialog";
import { ExportMarkdownButton } from "@/components/orders/export-markdown-button";
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
import { getOrders } from "@/services/orders.service";
import type { Order, OrderFilters, PaginationInfo } from "@/types/order.types";

export default function OrdersPage() {
  const { data: session, isPending: isSessionLoading } = useSession();

  const [orders, setOrders] = React.useState<Order[]>([]);
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
  const ordersRequestId = React.useRef(0);

  // Row selection state for bulk actions
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const isAuthenticated = !!session?.user;

  React.useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const paymentStatus = searchParams.get("payment_status");

    if (!dateFrom && !dateTo && !paymentStatus) return;

    setFilters((current) => ({
      ...current,
      date_from: dateFrom || current.date_from,
      date_to: dateTo || current.date_to,
      payment_status:
        paymentStatus === "paid" ||
        paymentStatus === "unpaid" ||
        paymentStatus === "partial"
          ? paymentStatus
          : current.payment_status,
      page: 1,
    }));
  }, []);

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

  // Fetch data when authenticated and when filters change
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only react to filters changes, not callback identity changes
  React.useEffect(() => {
    if (!isAuthenticated) return;

    fetchOrders();
  }, [isAuthenticated, filters]);

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
              }}
            />
          </div>
          <WeekSelector
            value={getWeekValue(filters.date_from || defaultWeek.dateFrom)}
            onChange={handleWeekChange}
          />
        </CardHeader>
        <CardContent className="space-y-4 px-3 sm:space-y-6 sm:px-6">
          <OrdersFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
          <div className="flex items-center justify-between gap-3">
            {isLoading ? (
              <div
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
                role="status"
              >
                <Spinner className="h-3.5 w-3.5" />
                Updating results...
              </div>
            ) : (
              <p className="text-xs font-medium text-muted-foreground">
                {pagination.total_items} order
                {pagination.total_items === 1 ? "" : "s"} found
              </p>
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
            }}
            onOrderDeleted={() => {
              fetchOrders();
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
