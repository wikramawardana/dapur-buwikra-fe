"use client";

import { Check, Copy } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DAYS_OF_WEEK } from "@/lib/constants";
import type { Order } from "@/types/order.types";

interface ExportMarkdownButtonProps {
  orders: Order[];
  disabled?: boolean;
  dayFilter?: string; // "all" or specific day like "Monday"
}

function ordersToMarkdown(orders: Order[], dayFilter?: string): string {
  if (orders.length === 0) {
    return "No orders to export.";
  }

  const lines: string[] = [];

  // Determine which days to show based on filter
  const daysToShow =
    !dayFilter || dayFilter === "all" || dayFilter === ""
      ? DAYS_OF_WEEK
      : [dayFilter];

  // Group orders by day from day_orders structure
  const ordersByDay: Record<
    string,
    { name: string; items: string; notes: string }[]
  > = {};
  for (const day of DAYS_OF_WEEK) {
    ordersByDay[day] = [];
  }

  // Track unique orders for total count
  const uniqueOrderIds = new Set<string>();
  let totalOrderByDay = 0;

  for (const order of orders) {
    // Each order now has day_orders with items per day
    if (order.day_orders && order.day_orders.length > 0) {
      for (const dayOrder of order.day_orders) {
        const day = dayOrder.day;
        if (DAYS_OF_WEEK.includes(day as (typeof DAYS_OF_WEEK)[number])) {
          // Format items for this day
          const itemsSummary = dayOrder.items
            .map((item) => `${item.name}${item.qty > 1 ? ` ×${item.qty}` : ""}`)
            .join(", ");

          ordersByDay[day].push({
            name: order.name,
            items: itemsSummary,
            notes: order.notes || "",
          });
          uniqueOrderIds.add(order.id);
          totalOrderByDay++;
        }
      }
    }
  }

  // Header info
  lines.push(`Total User Order: ${uniqueOrderIds.size}`);
  lines.push(`Total Order by Day: ${totalOrderByDay}`);
  lines.push("");

  // Build output for each day
  for (const day of daysToShow) {
    const dayOrders = ordersByDay[day];
    lines.push(`${day} (${dayOrders.length}) :`);
    if (dayOrders.length === 0) {
      lines.push("-");
    } else {
      dayOrders.forEach((orderInfo, index) => {
        const notesStr = orderInfo.notes ? ` — ${orderInfo.notes}` : "";
        lines.push(
          `${index + 1}. ${orderInfo.name} (${orderInfo.items})${notesStr}`,
        );
      });
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

export function ExportMarkdownButton({
  orders,
  disabled = false,
  dayFilter,
}: ExportMarkdownButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleExport = async () => {
    try {
      const markdown = ordersToMarkdown(orders, dayFilter);
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      toast.success("Orders copied to clipboard as Markdown!");

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
      console.error("Copy failed:", error);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || orders.length === 0}
      className="gap-2 neo-brutal bg-amber-500 hover:bg-amber-600 text-white border-amber-600"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Export MD
        </>
      )}
    </Button>
  );
}
