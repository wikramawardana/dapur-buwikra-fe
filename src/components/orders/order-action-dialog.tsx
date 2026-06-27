"use client";

import { format, getDay } from "date-fns";
import html2canvas from "html2canvas";
import {
  CalendarIcon,
  CheckCheck,
  ChevronsUpDown,
  Copy,
  Eye,
  Loader2,
  Minus,
  MoreHorizontal,
  Pencil,
  Plus,
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
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/auth-client";
import { PAYMENT_STATUSES } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import {
  acceptOrder,
  cancelOrder,
  completeOrder,
  deleteOrder,
  rejectOrder,
  startOrder,
  updateOrder,
} from "@/services/orders.service";
import { getActivePickupPoints } from "@/services/pickup-point.service";
import { getActivePriceList } from "@/services/pricelist.service";
import type { DayOrder, Order, PaymentStatus } from "@/types/order.types";
import type { PriceListItem } from "@/types/pricelist.types";
import { StatusBadge } from "./status-badge";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type ActionMode = "view" | "edit";

interface OrderActionDialogProps {
  order: Order;
  onOrderUpdated?: () => void;
  onOrderDeleted?: () => void;
}

const calculateTotalFromDayOrders = (dayOrders: DayOrder[]): number => {
  return dayOrders.reduce((total, dayOrder) => {
    return (
      total +
      dayOrder.items.reduce((dayTotal, item) => {
        return dayTotal + item.qty * item.unit_price;
      }, 0)
    );
  }, 0);
};

const buildInvoiceText = (order: Order): string => {
  const dayOrders = order.day_orders || [];
  const totalPrice = calculateTotalFromDayOrders(dayOrders);
  const invoiceNumber = `INV-${order.id.slice(0, 8).toUpperCase()}`;
  const invoiceDate = format(new Date(order.created_at), "dd MMMM yyyy");
  const qrisUrl = `${window.location.origin}/payment/qris`;
  const lines = [
    "DAPUR BUWIKRA",
    `Invoice: ${invoiceNumber}`,
    `Tanggal: ${invoiceDate}`,
    "",
    `Pelanggan: ${order.name}`,
  ];

  if (order.email) {
    lines.push(`Email: ${order.email}`);
  }

  for (const dayOrder of dayOrders) {
    lines.push(
      "",
      `${dayOrder.day}, ${format(new Date(dayOrder.date), "dd MMM yyyy")}`,
    );

    for (const item of dayOrder.items) {
      lines.push(
        `- ${item.name} x${item.qty} - ${formatCurrency(item.qty * item.unit_price)}`,
      );
    }

    const dayTotal = dayOrder.items.reduce(
      (sum, item) => sum + item.qty * item.unit_price,
      0,
    );
    lines.push(`Subtotal: ${formatCurrency(dayTotal)}`);
  }

  if (order.notes) {
    lines.push("", `Catatan: ${order.notes}`);
  }

  lines.push(
    "",
    `TOTAL: ${formatCurrency(totalPrice)}`,
    `Status: ${order.payment_status === "paid" ? "LUNAS" : "BELUM LUNAS"}`,
  );

  if (order.payment_status !== "paid") {
    lines.push("", "Pembayaran QRIS:", qrisUrl);
  }

  lines.push("", "Terima kasih atas pesanan Anda!");
  return lines.join("\n");
};

const copyTextToClipboard = async (text: string): Promise<boolean> => {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the compatibility path below.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
};

export function OrderActionDialog({
  order: initialOrder,
  onOrderUpdated,
  onOrderDeleted,
}: OrderActionDialogProps) {
  // Local order state for immediate UI updates
  const [order, setOrder] = React.useState<Order>(initialOrder);

  // Sync with prop changes (e.g., when parent refetches data)
  React.useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [actionMode, setActionMode] = React.useState<ActionMode>("view");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isCopyingInvoice, setIsCopyingInvoice] = React.useState(false);
  const [invoiceCopied, setInvoiceCopied] = React.useState(false);

  // Workflow action states
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [cancelReason, setCancelReason] = React.useState("");
  const [isWorkflowProcessing, setIsWorkflowProcessing] = React.useState(false);

  // Check if user is admin
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  // Edit form state
  const [editName, setEditName] = React.useState(order.name);
  const [editEmail, setEditEmail] = React.useState(order.email || "");
  const [editDayOrders, setEditDayOrders] = React.useState<DayOrder[]>(
    order.day_orders || [],
  );
  const [editPaymentStatus, setEditPaymentStatus] =
    React.useState<PaymentStatus>(order.payment_status);
  const [editNotes, setEditNotes] = React.useState(order.notes || "");
  const [editDropOffLocation, setEditDropOffLocation] = React.useState(
    order.drop_off_location || "",
  );

  // Price list for adding items
  const [priceListItems, setPriceListItems] = React.useState<PriceListItem[]>(
    [],
  );
  const [isLoadingPriceList, setIsLoadingPriceList] = React.useState(false);
  const [pickupPoints, setPickupPoints] = React.useState<string[]>([]);
  const [isLoadingPickupPoints, setIsLoadingPickupPoints] =
    React.useState(false);

  // Date picker for adding new days
  const [selectedNewDates, setSelectedNewDates] = React.useState<Date[]>([]);

  const isViewMode = actionMode === "view";
  const totalPrice = calculateTotalFromDayOrders(
    isViewMode ? order.day_orders || [] : editDayOrders,
  );

  // Fetch price list when entering edit mode
  React.useEffect(() => {
    if (dialogOpen && actionMode === "edit" && priceListItems.length === 0) {
      setIsLoadingPriceList(true);
      getActivePriceList()
        .then((response) => {
          // Handle both paginated and non-paginated responses
          const items = response.data?.data || response.data || [];
          setPriceListItems(Array.isArray(items) ? items : []);
        })
        .catch((error) => {
          toast.error("Failed to load price list");
          console.error(error);
        })
        .finally(() => {
          setIsLoadingPriceList(false);
        });
    }
  }, [dialogOpen, actionMode, priceListItems.length]);

  React.useEffect(() => {
    if (dialogOpen && actionMode === "edit" && pickupPoints.length === 0) {
      setIsLoadingPickupPoints(true);
      getActivePickupPoints()
        .then((response) => {
          setPickupPoints(response.data.map((point) => point.name));
        })
        .catch((error) => {
          toast.error("Failed to load pickup points");
          console.error(error);
        })
        .finally(() => {
          setIsLoadingPickupPoints(false);
        });
    }
  }, [dialogOpen, actionMode, pickupPoints.length]);

  const getDayName = (date: Date): string => DAY_NAMES[getDay(date)];
  const getDateKey = (date: Date): string => format(date, "yyyy-MM-dd");

  const handleOpenDialog = (mode: ActionMode) => {
    setActionMode(mode);
    setEditName(order.name);
    setEditEmail(order.email || "");
    setEditDayOrders(JSON.parse(JSON.stringify(order.day_orders || [])));
    setEditPaymentStatus(order.payment_status);
    setEditNotes(order.notes || "");
    setEditDropOffLocation(order.drop_off_location || "");
    setSelectedNewDates([]);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Add item to a specific day
  const addItemToDay = (dayIndex: number, item: PriceListItem) => {
    const updated = [...editDayOrders];
    const dayItems = updated[dayIndex].items;
    const existingIndex = dayItems.findIndex((i) => i.name === item.name);

    if (existingIndex >= 0) {
      dayItems[existingIndex].qty += 1;
    } else {
      dayItems.push({ name: item.name, qty: 1, unit_price: item.price });
    }
    setEditDayOrders(updated);
  };

  // Update item quantity
  const updateItemQty = (
    dayIndex: number,
    itemIndex: number,
    delta: number,
  ) => {
    const updated = [...editDayOrders];
    const item = updated[dayIndex].items[itemIndex];
    item.qty = Math.max(1, item.qty + delta);
    setEditDayOrders(updated);
  };

  // Remove item from day
  const removeItemFromDay = (dayIndex: number, itemIndex: number) => {
    const updated = [...editDayOrders];
    updated[dayIndex].items.splice(itemIndex, 1);
    setEditDayOrders(updated);
  };

  // Remove entire day
  const removeDay = (dayIndex: number) => {
    const updated = [...editDayOrders];
    updated.splice(dayIndex, 1);
    setEditDayOrders(updated);
  };

  // Add new days from date picker
  const addNewDays = () => {
    if (selectedNewDates.length === 0) return;

    const existingDates = new Set(editDayOrders.map((d) => d.date));
    const newDayOrders: DayOrder[] = [];

    selectedNewDates.forEach((date) => {
      const dateKey = getDateKey(date);
      if (!existingDates.has(dateKey)) {
        newDayOrders.push({
          day: getDayName(date),
          date: dateKey,
          items: [],
        });
      }
    });

    if (newDayOrders.length > 0) {
      const combined = [...editDayOrders, ...newDayOrders].sort((a, b) =>
        a.date.localeCompare(b.date),
      );
      setEditDayOrders(combined);
    }

    setSelectedNewDates([]);
  };

  const handleSubmit = async () => {
    if (isViewMode) return;

    if (!editName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    // Filter out days with no items
    const validDayOrders = editDayOrders.filter((d) => d.items.length > 0);

    if (validDayOrders.length === 0) {
      toast.error("Order must have at least one item");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await updateOrder(order.id, {
        name: editName,
        email: editEmail || undefined,
        day_orders: validDayOrders,
        payment_status: editPaymentStatus,
        notes: editNotes,
        drop_off_location: editDropOffLocation || undefined,
      });
      setOrder(response.data);
      toast.success("Order updated successfully!");
      setActionMode("view");
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

  // Workflow action handlers
  const handleAccept = async () => {
    setIsWorkflowProcessing(true);
    try {
      const response = await acceptOrder(order.id);
      setOrder(response.data);
      toast.success("Order accepted successfully!");
      onOrderUpdated?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to accept order",
      );
    } finally {
      setIsWorkflowProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    setIsWorkflowProcessing(true);
    try {
      const response = await rejectOrder(order.id, rejectReason);
      setOrder(response.data);
      toast.success("Order rejected");
      setRejectDialogOpen(false);
      setRejectReason("");
      onOrderUpdated?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reject order",
      );
    } finally {
      setIsWorkflowProcessing(false);
    }
  };

  const handleStart = async () => {
    setIsWorkflowProcessing(true);
    try {
      const response = await startOrder(order.id);
      setOrder(response.data);
      toast.success("Order started!");
      onOrderUpdated?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start order",
      );
    } finally {
      setIsWorkflowProcessing(false);
    }
  };

  const handleComplete = async () => {
    setIsWorkflowProcessing(true);
    try {
      const response = await completeOrder(order.id);
      setOrder(response.data);
      toast.success("Order completed!");
      onOrderUpdated?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to complete order",
      );
    } finally {
      setIsWorkflowProcessing(false);
    }
  };

  const handleCancel = async () => {
    setIsWorkflowProcessing(true);
    try {
      const response = await cancelOrder(order.id, cancelReason || undefined);
      setOrder(response.data);
      toast.success("Order cancelled");
      setCancelDialogOpen(false);
      setCancelReason("");
      onOrderUpdated?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel order",
      );
    } finally {
      setIsWorkflowProcessing(false);
    }
  };

  const handleCopyInvoice = async () => {
    setIsCopyingInvoice(true);
    try {
      const copiedAsText = await copyTextToClipboard(buildInvoiceText(order));
      if (copiedAsText) {
        setInvoiceCopied(true);
        toast.success("Invoice text copied to clipboard!");
        setTimeout(() => setInvoiceCopied(false), 2000);
        return;
      }

      // Keep the current image download as a compatibility fallback for
      // browsers that block both clipboard text APIs.
      const displayDayOrders = order.day_orders || [];
      const totalPrice = calculateTotalFromDayOrders(displayDayOrders);

      // Generate invoice number and date
      const invoiceNumber = `INV-${order.id.slice(0, 8).toUpperCase()}`;
      const invoiceDate = format(new Date(order.created_at), "dd MMMM yyyy");

      // Build order items HTML
      let orderItemsHtml = "";
      displayDayOrders.forEach((dayOrder) => {
        const dayTotal = dayOrder.items.reduce(
          (sum, item) => sum + item.qty * item.unit_price,
          0,
        );

        // Day Header
        orderItemsHtml += `<div style="background-color: #e5e5e5; padding: 8px 12px; border-top: 2px solid #000000;">
          <p style="font-size: 14px; font-weight: 700; color: #000000; margin: 0;">${
            dayOrder.day
          } - ${format(new Date(dayOrder.date), "dd MMM yyyy")}</p>
        </div>`;

        // Items
        dayOrder.items.forEach((item) => {
          orderItemsHtml += `<div style="display: grid; grid-template-columns: 1fr 60px 100px; font-size: 14px; padding: 8px 12px; border-top: 1px solid #d1d5db;">
            <div>
              <p style="font-weight: 500; color: #000000; margin: 0;">${
                item.name
              }</p>
              <p style="font-size: 12px; color: #6b7280; margin: 2px 0 0 0;">@ ${formatCurrency(
                item.unit_price,
              )}</p>
            </div>
            <div style="text-align: center; font-weight: 500; color: #000000;">${
              item.qty
            }</div>
            <div style="text-align: right; font-weight: 600; color: #000000;">${formatCurrency(
              item.qty * item.unit_price,
            )}</div>
          </div>`;
        });

        // Day Subtotal
        orderItemsHtml += `<div style="display: grid; grid-template-columns: 2fr 1fr; font-size: 14px; padding: 8px 12px; background-color: #f3f4f6; border-top: 1px solid #d1d5db;">
          <div style="font-weight: 600; color: #374151;">Subtotal ${
            dayOrder.day
          }</div>
          <div style="text-align: right; font-weight: 700; color: #000000;">${formatCurrency(
            dayTotal,
          )}</div>
        </div>`;
      });

      const notesHtml = order.notes
        ? `<div style="margin-bottom: 24px; padding: 16px; border: 2px solid #000000; background-color: #fefce8;">
            <p style="font-size: 12px; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 4px 0;">Catatan</p>
            <p style="font-size: 14px; color: #000000; margin: 0;">${order.notes}</p>
          </div>`
        : "";

      const emailHtml = order.email
        ? `<p style="font-size: 14px; color: #4b5563; margin: 4px 0 0 0;">${order.email}</p>`
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
            <div style="width: 500px; background-color: #ffffff; padding: 32px; font-family: Arial, Helvetica, sans-serif; color: #000000;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 4px solid #000000;">
                    <h1 style="font-size: 30px; font-weight: 900; letter-spacing: 3px; color: #000000; margin: 0 0 4px 0;">DAPUR BUWIKRA</h1>
                    <p style="font-size: 14px; font-weight: 600; color: #000000; text-transform: uppercase; letter-spacing: 0.2em; margin: 0;">Invoice</p>
                </div>

                <!-- Invoice Info -->
                <div style="display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 14px;">
                    <div>
                        <p style="font-size: 12px; font-weight: 700; color: #4b5563; text-transform: uppercase; margin: 0 0 4px 0;">No. Invoice</p>
                        <p style="font-weight: 700; color: #000000; margin: 0;">${invoiceNumber}</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="font-size: 12px; font-weight: 700; color: #4b5563; text-transform: uppercase; margin: 0 0 4px 0;">Tanggal</p>
                        <p style="font-weight: 700; color: #000000; margin: 0;">${invoiceDate}</p>
                    </div>
                </div>

                <!-- Customer Info -->
                <div style="margin-bottom: 24px; padding: 16px; border: 2px solid #000000; background-color: #f9fafb;">
                    <p style="font-size: 12px; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 4px 0;">Pelanggan</p>
                    <p style="font-size: 20px; font-weight: 900; color: #000000; margin: 0;">${
                      order.name
                    }</p>
                    ${emailHtml}
                </div>

                <!-- Order Items -->
                <div style="margin-bottom: 24px; border: 2px solid #000000;">
                    <!-- Table Header -->
                    <div style="display: grid; grid-template-columns: 1fr 60px 100px; background-color: #000000; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; padding: 8px 12px;">
                        <div>Item</div>
                        <div style="text-align: center;">Qty</div>
                        <div style="text-align: right;">Subtotal</div>
                    </div>
                    ${orderItemsHtml}
                </div>

                ${notesHtml}

                <!-- Total -->
                <div style="background-color: #000000; color: #ffffff; padding: 16px; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Total</span>
                        <span style="font-size: 24px; font-weight: 900;">${formatCurrency(
                          totalPrice,
                        )}</span>
                    </div>
                </div>

                <!-- Payment Status -->
                <div style="text-align: center; margin-bottom: 24px;">
                    <span style="display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; border: 4px solid ${
                      order.payment_status === "paid" ? "#16a34a" : "#dc2626"
                    }; background-color: ${
                      order.payment_status === "paid" ? "#dcfce7" : "#fee2e2"
                    }; color: ${order.payment_status === "paid" ? "#166534" : "#991b1b"};">
                        ${
                          order.payment_status === "paid"
                            ? "✓ LUNAS"
                            : "BELUM LUNAS"
                        }
                    </span>
                </div>

                <!-- Footer -->
                <div style="text-align: center; padding-top: 16px; border-top: 2px solid #d1d5db;">
                    <p style="font-size: 12px; color: #6b7280; margin: 0 0 4px 0;">Terima kasih atas pesanan Anda!</p>
                    <p style="font-size: 12px; color: #9ca3af; margin: 0;">Dapur Buwikra - Catering &amp; Homemade Food</p>
                </div>
            </div>
        </body>
        </html>
      `;

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
          new ClipboardItem({ "image/png": blob }),
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

  const mainItems = priceListItems
    .filter((item) => item.category === "main")
    .sort((a, b) => a.price - b.price);
  const addonItems = priceListItems
    .filter((item) => item.category === "addon")
    .sort((a, b) => a.price - b.price);
  const displayDayOrders = isViewMode ? order.day_orders || [] : editDayOrders;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:-translate-x-px hover:-translate-y-px transition-all duration-150 bg-white dark:bg-black"
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
          {isAdmin && (
            <DropdownMenuItem
              onClick={() => handleOpenDialog("edit")}
              className="cursor-pointer font-medium"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Order
            </DropdownMenuItem>
          )}
          {isAdmin && (
            <DropdownMenuItem
              onClick={() => setDeleteDialogOpen(true)}
              className="cursor-pointer font-medium text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Order
            </DropdownMenuItem>
          )}
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
                : "Update customer info, items, payment status, and notes."}
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
                  {isViewMode ? (
                    <p className="text-lg font-medium">{order.name}</p>
                  ) : (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Customer name"
                      className="h-12 text-base border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-black font-medium"
                    />
                  )}
                </div>
                <div>
                  <Label className="text-sm font-bold uppercase">Email</Label>
                  {isViewMode ? (
                    <p className="text-lg font-medium">
                      {order.email || "No email"}
                    </p>
                  ) : (
                    <Input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="customer@email.com"
                      className="h-12 text-base border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-black font-medium"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Order Status - Only in view mode */}
            {isViewMode && (
              <div className="space-y-2">
                <h3 className="text-lg font-bold uppercase tracking-wide border-b-2 border-black dark:border-white pb-2">
                  Order Status
                </h3>
                <div className="flex items-center gap-4">
                  <StatusBadge
                    status={order.status}
                    type="order"
                    className="text-base px-4 py-2"
                  />
                  {order.rejection_reason && (
                    <div className="flex-1 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700">
                      <p className="text-sm font-bold text-red-600 dark:text-red-400 uppercase">
                        Reason:
                      </p>
                      <p className="text-red-800 dark:text-red-200">
                        {order.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Day Orders */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-2">
                <h3 className="text-lg font-bold uppercase tracking-wide">
                  Order Details
                </h3>
                {!isViewMode && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2 border-2 border-black dark:border-white rounded-none"
                      >
                        <CalendarIcon className="h-4 w-4" />
                        Add Days
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="multiple"
                        selected={selectedNewDates}
                        onSelect={(dates) => setSelectedNewDates(dates || [])}
                        initialFocus
                      />
                      {selectedNewDates.length > 0 && (
                        <div className="p-2 border-t">
                          <Button
                            type="button"
                            size="sm"
                            className="w-full"
                            onClick={addNewDays}
                          >
                            Add {selectedNewDates.length} Day(s)
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {isLoadingPriceList && !isViewMode ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading menu items...</span>
                </div>
              ) : displayDayOrders.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {displayDayOrders.map((dayOrder, dayIdx) => {
                    const dayTotal = dayOrder.items.reduce(
                      (sum, item) => sum + item.qty * item.unit_price,
                      0,
                    );
                    return (
                      <div
                        key={dayIdx}
                        className="border-2 border-black dark:border-white p-4 bg-gray-50 dark:bg-gray-900"
                      >
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-black/20 dark:border-white/20">
                          <div>
                            <p className="font-bold text-lg">{dayOrder.day}</p>
                            <p className="text-sm text-muted-foreground">
                              {dayOrder.date}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-lg">
                              {formatCurrency(dayTotal)}
                            </p>
                            {!isViewMode && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-7 w-7 rounded-none"
                                onClick={() => removeDay(dayIdx)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          {dayOrder.items.map((item, itemIdx) => (
                            <div
                              key={itemIdx}
                              className="flex items-center justify-between text-sm bg-white dark:bg-black p-2 border border-black/20 dark:border-white/20"
                            >
                              <div className="flex-1">
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrency(item.unit_price)} each
                                </p>
                              </div>
                              {isViewMode ? (
                                <span className="font-medium">
                                  × {item.qty} ={" "}
                                  {formatCurrency(item.qty * item.unit_price)}
                                </span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 rounded-none border-black dark:border-white"
                                    onClick={() =>
                                      updateItemQty(dayIdx, itemIdx, -1)
                                    }
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-8 text-center font-bold">
                                    {item.qty}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 rounded-none border-black dark:border-white"
                                    onClick={() =>
                                      updateItemQty(dayIdx, itemIdx, 1)
                                    }
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="h-7 w-7 rounded-none"
                                    onClick={() =>
                                      removeItemFromDay(dayIdx, itemIdx)
                                    }
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Add Item (edit mode only) */}
                        {!isViewMode && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-between h-10 text-sm border-2 border-dashed border-black/50 dark:border-white/50 rounded-none bg-transparent hover:bg-black/5 dark:hover:bg-white/5 mt-3"
                              >
                                <span className="flex items-center gap-2">
                                  <Plus className="h-4 w-4" />
                                  Add Item
                                </span>
                                <ChevronsUpDown className="h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-[300px] p-0"
                              align="start"
                            >
                              <Command>
                                <CommandList>
                                  {mainItems.length > 0 && (
                                    <CommandGroup heading="Main Items">
                                      {mainItems.map((item) => (
                                        <CommandItem
                                          key={item.id}
                                          onSelect={() =>
                                            addItemToDay(dayIdx, item)
                                          }
                                        >
                                          <span className="flex-1">
                                            {item.name}
                                          </span>
                                          <span className="text-sm text-muted-foreground">
                                            {formatCurrency(item.price)}
                                          </span>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  )}
                                  {addonItems.length > 0 && (
                                    <CommandGroup heading="Add-ons">
                                      {addonItems.map((item) => (
                                        <CommandItem
                                          key={item.id}
                                          onSelect={() =>
                                            addItemToDay(dayIdx, item)
                                          }
                                        >
                                          <span className="flex-1">
                                            {item.name}
                                          </span>
                                          <span className="text-sm text-muted-foreground">
                                            {formatCurrency(item.price)}
                                          </span>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  )}
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        )}
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
                Drop Off Location
              </Label>
              {isViewMode ? (
                <p className="text-base">
                  {order.drop_off_location || "No drop off location"}
                </p>
              ) : (
                <Select
                  value={editDropOffLocation}
                  onValueChange={setEditDropOffLocation}
                  disabled={isLoadingPickupPoints}
                >
                  <SelectTrigger className="h-12 text-base border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-black font-medium">
                    <SelectValue
                      placeholder={
                        isLoadingPickupPoints
                          ? "Loading pickup points..."
                          : "Select drop off location..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      new Set(
                        [editDropOffLocation, ...pickupPoints].filter(Boolean),
                      ),
                    ).map((point) => (
                      <SelectItem key={point} value={point}>
                        {point}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

          <DialogFooter className="gap-3 pt-4 border-t-2 border-black dark:border-white flex-wrap">
            {/* Workflow Action Buttons - View Mode Only, Admin Only */}
            {isViewMode && isAdmin && (
              <>
                {order.status === "pending" && (
                  <>
                    <Button
                      type="button"
                      onClick={handleAccept}
                      disabled={isWorkflowProcessing}
                      className="h-12 px-6 text-base font-bold border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-blue-500 text-white hover:bg-blue-600"
                    >
                      {isWorkflowProcessing && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Accept
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setRejectDialogOpen(true)}
                      disabled={isWorkflowProcessing}
                      className="h-12 px-6 text-base font-bold border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-red-500 text-white hover:bg-red-600"
                    >
                      Reject
                    </Button>
                  </>
                )}
                {order.status === "accepted" && (
                  <>
                    <Button
                      type="button"
                      onClick={handleStart}
                      disabled={isWorkflowProcessing}
                      className="h-12 px-6 text-base font-bold border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-purple-500 text-white hover:bg-purple-600"
                    >
                      {isWorkflowProcessing && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Start
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCancelDialogOpen(true)}
                      disabled={isWorkflowProcessing}
                      className="h-12 px-6 text-base font-bold border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-gray-500 text-white hover:bg-gray-600"
                    >
                      Cancel Order
                    </Button>
                  </>
                )}
                {order.status === "inprogress" && (
                  <>
                    <Button
                      type="button"
                      onClick={handleComplete}
                      disabled={isWorkflowProcessing}
                      className="h-12 px-6 text-base font-bold border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-green-500 text-white hover:bg-green-600"
                    >
                      {isWorkflowProcessing && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Complete
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCancelDialogOpen(true)}
                      disabled={isWorkflowProcessing}
                      className="h-12 px-6 text-base font-bold border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-gray-500 text-white hover:bg-gray-600"
                    >
                      Cancel Order
                    </Button>
                  </>
                )}
              </>
            )}
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
              disabled={isSubmitting || isWorkflowProcessing}
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

      {/* Reject Order Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent className="border-2 border-black dark:border-white rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-black">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase">
              Reject Order
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Please provide a reason for rejecting this order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label
              className="text-sm font-bold uppercase"
              htmlFor="reject-reason"
            >
              Reason (Required)
            </Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="mt-2 min-h-24 text-base border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-black"
            />
          </div>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel
              disabled={isWorkflowProcessing}
              onClick={() => setRejectReason("")}
              className="h-12 px-6 text-base font-bold border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-black"
            >
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={handleReject}
              disabled={isWorkflowProcessing || !rejectReason.trim()}
              className="h-12 px-6 text-base font-bold border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-red-500 text-white hover:bg-red-600"
            >
              {isWorkflowProcessing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reject Order
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Order Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="border-2 border-black dark:border-white rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-black">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase">
              Cancel Order
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to cancel this order? You can optionally
              provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label
              className="text-sm font-bold uppercase"
              htmlFor="cancel-reason"
            >
              Reason (Optional)
            </Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter cancellation reason (optional)..."
              className="mt-2 min-h-24 text-base border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-black"
            />
          </div>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel
              disabled={isWorkflowProcessing}
              onClick={() => setCancelReason("")}
              className="h-12 px-6 text-base font-bold border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-black"
            >
              Go Back
            </AlertDialogCancel>
            <Button
              onClick={handleCancel}
              disabled={isWorkflowProcessing}
              className="h-12 px-6 text-base font-bold border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-gray-600 text-white hover:bg-gray-700"
            >
              {isWorkflowProcessing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Cancel Order
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
