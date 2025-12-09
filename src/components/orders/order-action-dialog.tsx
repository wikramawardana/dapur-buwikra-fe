"use client";

import html2canvas from "html2canvas";
import {
  CheckCheck,
  Copy,
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PAYMENT_STATUSES } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { deleteOrder, updateOrder } from "@/services/orders.service";
import type { Order, PaymentStatus } from "@/types/order.types";

type ActionMode = "view" | "edit";

interface OrderActionDialogProps {
  order: Order;
  onOrderUpdated?: () => void;
  onOrderDeleted?: () => void;
}

// Calculate total from day_orders
const calculateTotalFromDayOrders = (order: Order): number => {
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

export function OrderActionDialog({
  order,
  onOrderUpdated,
  onOrderDeleted,
}: OrderActionDialogProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [actionMode, setActionMode] = React.useState<ActionMode>("view");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isCopyingInvoice, setIsCopyingInvoice] = React.useState(false);
  const [invoiceCopied, setInvoiceCopied] = React.useState(false);

  // Edit form state (simplified - only editable fields)
  const [editPaymentStatus, setEditPaymentStatus] =
    React.useState<PaymentStatus>(order.payment_status);
  const [editNotes, setEditNotes] = React.useState(order.notes || "");

  const isViewMode = actionMode === "view";
  const totalPrice = calculateTotalFromDayOrders(order);

  const handleOpenDialog = (mode: ActionMode) => {
    setActionMode(mode);
    setEditPaymentStatus(order.payment_status);
    setEditNotes(order.notes || "");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSubmit = async () => {
    if (isViewMode) return;

    setIsSubmitting(true);
    try {
      await updateOrder(order.id, {
        payment_status: editPaymentStatus,
        notes: editNotes,
      });
      toast.success("Order updated successfully!");
      handleCloseDialog();
      onOrderUpdated?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update order",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteOrder(order.id);
      toast.success("Order deleted successfully!");
      setDeleteDialogOpen(false);
      onOrderDeleted?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete order",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyInvoice = async () => {
    setIsCopyingInvoice(true);
    try {
      // Build items HTML from day_orders
      let orderItemsHtml = "";

      if (order.day_orders && order.day_orders.length > 0) {
        order.day_orders.forEach((dayOrder) => {
          const dayTotal = dayOrder.items.reduce(
            (sum, item) => sum + item.qty * item.unit_price,
            0,
          );
          orderItemsHtml += `<div style="margin-bottom: 16px;">`;
          orderItemsHtml += `<p style="font-size: 14px; font-weight: 700; color: #000000; margin: 0 0 8px 0; border-bottom: 1px solid #000000; padding-bottom: 4px;">${dayOrder.day} - ${dayOrder.date}</p>`;

          dayOrder.items.forEach((item) => {
            orderItemsHtml += `<div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px; padding: 0 4px;">
              <span style="color: #000000;">${item.name} × ${item.qty}</span>
              <span style="color: #000000; font-weight: 600;">${formatCurrency(
                item.qty * item.unit_price,
              )}</span>
            </div>`;
          });

          orderItemsHtml += `<div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 600; margin-top: 4px; padding: 4px; background: #f0f0f0;">
            <span>Subtotal</span>
            <span>${formatCurrency(dayTotal)}</span>
          </div>`;
          orderItemsHtml += `</div>`;
        });
      }

      const notesHtml = order.notes
        ? `<div style="margin: 20px 0; padding: 12px 16px; border: 2px solid #000000; background-color: #ffffff;"><p style="font-size: 12px; color: #000000; text-transform: uppercase; font-weight: 700; margin: 0 0 6px 0; letter-spacing: 1px;">Catatan</p><p style="font-size: 14px; color: #000000; margin: 0; line-height: 1.5;">${order.notes}</p></div>`
        : "";

      const invoiceHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { background: #ffffff; }
            </style>
        </head>
        <body>
            <div style="width: 500px; background-color: #ffffff; padding: 32px; font-family: Arial, Helvetica, sans-serif; color: #000000; border: 3px solid #000000;">
                <div style="text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 3px solid #000000;">
                    <h1 style="font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #000000; margin: 0 0 8px 0;">DAPUR BUWIKRA</h1>
                    <p style="font-size: 14px; color: #000000; font-weight: 600; margin: 0; letter-spacing: 3px; text-transform: uppercase;">Invoice</p>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <p style="font-size: 12px; color: #000000; text-transform: uppercase; font-weight: 700; margin: 0 0 6px 0; letter-spacing: 1px;">Pelanggan</p>
                    <p style="font-size: 22px; font-weight: 900; color: #000000; margin: 0;">${
                      order.name
                    }</p>
                </div>
                
                <div style="margin-bottom: 24px; padding: 16px; border: 2px solid #000000; background-color: #ffffff;">
                    ${orderItemsHtml}
                </div>
                
                ${notesHtml}
                
                <div style="background-color: #000000; padding: 20px; margin-top: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 16px; font-weight: 700; text-transform: uppercase; color: #ffffff; letter-spacing: 2px;">Total</span>
                        <span style="font-size: 28px; font-weight: 900; color: #ffffff;">${formatCurrency(
                          totalPrice,
                        )}</span>
                    </div>
                </div>
                
                <div style="margin-top: 20px; text-align: center;">
                    <span style="display: inline-block; padding: 12px 32px; font-size: 14px; font-weight: 900; text-transform: uppercase; background-color: ${
                      order.payment_status === "paid" ? "#000000" : "#ffffff"
                    }; color: ${
                      order.payment_status === "paid" ? "#ffffff" : "#000000"
                    }; border: 3px solid #000000; letter-spacing: 2px;">
                        ${
                          order.payment_status === "paid"
                            ? "✓ LUNAS"
                            : "BELUM LUNAS"
                        }
                    </span>
                </div>
                
                <div style="margin-top: 24px; text-align: center;">
                    <p style="font-size: 12px; color: #000000; margin: 0; font-weight: 500;">Terima kasih atas pesanan Anda!</p>
                </div>
            </div>
        </body>
        </html>
      `;

      // Create an iframe to isolate from page CSS
      const iframe = document.createElement("iframe");
      iframe.style.cssText =
        "position: fixed; left: -9999px; top: -9999px; width: 550px; height: 800px; border: none;";
      document.body.appendChild(iframe);

      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error("Could not access iframe document");
      }
      iframeDoc.open();
      iframeDoc.write(invoiceHtml);
      iframeDoc.close();

      await new Promise((resolve) => setTimeout(resolve, 100));

      const invoiceElement = iframeDoc.body.firstElementChild as HTMLElement;

      const canvas = await html2canvas(invoiceElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      document.body.removeChild(iframe);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/png", 1.0);
      });

      if (!blob) {
        throw new Error("Failed to create image blob");
      }

      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob,
          }),
        ]);
        setInvoiceCopied(true);
        toast.success("Invoice copied to clipboard!");
        setTimeout(() => setInvoiceCopied(false), 2000);
      } catch {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${order.name}-${order.id}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Invoice downloaded!");
      }
    } catch (error) {
      console.error("Invoice generation error:", error);
      toast.error("Failed to generate invoice");
    } finally {
      setIsCopyingInvoice(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-150 bg-white dark:bg-black"
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="border-2 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
        >
          <DropdownMenuItem
            onClick={() => handleOpenDialog("view")}
            className="cursor-pointer font-medium"
          >
            <Eye className="mr-2 h-4 w-4" />
            View Detail
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleOpenDialog("edit")}
            className="cursor-pointer font-medium"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Order
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="cursor-pointer font-medium text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Order
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto custom-scrollbar border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-none bg-white dark:bg-black">
          <DialogHeader className="space-y-3 pb-4 border-b-2 border-black dark:border-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
              {isViewMode ? "Order Detail" : "Edit Order"}
            </DialogTitle>
            <DialogDescription className="text-base font-medium text-black/70 dark:text-white/70">
              {isViewMode
                ? "View the order details below."
                : "Update payment status and notes."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Customer Info */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold uppercase tracking-wide border-b-2 border-black dark:border-white pb-2">
                Customer
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-bold uppercase">Name</Label>
                  <p className="text-lg font-medium">{order.name}</p>
                </div>
                {order.email && (
                  <div>
                    <Label className="text-sm font-bold uppercase">Email</Label>
                    <p className="text-lg font-medium">{order.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Day Orders */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold uppercase tracking-wide border-b-2 border-black dark:border-white pb-2">
                Order Details
              </h3>

              {order.day_orders && order.day_orders.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {order.day_orders.map((dayOrder, idx) => {
                    const dayTotal = dayOrder.items.reduce(
                      (sum, item) => sum + item.qty * item.unit_price,
                      0,
                    );
                    return (
                      <div
                        key={idx}
                        className="border-2 border-black dark:border-white p-4 bg-gray-50 dark:bg-gray-900"
                      >
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-black/20 dark:border-white/20">
                          <div>
                            <p className="font-bold text-lg">{dayOrder.day}</p>
                            <p className="text-sm text-muted-foreground">
                              {dayOrder.date}
                            </p>
                          </div>
                          <p className="font-bold text-lg">
                            {formatCurrency(dayTotal)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          {dayOrder.items.map((item, itemIdx) => (
                            <div
                              key={itemIdx}
                              className="flex justify-between text-sm"
                            >
                              <span>
                                {item.name} × {item.qty}
                              </span>
                              <span className="font-medium">
                                {formatCurrency(item.qty * item.unit_price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No items in this order.</p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-base font-bold uppercase tracking-wide">
                Notes
              </Label>
              {isViewMode ? (
                <p className="text-base">{order.notes || "No notes"}</p>
              ) : (
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes..."
                  className="min-h-20 text-base border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-black font-medium"
                />
              )}
            </div>

            {/* Payment Status */}
            <div className="space-y-2">
              <Label className="text-base font-bold uppercase tracking-wide">
                Payment Status
              </Label>
              {isViewMode ? (
                <div
                  className={`inline-block px-4 py-2 font-bold uppercase border-2 border-black dark:border-white ${
                    order.payment_status === "paid"
                      ? "bg-green-200 dark:bg-green-900"
                      : "bg-red-200 dark:bg-red-900"
                  }`}
                >
                  {order.payment_status === "paid" ? "✓ Paid" : "Unpaid"}
                </div>
              ) : (
                <Select
                  value={editPaymentStatus}
                  onValueChange={(v) =>
                    setEditPaymentStatus(v as PaymentStatus)
                  }
                >
                  <SelectTrigger className="w-full h-12 text-base border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-black font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Total */}
            <div className="border-2 border-black dark:border-white bg-green-200 dark:bg-green-900 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold uppercase tracking-wide text-black dark:text-white">
                  Total Price
                </p>
                <span className="text-3xl font-black text-black dark:text-white">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 pt-4 border-t-2 border-black dark:border-white">
            {isViewMode && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyInvoice}
                disabled={isCopyingInvoice}
                className="h-12 px-6 text-base font-bold border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-black"
              >
                {isCopyingInvoice ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : invoiceCopied ? (
                  <CheckCheck className="mr-2 h-4 w-4" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {invoiceCopied ? "Copied!" : "Copy Invoice"}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isSubmitting}
              className="h-12 px-6 text-base font-bold border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-black"
            >
              {isViewMode ? "Close" : "Cancel"}
            </Button>
            {!isViewMode && (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-12 px-6 text-base font-bold border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-2 border-black dark:border-white rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-black">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase">
              Delete Order
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete order for{" "}
              <strong>{order.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel
              disabled={isDeleting}
              className="h-12 px-6 text-base font-bold border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-black"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-12 px-6 text-base font-bold border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-red-500 text-white hover:bg-red-600"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
