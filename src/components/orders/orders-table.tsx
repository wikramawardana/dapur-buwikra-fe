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
        accessorKey: "qty",
        header: () => <div className="text-left">Qty</div>,
        cell: ({ row }) => (
          <div className="text-left">{row.getValue("qty")}</div>
        ),
      },
      {
        accessorKey: "unit_price",
        header: () => <div className="text-left">Unit Price</div>,
        cell: ({ row }) => (
          <div className="text-left">
            {formatCurrency(row.getValue("unit_price"))}
          </div>
        ),
      },
      {
        accessorKey: "total_price",
        header: () => <div className="text-left">Total</div>,
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
              <TableHead className="text-left">Name</TableHead>
              <TableHead className="text-left">Date & Day</TableHead>
              <TableHead className="text-left">Ordered</TableHead>
              <TableHead className="text-left">Qty</TableHead>
              <TableHead className="text-left">Unit Price</TableHead>
              <TableHead className="text-left">Total</TableHead>
              <TableHead className="text-left">Status</TableHead>
              <TableHead className="text-left">Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 8 }).map((_, j) => (
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
