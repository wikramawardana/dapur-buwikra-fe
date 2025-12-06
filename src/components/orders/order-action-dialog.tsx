"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import {
  Check,
  CheckCheck,
  ChevronsUpDown,
  Copy,
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { DAYS_OF_WEEK, MENU_ITEMS, PAYMENT_STATUSES } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { deleteOrder, updateOrder } from "@/services/orders.service";
import type { CreateOrderPayload, Order } from "@/types/order.types";

const orderFormSchema = z.object({
  days: z.array(z.string()).min(1, "At least one day is required"),
  dates: z.array(z.string()).min(1, "At least one date is required"),
  name: z.string().min(1, "Name is required"),
  ordered: z.array(z.string()).min(1, "At least one item is required"),
  total_price: z.number().min(0, "Total price must be positive"),
  payment_status: z.enum(["paid", "unpaid"]),
  notes: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

// Helper function to calculate total price with different logic for perDay items
const calculateTotalPrice = (
  orderedItems: string[],
  datesCount: number,
): number => {
  let perDayTotal = 0;
  let oneTimeTotal = 0;

  for (const itemValue of orderedItems) {
    const menuItem = MENU_ITEMS.find((item) => item.value === itemValue);
    if (menuItem) {
      if (menuItem.perDay) {
        perDayTotal += menuItem.price;
      } else {
        oneTimeTotal += menuItem.price;
      }
    }
  }

  return perDayTotal * datesCount + oneTimeTotal;
};

// Helper to get breakdown details
const getPriceBreakdown = (orderedItems: string[], datesCount: number) => {
  const perDayItems: { label: string; price: number }[] = [];
  const oneTimeItems: { label: string; price: number }[] = [];

  for (const itemValue of orderedItems) {
    const menuItem = MENU_ITEMS.find((item) => item.value === itemValue);
    if (menuItem) {
      if (menuItem.perDay) {
        perDayItems.push({ label: menuItem.label, price: menuItem.price });
      } else {
        oneTimeItems.push({ label: menuItem.label, price: menuItem.price });
      }
    }
  }

  const perDaySubtotal = perDayItems.reduce((sum, item) => sum + item.price, 0);
  const oneTimeSubtotal = oneTimeItems.reduce(
    (sum, item) => sum + item.price,
    0,
  );
  const perDayTotal = perDaySubtotal * datesCount;
  const grandTotal = perDayTotal + oneTimeSubtotal;

  return {
    perDayItems,
    oneTimeItems,
    perDaySubtotal,
    oneTimeSubtotal,
    perDayTotal,
    grandTotal,
    datesCount,
  };
};

// Helper function to parse ordered string to array (for backward compatibility)
const parseOrderedToArray = (ordered: string | string[]): string[] => {
  if (Array.isArray(ordered)) return ordered;
  // Split by comma and match each item exactly with menu items
  const orderedParts = ordered
    .split(",")
    .map((part) => part.trim().toLowerCase());
  const matched: string[] = [];
  for (const part of orderedParts) {
    const menuItem = MENU_ITEMS.find(
      (item) =>
        item.label.toLowerCase() === part ||
        item.value.replace(/_/g, " ") === part,
    );
    if (menuItem) {
      matched.push(menuItem.value);
    }
  }
  return matched;
};

type ActionMode = "view" | "edit";

interface OrderActionDialogProps {
  order: Order;
  onOrderUpdated?: () => void;
  onOrderDeleted?: () => void;
}

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

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      days: order.days,
      dates: order.dates,
      name: order.name,
      ordered: parseOrderedToArray(order.ordered),
      total_price: order.total_price,
      payment_status: order.payment_status,
      notes: order.notes || "",
    },
  });

  const orderedItems = form.watch("ordered");
  const selectedDates = form.watch("dates");
  const totalPrice = form.watch("total_price");
  const isViewMode = actionMode === "view";

  // Auto-calculate total price when ordered items or dates change (only in edit mode)
  React.useEffect(() => {
    if (!isViewMode && orderedItems && selectedDates) {
      const calculatedPrice = calculateTotalPrice(
        orderedItems,
        selectedDates.length,
      );
      form.setValue("total_price", calculatedPrice);
    }
  }, [orderedItems, selectedDates, isViewMode, form]);

  const handleOpenDialog = (mode: ActionMode) => {
    setActionMode(mode);
    form.reset({
      days: order.days,
      dates: order.dates,
      name: order.name,
      ordered: parseOrderedToArray(order.ordered),
      total_price: order.total_price,
      payment_status: order.payment_status,
      notes: order.notes || "",
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    form.reset();
  };

  const onSubmit = async (data: OrderFormValues) => {
    if (isViewMode) return;

    setIsSubmitting(true);
    try {
      // Convert ordered array to comma-separated string for API
      const payload: CreateOrderPayload = {
        ...data,
        ordered: data.ordered
          .map((v) => MENU_ITEMS.find((item) => item.value === v)?.label || v)
          .join(", "),
      };
      await updateOrder(order.id, payload);
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
      // Create invoice HTML with completely isolated styles
      const breakdown = getPriceBreakdown(
        parseOrderedToArray(order.ordered),
        order.dates.length,
      );

      let orderItemsHtml = "";
      if (breakdown.perDayItems.length > 0) {
        orderItemsHtml += `<div style="margin-bottom: 16px;">`;
        orderItemsHtml += `<p style="font-size: 12px; font-weight: 700; color: #000000; text-transform: uppercase; margin: 0 0 12px 0; letter-spacing: 1px; border-bottom: 1px solid #000000; padding-bottom: 8px;">Per Day Items</p>`;
        breakdown.perDayItems.forEach((item) => {
          orderItemsHtml += `<div style="display: flex; justify-content: space-between; font-size: 15px; margin-bottom: 8px; padding: 0 4px;"><span style="color: #000000;">${item.label}</span><span style="color: #000000; font-weight: 600;">${formatCurrency(item.price)}</span></div>`;
        });
        orderItemsHtml += `<div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 700; border-top: 2px solid #000000; padding-top: 8px; margin-top: 8px;"><span style="color: #000000;">× ${breakdown.datesCount} hari</span><span style="color: #000000;">${formatCurrency(breakdown.perDayTotal)}</span></div>`;
        orderItemsHtml += `</div>`;
      }
      if (breakdown.oneTimeItems.length > 0) {
        orderItemsHtml += `<div style="margin-bottom: 8px;">`;
        orderItemsHtml += `<p style="font-size: 12px; font-weight: 700; color: #000000; text-transform: uppercase; margin: 0 0 12px 0; letter-spacing: 1px; border-bottom: 1px solid #000000; padding-bottom: 8px;">Tambahan</p>`;
        breakdown.oneTimeItems.forEach((item) => {
          orderItemsHtml += `<div style="display: flex; justify-content: space-between; font-size: 15px; margin-bottom: 8px; padding: 0 4px;"><span style="color: #000000;">${item.label}</span><span style="color: #000000; font-weight: 600;">${formatCurrency(item.price)}</span></div>`;
        });
        orderItemsHtml += `</div>`;
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
                            <p style="font-size: 22px; font-weight: 900; color: #000000; margin: 0;">${order.name}</p>
                        </div>
                        
                        <div style="margin-bottom: 24px; display: flex; gap: 24px;">
                            <div style="flex: 1;">
                                <p style="font-size: 12px; color: #000000; text-transform: uppercase; font-weight: 700; margin: 0 0 6px 0; letter-spacing: 1px;">Hari</p>
                                <p style="font-size: 14px; font-weight: 500; color: #000000; margin: 0; line-height: 1.6;">${order.days.join(", ")}</p>
                            </div>
                            <div style="flex: 1;">
                                <p style="font-size: 12px; color: #000000; text-transform: uppercase; font-weight: 700; margin: 0 0 6px 0; letter-spacing: 1px;">Tanggal</p>
                                <p style="font-size: 14px; font-weight: 500; color: #000000; margin: 0; line-height: 1.6;">${order.dates.sort().join(", ")}</p>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 24px; padding: 16px; border: 2px solid #000000; background-color: #ffffff;">
                            ${orderItemsHtml}
                        </div>
                        
                        ${notesHtml}
                        
                        <div style="background-color: #000000; padding: 20px; margin-top: 20px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-size: 16px; font-weight: 700; text-transform: uppercase; color: #ffffff; letter-spacing: 2px;">Total</span>
                                <span style="font-size: 28px; font-weight: 900; color: #ffffff;">${formatCurrency(order.total_price)}</span>
                            </div>
                        </div>
                        
                        <div style="margin-top: 20px; text-align: center;">
                            <span style="display: inline-block; padding: 12px 32px; font-size: 14px; font-weight: 900; text-transform: uppercase; background-color: ${order.payment_status === "paid" ? "#000000" : "#ffffff"}; color: ${order.payment_status === "paid" ? "#ffffff" : "#000000"}; border: 3px solid #000000; letter-spacing: 2px;">
                                ${order.payment_status === "paid" ? "✓ LUNAS" : "BELUM LUNAS"}
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

      // Write content to iframe
      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error("Could not access iframe document");
      }
      iframeDoc.open();
      iframeDoc.write(invoiceHtml);
      iframeDoc.close();

      // Wait for iframe to render
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get the invoice element from iframe
      const invoiceElement = iframeDoc.body.firstElementChild as HTMLElement;

      const canvas = await html2canvas(invoiceElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // Remove iframe
      document.body.removeChild(iframe);

      // Convert canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/png", 1.0);
      });

      if (!blob) {
        throw new Error("Failed to create image blob");
      }

      // Try to copy to clipboard
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
        // Fallback: download the image if clipboard API fails
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
        <DialogContent className="sm:max-w-6xl max-h-[95vh] overflow-y-auto custom-scrollbar border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-none bg-white dark:bg-black">
          <DialogHeader className="space-y-3 pb-4 border-b-2 border-black dark:border-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
              {isViewMode ? "Order Detail" : "Edit Order"}
            </DialogTitle>
            <DialogDescription className="text-base font-medium text-black/70 dark:text-white/70">
              {isViewMode
                ? "View the order details below."
                : "Update the order details below. All fields marked with * are required."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Section 1: Schedule */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b-2 border-black dark:border-white">
                  <h3 className="text-lg font-bold uppercase tracking-wide">
                    Order Schedule
                  </h3>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Days */}
                  <FormField
                    control={form.control}
                    name="days"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-base font-bold uppercase tracking-wide">
                          Days of Week *
                        </FormLabel>
                        <p className="text-sm font-medium text-black/60 dark:text-white/60">
                          Select which days this order applies to
                        </p>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                disabled={isViewMode}
                                className={cn(
                                  "w-full justify-between h-12 text-base font-medium border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-150 bg-white dark:bg-black",
                                  (!field.value || field.value.length === 0) &&
                                    "text-black/50 dark:text-white/50",
                                  isViewMode && "opacity-70 cursor-not-allowed",
                                )}
                              >
                                {field.value && field.value.length > 0
                                  ? `${field.value.length} day(s) selected`
                                  : "Select days"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          {!isViewMode && (
                            <PopoverContent
                              className="w-[--radix-popover-trigger-width] p-0"
                              align="start"
                            >
                              <Command>
                                <CommandList>
                                  <CommandGroup>
                                    {DAYS_OF_WEEK.map((day) => (
                                      <CommandItem
                                        key={day}
                                        value={day}
                                        onSelect={() => {
                                          const current = field.value || [];
                                          const isSelected =
                                            current.includes(day);
                                          if (isSelected) {
                                            field.onChange(
                                              current.filter((d) => d !== day),
                                            );
                                          } else {
                                            field.onChange([...current, day]);
                                          }
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value?.includes(day)
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                        {day}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          )}
                        </Popover>
                        {field.value && field.value.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Selected: {field.value.join(", ")}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Dates */}
                  <FormField
                    control={form.control}
                    name="dates"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-base font-bold uppercase tracking-wide">
                          Specific Dates *
                        </FormLabel>
                        <p className="text-sm font-medium text-black/60 dark:text-white/60">
                          Pick the exact dates for this order
                        </p>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                disabled={isViewMode}
                                className={cn(
                                  "w-full h-12 justify-start text-left font-medium text-base border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-150 bg-white dark:bg-black",
                                  isViewMode && "opacity-70 cursor-not-allowed",
                                )}
                              >
                                {field.value && field.value.length > 0
                                  ? `${field.value.length} date(s) selected`
                                  : "Click to pick dates"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          {!isViewMode && (
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="multiple"
                                selected={
                                  field.value?.map((d) => new Date(d)) || []
                                }
                                onSelect={(dates) => {
                                  const formattedDates =
                                    dates?.map((date) =>
                                      format(date, "yyyy-MM-dd"),
                                    ) || [];
                                  field.onChange(formattedDates);
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          )}
                        </Popover>
                        {field.value && field.value.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Selected: {field.value.sort().join(", ")}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Section 2: Customer & Order Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b-2 border-black dark:border-white">
                  <h3 className="text-lg font-bold uppercase tracking-wide">
                    Customer & Order Details
                  </h3>
                </div>
                <div className="grid gap-6 md:grid-cols-2 items-start">
                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-base font-bold uppercase tracking-wide">
                          Customer Name *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter customer name"
                            disabled={isViewMode}
                            className={cn(
                              "h-12 text-base border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:focus:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] focus:translate-x-[-1px] focus:translate-y-[-1px] transition-all duration-150 bg-white dark:bg-black font-medium",
                              isViewMode && "opacity-70 cursor-not-allowed",
                            )}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Ordered */}
                  <FormField
                    control={form.control}
                    name="ordered"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-base font-bold uppercase tracking-wide">
                          Ordered Items *
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                disabled={isViewMode}
                                className={cn(
                                  "w-full justify-between h-12 text-base font-medium border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-150 bg-white dark:bg-black",
                                  (!field.value || field.value.length === 0) &&
                                    "text-black/50 dark:text-white/50",
                                  isViewMode && "opacity-70 cursor-not-allowed",
                                )}
                              >
                                {field.value && field.value.length > 0
                                  ? `${field.value.length} item(s) selected`
                                  : "Select items"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          {!isViewMode && (
                            <PopoverContent
                              className="w-[--radix-popover-trigger-width] p-0"
                              align="start"
                            >
                              <Command>
                                <CommandList>
                                  <CommandGroup>
                                    {MENU_ITEMS.map((item) => (
                                      <CommandItem
                                        key={item.value}
                                        value={item.value}
                                        onSelect={() => {
                                          const current = field.value || [];
                                          const isSelected = current.includes(
                                            item.value,
                                          );
                                          if (isSelected) {
                                            field.onChange(
                                              current.filter(
                                                (v) => v !== item.value,
                                              ),
                                            );
                                          } else {
                                            field.onChange([
                                              ...current,
                                              item.value,
                                            ]);
                                          }
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value?.includes(item.value)
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                        <span className="flex-1">
                                          {item.label}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                          {formatCurrency(item.price)}
                                        </span>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          )}
                        </Popover>
                        {field.value && field.value.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Selected:{" "}
                            {field.value
                              .map(
                                (v) =>
                                  MENU_ITEMS.find((item) => item.value === v)
                                    ?.label,
                              )
                              .join(", ")}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Notes - Full Width */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base font-bold uppercase tracking-wide">
                        Notes
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any special instructions or notes for this order..."
                          disabled={isViewMode}
                          className={cn(
                            "min-h-24 text-base border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:focus:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] focus:translate-x-[-1px] focus:translate-y-[-1px] transition-all duration-150 bg-white dark:bg-black font-medium resize-none",
                            isViewMode && "opacity-70 cursor-not-allowed",
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section 3: Pricing */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b-2 border-black dark:border-white">
                  <h3 className="text-lg font-bold uppercase tracking-wide">
                    Pricing & Payment
                  </h3>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Price Breakdown */}
                  <div className="space-y-3">
                    <p className="text-base font-bold uppercase tracking-wide">
                      Price Breakdown
                    </p>
                    <div className="border-2 border-black dark:border-white p-4 bg-gray-50 dark:bg-gray-900 space-y-2">
                      {orderedItems && orderedItems.length > 0 ? (
                        (() => {
                          const breakdown = getPriceBreakdown(
                            orderedItems,
                            selectedDates?.length || 0,
                          );
                          return (
                            <>
                              {/* Per Day Items */}
                              {breakdown.perDayItems.length > 0 && (
                                <>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                                    Per Day Items
                                  </p>
                                  {breakdown.perDayItems.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between text-sm"
                                    >
                                      <span>{item.label}</span>
                                      <span>{formatCurrency(item.price)}</span>
                                    </div>
                                  ))}
                                  <div className="flex justify-between text-sm font-medium border-t border-dashed border-black/30 dark:border-white/30 pt-1">
                                    <span>
                                      Subtotal × {breakdown.datesCount} day(s)
                                    </span>
                                    <span>
                                      {formatCurrency(breakdown.perDayTotal)}
                                    </span>
                                  </div>
                                </>
                              )}

                              {/* One Time Items */}
                              {breakdown.oneTimeItems.length > 0 && (
                                <>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase mt-3">
                                    One Time Add-ons
                                  </p>
                                  {breakdown.oneTimeItems.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between text-sm"
                                    >
                                      <span>{item.label}</span>
                                      <span>{formatCurrency(item.price)}</span>
                                    </div>
                                  ))}
                                </>
                              )}

                              {/* Grand Total */}
                              <div className="border-t-2 border-black dark:border-white pt-2 mt-2">
                                <div className="flex justify-between text-sm font-bold">
                                  <span>Total</span>
                                  <span>
                                    {formatCurrency(breakdown.grandTotal)}
                                  </span>
                                </div>
                              </div>
                            </>
                          );
                        })()
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No items selected
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Payment Status */}
                  <FormField
                    control={form.control}
                    name="payment_status"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-base font-bold uppercase tracking-wide">
                          Payment Status *
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isViewMode}
                        >
                          <FormControl>
                            <SelectTrigger
                              className={cn(
                                "h-12 text-base border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-150 bg-white dark:bg-black font-medium",
                                isViewMode && "opacity-70 cursor-not-allowed",
                              )}
                            >
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PAYMENT_STATUSES.map((status) => (
                              <SelectItem
                                key={status.value}
                                value={status.value}
                                className="text-base"
                              >
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Total Price Display */}
              <div className="border-2 border-black dark:border-white bg-green-200 dark:bg-green-900 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-black dark:text-white mb-1">
                      Total Price
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-black dark:text-white">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-3 sm:gap-3 pt-4 border-t-2 border-black dark:border-white">
                {isViewMode && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyInvoice}
                    disabled={isCopyingInvoice}
                    className="h-12 px-6 text-base font-bold border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-150 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800"
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
                  className="h-12 px-6 text-base font-bold border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-150 bg-white dark:bg-black"
                >
                  {isViewMode ? "Close" : "Cancel"}
                </Button>
                {!isViewMode && (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 px-6 text-base font-bold border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-150 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update Order
                  </Button>
                )}
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-none bg-white dark:bg-black">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">
              Delete Order
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium text-black/70 dark:text-white/70">
              Are you sure you want to delete this order for{" "}
              <span className="font-bold text-black dark:text-white">
                {order.name}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-3">
            <AlertDialogCancel
              disabled={isDeleting}
              className="h-12 px-6 text-base font-bold border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-150 bg-white dark:bg-black"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-12 px-6 text-base font-bold border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-150 bg-red-600 text-white hover:bg-red-700"
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
