"use client";

import { Check, Copy, Loader2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { getOrders } from "@/services/orders.service";
import type { Order, OrderFilters } from "@/types/order.types";

interface ExportMarkdownButtonProps {
  filters: OrderFilters;
  disabled?: boolean;
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
    { name: string; items: string; notes: string; drop_point: string }[]
  > = {};
  const itemQtyByDay: Record<string, number> = {};
  for (const day of DAYS_OF_WEEK) {
    ordersByDay[day] = [];
    itemQtyByDay[day] = 0;
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

          // Sum item quantities for this day
          const dayItemQty = dayOrder.items.reduce(
            (sum, item) => sum + item.qty,
            0,
          );

          ordersByDay[day].push({
            name: order.name,
            items: itemsSummary,
            notes: order.notes || "",
            drop_point: order.drop_off_location || "",
          });
          uniqueOrderIds.add(order.id);
          itemQtyByDay[day] += dayItemQty;
          totalOrderByDay += dayItemQty;
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
    lines.push(`${day} (${itemQtyByDay[day]}) :`);
    if (dayOrders.length === 0) {
      lines.push("-");
    } else {
      dayOrders.forEach((orderInfo, index) => {
        const notesStr = orderInfo.notes ? ` — ${orderInfo.notes}` : "";
        const dropStr = orderInfo.drop_point
          ? ` [${orderInfo.drop_point}]`
          : "";
        lines.push(
          `${index + 1}. ${orderInfo.name} (${orderInfo.items})${dropStr}${notesStr}`,
        );
      });
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

function getExportFilename(dayFilter?: string): string {
  const day =
    !dayFilter || dayFilter === "all" || dayFilter === ""
      ? "all-days"
      : dayFilter.toLowerCase();

  return `orders-${day}-${new Date().toISOString().slice(0, 10)}.md`;
}

function fallbackCopyToClipboard(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.left = "-1000px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

async function copyMarkdown(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Some mobile browsers expose Clipboard API but deny writes.
    }
  }

  return fallbackCopyToClipboard(text);
}

function downloadMarkdown(markdown: string, filename: string) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

async function shareMarkdown(markdown: string, filename: string) {
  if (!navigator.share) return false;

  const file = new File([markdown], filename, {
    type: "text/markdown",
  });

  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: "Orders Markdown",
        text: "Dapur Bu Wikra orders export",
        files: [file],
      });
      return true;
    }

    await navigator.share({
      title: "Orders Markdown",
      text: markdown,
    });
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return true;
    }
    return false;
  }
}

export function ExportMarkdownButton({
  filters,
  disabled = false,
}: ExportMarkdownButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      // Fetch all orders for export on-demand
      const exportFilters = { ...filters, page: 1, page_size: 100 };
      const response = await getOrders(exportFilters);
      const orders = response.data.data;

      if (orders.length === 0) {
        toast.info("No orders to export");
        return;
      }

      const markdown = ordersToMarkdown(orders, filters.day);
      const filename = getExportFilename(filters.day);
      const isLikelyMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(
        navigator.userAgent,
      );

      if (isLikelyMobile && (await shareMarkdown(markdown, filename))) {
        toast.success("Markdown export opened");
        return;
      }

      const copiedToClipboard = await copyMarkdown(markdown);
      if (!copiedToClipboard) {
        downloadMarkdown(markdown, filename);
        toast.success("Markdown downloaded");
        return;
      }

      setCopied(true);
      toast.success("Orders copied to clipboard as Markdown!");

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      toast.error("Failed to export orders");
      console.error("Export failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || isLoading}
      className="gap-2 neo-brutal bg-amber-500 hover:bg-amber-600 text-white border-amber-600"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : copied ? (
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
