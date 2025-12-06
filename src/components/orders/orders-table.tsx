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
        accessorKey: "dates",
        header: () => <div className="text-left font-semibold">Date & Day</div>,
        cell: ({ row }) => {
          const dates = row.getValue("dates") as string[];
          const days = (row.original as Order).days;
          return (
            <div className="font-medium text-left text-blue-600">
              {dates.map((date, idx) => (
                <div key={idx}>
                  <span className="font-semibold">{days[idx]}</span> -{" "}
                  {formatDate(date)}
                </div>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "ordered",
        header: () => <div className="text-left font-semibold">Ordered</div>,
        cell: ({ row }) => (
          <div className="text-left text-gray-700">
            {row.getValue("ordered")}
          </div>
        ),
      },
      {
        accessorKey: "notes",
        header: () => <div className="text-left font-semibold">Notes</div>,
        cell: ({ row }) => (
          <div className="text-left text-gray-500">
            {row.getValue("notes") || "-"}
          </div>
        ),
      },
      {
        accessorKey: "total_price",
        header: () => (
          <div className="text-left font-semibold">Total Price</div>
        ),
        cell: ({ row }) => (
          <div className="text-left font-bold text-green-600">
            {formatCurrency(row.getValue("total_price"))}
          </div>
        ),
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
    return <TableSkeleton rows={5} columns={isMobile ? 3 : 7} />;
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
                  <h3 className="font-bold text-black truncate">{order.name}</h3>
                  <div className="mt-1 text-sm text-blue-600">
                    {order.dates.map((date, idx) => (
                      <div key={idx} className="truncate">
                        <span className="font-semibold">{order.days[idx]}</span> - {formatDate(date)}
                      </div>
                    ))}
                  </div>
                </div>
                <OrderActionDialog
                  order={order}
                  onOrderUpdated={onOrderUpdated}
                  onOrderDeleted={onOrderDeleted}
                />
              </div>
              
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Ordered:</span>
                  <span className="text-gray-700 text-right max-w-[60%] truncate">{order.ordered}</span>
                </div>
                {order.notes && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Notes:</span>
                    <span className="text-gray-500 italic text-right max-w-[60%] truncate">{order.notes}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="font-bold text-green-600">{formatCurrency(order.total_price)}</span>
                  <StatusBadge status={order.payment_status} type="payment" />
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
