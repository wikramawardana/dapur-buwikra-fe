"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Order } from "@/types/order.types";
import { formatCurrency, formatDate } from "@/lib/format";

interface ExportMarkdownButtonProps {
    orders: Order[];
    disabled?: boolean;
}

function ordersToMarkdown(orders: Order[]): string {
    if (orders.length === 0) {
        return "No orders to export.";
    }

    const lines: string[] = [];

    // Header
    lines.push("# Orders Export");
    lines.push("");
    lines.push(`**Export Date:** ${formatDate(new Date().toISOString(), "dd MMM yyyy, HH:mm")}`);
    lines.push(`**Total Orders:** ${orders.length}`);
    lines.push("");

    // Table header
    lines.push("| No | Name | Ordered | Total Price | Days | Payment |");
    lines.push("|:---|:-----|:--------|:------------|:-----|:--------|");

    // Table rows
    orders.forEach((order, index) => {
        const daysStr = order.days.join(", ");
        const paymentEmoji = order.payment_status === "paid" ? "💰" : "💳";

        lines.push(
            `| ${index + 1} | ${order.name} | ${order.ordered} | ${formatCurrency(order.total_price)} | ${daysStr} | ${paymentEmoji} ${order.payment_status} |`
        );
    });

    lines.push("");

    // Summary
    const totalAmount = orders.reduce((sum, order) => sum + order.total_price, 0);
    lines.push("---");
    lines.push("");
    lines.push("## Summary");
    lines.push("");
    lines.push(`- **Total Amount:** ${formatCurrency(totalAmount)}`);
    lines.push("");

    // Detailed list with notes
    const ordersWithNotes = orders.filter((order) => order.notes);
    if (ordersWithNotes.length > 0) {
        lines.push("## Notes");
        lines.push("");
        ordersWithNotes.forEach((order) => {
            lines.push(`- **${order.name}:** ${order.notes}`);
        });
        lines.push("");
    }

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
            className="gap-2 neo-brutal neo-brutal-white"
        >
            {copied ? (
                <>
                    <Check className="h-4 w-4 text-green-600" />
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
