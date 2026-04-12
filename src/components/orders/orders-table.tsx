"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { TableSkeleton } from "@/components/ui/page-loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Order } from "@/types/order.types";
import { OrderActionDialog } from "./order-action-dialog";
import { StatusBadge } from "./status-badge";

interface OrdersTableProps {
  orders: Order[];
  isLoading?: boolean;
  onOrderUpdated?: () => void;
  onOrderDeleted?: () => void;
}

// Helper to calculate total from day_orders
const calculateTotal = (order: Order): number => {
  return (
    order.day_orders?.reduce((total, dayOrder) => {
      return (
        total +
        dayOrder.items.reduce((dayTotal, item) => {
          return dayTotal + item.qty * item.unit_price;
        }, 0)
      );
    }, 0) ||
    order.total_price ||
    0
  );
};

// Helper to get summary of items ordered
const getOrderedSummary = (order: Order): string => {
  if (!order.day_orders || order.day_orders.length === 0) return "-";

  // Collect unique items with total quantities
  const itemCounts: Record<string, number> = {};
  order.day_orders.forEach((dayOrder) => {
    dayOrder.items.forEach((item) => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.qty;
    });
  });

  return Object.entries(itemCounts)
    .map(([name, qty]) => `${name}${qty > 1 ? ` ×${qty}` : ""}`)
    .join(", ");
};

export function OrdersTable({
  orders,
  isLoading,
  onOrderUpdated,
  onOrderDeleted,
}: OrdersTableProps) {
  const isMobile = useIsMobile();

  const columns = React.useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: "name",
        header: () => <div className="text-left font-semibold">Name</div>,
        cell: ({ row }) => (
          <div className="text-left font-bold text-black">
            {row.getValue("name")}
          </div>
        ),
      },
      {
        accessorKey: "created_at",
        header: () => <div className="text-left font-semibold">Order Date</div>,
        cell: ({ row }) => (
          <div className="text-left text-gray-600">
            {formatDate(row.getValue("created_at"))}
          </div>
        ),
      },
      {
        id: "ordered",
        header: () => <div className="text-left font-semibold">Ordered</div>,
        cell: ({ row }) => {
          const order = row.original;
          if (!order.day_orders || order.day_orders.length === 0) {
            return <div className="text-muted-foreground">-</div>;
          }
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-left text-gray-700 max-w-[200px] truncate cursor-pointer hover:underline">
                  {getOrderedSummary(order)}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-sm">
                <div className="space-y-2">
                  {order.day_orders.map((dayOrder, idx) => (
                    <div key={idx}>
                      <p className="font-semibold text-sm">
                        {dayOrder.day} — {formatDate(dayOrder.date)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dayOrder.items
                          .map(
                            (item) =>
                              `${item.name}${item.qty > 1 ? ` ×${item.qty}` : ""}`,
                          )
                          .join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        },
      },
      {
        accessorKey: "notes",
        header: () => <div className="text-left font-semibold">Notes</div>,
        cell: ({ row }) => {
          const notes = row.getValue("notes") as string;
          if (!notes) return <div className="text-left text-gray-400">-</div>;
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-left text-gray-500 max-w-[180px] line-clamp-2 cursor-pointer italic">
                  {notes}
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-sm whitespace-pre-wrap">{notes}</p>
              </TooltipContent>
            </Tooltip>
          );
        },
      },
      {
        id: "total_price",
        header: () => (
          <div className="text-left font-semibold">Total Price</div>
        ),
        cell: ({ row }) => (
          <div className="text-left font-bold text-green-600">
            {formatCurrency(calculateTotal(row.original))}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="text-left font-semibold">Status</div>,
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="flex flex-col gap-1">
              <StatusBadge status={order.status} type="order" />
              {order.rejection_reason && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-red-500 cursor-help truncate max-w-[100px]">
                      {order.rejection_reason}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{order.rejection_reason}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "payment_status",
        header: () => <div className="text-left font-semibold">Payment</div>,
        cell: ({ row }) => (
          <div className="flex justify-left">
            <StatusBadge
              status={row.getValue("payment_status")}
              type="payment"
            />
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center font-semibold">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <OrderActionDialog
              order={row.original}
              onOrderUpdated={onOrderUpdated}
              onOrderDeleted={onOrderDeleted}
            />
          </div>
        ),
      },
    ],
    [onOrderUpdated, onOrderDeleted],
  );

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return <TableSkeleton rows={5} columns={isMobile ? 3 : 9} />;
  }

  if (orders.length === 0) {
    return (
      <div className="neo-brutal neo-brutal-white p-4 sm:p-8">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No orders found</EmptyTitle>
            <EmptyDescription>
              No orders match your current filters. Try adjusting your search
              criteria.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  // Mobile card view
  if (isMobile) {
    return (
      <div className="space-y-3">
        {orders.map((order) => (
          <Card key={order.id} className="neo-brutal neo-brutal-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-black truncate">
                    {order.name}
                  </h3>
                </div>
                <OrderActionDialog
                  order={order}
                  onOrderUpdated={onOrderUpdated}
                  onOrderDeleted={onOrderDeleted}
                />
              </div>

              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-gray-500 shrink-0">Ordered:</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-gray-700 text-right cursor-pointer hover:underline">
                        {getOrderedSummary(order)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-sm">
                      <div className="space-y-2">
                        {order.day_orders?.map((dayOrder, idx) => (
                          <div key={idx}>
                            <p className="font-semibold text-sm">
                              {dayOrder.day} — {formatDate(dayOrder.date)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {dayOrder.items
                                .map(
                                  (item) =>
                                    `${item.name}${item.qty > 1 ? ` ×${item.qty}` : ""}`,
                                )
                                .join(", ")}
                            </p>
                          </div>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
                {order.notes && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-gray-500 shrink-0">Notes:</span>
                    <span className="text-gray-500 italic text-right">
                      {order.notes}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="font-bold text-green-600">
                    {formatCurrency(calculateTotal(order))}
                  </span>
                  <div className="flex gap-2">
                    <StatusBadge status={order.status} type="order" />
                    <StatusBadge status={order.payment_status} type="payment" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className="neo-brutal neo-brutal-white">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className="transition-smooth hover:bg-muted/50"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
