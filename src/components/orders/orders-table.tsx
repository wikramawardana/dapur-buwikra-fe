"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { StatusBadge } from "./status-badge";
import { formatCurrency, formatDate } from "@/lib/format";

import type { Order } from "@/types/order.types";

interface OrdersTableProps {
  orders: Order[];
  isLoading?: boolean;
}

export function OrdersTable({ orders, isLoading }: OrdersTableProps) {
  const columns = React.useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: "date",
        header: () => <div className="text-center">Date</div>,
        cell: ({ row }) => (
          <div className="font-medium text-center">
            {formatDate(row.getValue("date"))}
          </div>
        ),
      },
      {
        accessorKey: "day",
        header: () => <div className="text-center">Day</div>,
        cell: ({ row }) => (
          <div className="text-center">{row.getValue("day")}</div>
        ),
      },
      {
        accessorKey: "name",
        header: () => <div className="text-center">Name</div>,
        cell: ({ row }) => (
          <div className="text-center">{row.getValue("name")}</div>
        ),
      },
      {
        accessorKey: "ordered",
        header: () => <div className="text-center">Ordered</div>,
        cell: ({ row }) => (
          <div className="text-center">{row.getValue("ordered")}</div>
        ),
      },
      {
        accessorKey: "qty",
        header: () => <div className="text-center">Qty</div>,
        cell: ({ row }) => (
          <div className="text-center">{row.getValue("qty")}</div>
        ),
      },
      {
        accessorKey: "unit_price",
        header: () => <div className="text-center">Unit Price</div>,
        cell: ({ row }) => (
          <div className="text-center">
            {formatCurrency(row.getValue("unit_price"))}
          </div>
        ),
      },
      {
        accessorKey: "total_price",
        header: () => <div className="text-center">Total</div>,
        cell: ({ row }) => (
          <div className="text-center font-semibold">
            {formatCurrency(row.getValue("total_price"))}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <StatusBadge status={row.getValue("status")} type="order" />
          </div>
        ),
      },
      {
        accessorKey: "payment_status",
        header: () => <div className="text-center">Payment</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <StatusBadge
              status={row.getValue("payment_status")}
              type="payment"
            />
          </div>
        ),
      },
    ],
    []
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
              <TableHead className="text-center">Date</TableHead>
              <TableHead className="text-center">Day</TableHead>
              <TableHead className="text-center">Name</TableHead>
              <TableHead className="text-center">Ordered</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead className="text-center">Unit Price</TableHead>
              <TableHead className="text-center">Total</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 9 }).map((_, j) => (
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
                        header.getContext()
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
