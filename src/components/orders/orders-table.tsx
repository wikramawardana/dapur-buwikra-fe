"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  const columns = React.useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: "name",
        header: () => <div className="text-left">Name</div>,
        cell: ({ row }) => (
          <div className="text-left">{row.getValue("name")}</div>
        ),
      },
      {
        accessorKey: "dates",
        header: () => <div className="text-left">Date & Day</div>,
        cell: ({ row }) => {
          const dates = row.getValue("dates") as string[];
          const days = (row.original as Order).days;
          return (
            <div className="font-medium text-left">
              {dates.map((date, idx) => (
                <div key={idx}>
                  {days[idx]} - {formatDate(date)}
                </div>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "ordered",
        header: () => <div className="text-left">Ordered</div>,
        cell: ({ row }) => (
          <div className="text-left">{row.getValue("ordered")}</div>
        ),
      },
      {
        accessorKey: "notes",
        header: () => <div className="text-left">Notes</div>,
        cell: ({ row }) => (
          <div className="text-left">{row.getValue("notes")}</div>
        ),
      },
      {
        accessorKey: "total_price",
        header: () => <div className="text-left">Total Price</div>,
        cell: ({ row }) => (
          <div className="text-left font-semibold">
            {formatCurrency(row.getValue("total_price"))}
          </div>
        ),
      },
      {
        accessorKey: "payment_status",
        header: () => <div className="text-left">Payment</div>,
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
        header: () => <div className="text-center">Actions</div>,
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
    return (
      <div className="neo-brutal neo-brutal-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Name</TableHead>
              <TableHead className="text-left">Date & Day</TableHead>
              <TableHead className="text-left">Ordered</TableHead>
              <TableHead className="text-left">Notes</TableHead>
              <TableHead className="text-left">Total Price</TableHead>
              <TableHead className="text-left">Payment</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="neo-brutal neo-brutal-white p-8">
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
