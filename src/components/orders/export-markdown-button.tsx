"use client";

import { Check, Copy } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Order } from "@/types/order.types";

interface ExportMarkdownButtonProps {
  orders: Order[];
  disabled?: boolean;
}

function ordersToMarkdown(orders: Order[]): string {
  if (orders.length === 0) {
    return "No orders to export.";
  }

  const lines: string[] = [];

  // Header info
  lines.push(`Total: ${orders.length} orders`);
  lines.push("");

  // Order list
  orders.forEach((order, index) => {
    const notesStr = order.notes ? ` — ${order.notes}` : "";

    lines.push(`${index + 1}. **${order.name}** (${order.ordered})${notesStr}`);
  });

  return lines.join("\n");
}

export function ExportMarkdownButton({
  orders,
  disabled = false,
}: ExportMarkdownButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleExport = async () => {
    try {
      const markdown = ordersToMarkdown(orders);
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
