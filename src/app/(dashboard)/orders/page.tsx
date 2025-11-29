"use client";

import * as React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OrdersTable } from "@/components/orders/orders-table";
import { OrdersFilters } from "@/components/orders/orders-filters";
import { OrdersPagination } from "@/components/orders/orders-pagination";
import { CreateOrderDialog } from "@/components/orders/create-order-dialog";
import { OrderStatsCards } from "@/components/orders/order-stats-cards";
import {
  getOrders,
  getOrdersCount,
  getOrdersSum,
} from "@/services/orders.service";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type {
  Order,
  OrderFilters,
  PaginationInfo,
  OrderStats,
} from "@/types/order.types";
import { toast } from "sonner";
import { UserMenu } from "@/components/user-menu";

export default function OrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [stats, setStats] = React.useState<OrderStats | null>(null);
  const [pagination, setPagination] = React.useState<PaginationInfo>({
    page: 1,
    page_size: DEFAULT_PAGE_SIZE,
    total_items: 0,
    total_pages: 0,
  });
  const [filters, setFilters] = React.useState<OrderFilters>({
    page: 1,
    page_size: DEFAULT_PAGE_SIZE,
    sort_by: "created_at",
    sort_order: "desc",
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [isStatsLoading, setIsStatsLoading] = React.useState(true);

  const fetchOrders = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getOrders(filters);
      setOrders(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch orders"
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

      // Call both APIs in parallel
      const [countResponse, sumResponse] = await Promise.all([
        getOrdersCount(statsFilters),
        getOrdersSum(statsFilters),
      ]);

      // Combine the results
      setStats({
        total_count: countResponse.data.count,
        total_sum: sumResponse.data.total_amount,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch statistics"
      );
      setStats(null);
    } finally {
      setIsStatsLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [fetchOrders, fetchStats]);

  const handleFiltersChange = (newFilters: OrderFilters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handlePageSizeChange = (pageSize: number) => {
    setFilters({ ...filters, page_size: pageSize, page: 1 });
  };

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

      <div className="flex flex-1 flex-col gap-4 p-4">
        <Card className="neo-brutal neo-brutal-white border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-2xl font-bold">
                Orders Management
              </CardTitle>
              <CardDescription>
                Manage and track all customer orders
              </CardDescription>
            </div>
            <CreateOrderDialog onOrderCreated={fetchOrders} />
          </CardHeader>
          <CardContent className="space-y-6">
            <OrderStatsCards stats={stats} isLoading={isStatsLoading} />
            <OrdersFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
            <OrdersTable orders={orders} isLoading={isLoading} />
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
