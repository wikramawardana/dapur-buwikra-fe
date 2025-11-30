"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
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
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { createOrder } from "@/services/orders.service";
import type { CreateOrderPayload } from "@/types/order.types";

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

interface CreateOrderDialogProps {
  onOrderCreated?: () => void;
}

export function CreateOrderDialog({ onOrderCreated }: CreateOrderDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      days: [],
      dates: [],
      name: "",
      ordered: [],
      total_price: 0,
      payment_status: "unpaid",
      notes: "",
    },
  });

  const orderedItems = form.watch("ordered");
  const selectedDates = form.watch("dates");
  const totalPrice = form.watch("total_price");

  // Auto-calculate total price when ordered items or dates change
  React.useEffect(() => {
    const calculatedPrice = calculateTotalPrice(
      orderedItems || [],
      selectedDates?.length || 0,
    );
    form.setValue("total_price", calculatedPrice);
  }, [orderedItems, selectedDates, form]);

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      form.reset();
    }
  };

  const onSubmit = async (data: OrderFormValues) => {
    setIsSubmitting(true);
    try {
      // Convert ordered array to comma-separated string for API
      const payload: CreateOrderPayload = {
        ...data,
        ordered: data.ordered
          .map((v) => MENU_ITEMS.find((item) => item.value === v)?.label || v)
          .join(", "),
      };
      await createOrder(payload);
      toast.success("Order created successfully!");
      handleOpenChange(false);
      onOrderCreated?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create order",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="gap-2 h-11 px-6 text-base font-bold border-2 border-black dark:border-white bg-blue-400 text-black hover:bg-blue-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-150 rounded-none"
        >
          <Plus className="h-5 w-5" />
          Create New Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-6xl max-h-[95vh] overflow-y-auto custom-scrollbar border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-none bg-white dark:bg-black">
        <DialogHeader className="space-y-3 pb-4 border-b-2 border-black dark:border-white">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">
            Create New Order
          </DialogTitle>
          <DialogDescription className="text-base font-medium text-black/70 dark:text-white/70">
            Fill in the order details below. All fields marked with * are
            required.
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
              <div className="grid gap-6 md:grid-cols-2 items-start">
                {/* Days */}
                <FormField
                  control={form.control}
                  name="days"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div>
                        <FormLabel className="text-base font-bold uppercase tracking-wide">
                          Days of Week *
                        </FormLabel>
                        <p className="text-sm font-medium text-black/60 dark:text-white/60 mt-1">
                          Select which days this order applies to
                        </p>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between h-12 text-base font-medium border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-150 bg-white dark:bg-black",
                                (!field.value || field.value.length === 0) &&
                                  "text-black/50 dark:text-white/50",
                              )}
                            >
                              {field.value && field.value.length > 0
                                ? `${field.value.length} day(s) selected`
                                : "Select days"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
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
                                      const isSelected = current.includes(day);
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
                      </Popover>
                      <div className="text-sm text-muted-foreground min-h-[20px]">
                        {field.value && field.value.length > 0
                          ? `Selected: ${field.value.join(", ")}`
                          : "\u00A0"}
                      </div>
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
                      <div>
                        <FormLabel className="text-base font-bold uppercase tracking-wide">
                          Specific Dates *
                        </FormLabel>
                        <p className="text-sm font-medium text-black/60 dark:text-white/60 mt-1">
                          Pick the exact dates for this order
                        </p>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full h-12 justify-start text-left font-medium text-base border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-150 bg-white dark:bg-black"
                            >
                              {field.value && field.value.length > 0
                                ? `${field.value.length} date(s) selected`
                                : "Click to pick dates"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
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
                      </Popover>
                      <div className="text-sm text-muted-foreground min-h-[20px]">
                        {field.value && field.value.length > 0
                          ? `Selected: ${field.value.sort().join(", ")}`
                          : "\u00A0"}
                      </div>
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
                          className="h-12 text-base border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:focus:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] focus:translate-x-[-1px] focus:translate-y-[-1px] transition-all duration-150 bg-white dark:bg-black font-medium"
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
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between h-12 text-base font-medium border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-150 bg-white dark:bg-black",
                                  (!field.value || field.value.length === 0) &&
                                    "text-black/50 dark:text-white/50",
                                )}
                              >
                                {field.value && field.value.length > 0
                                  ? `${field.value.length} item(s) selected`
                                  : "Select items"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
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
                        </Popover>
                      </FormControl>
                      {field.value && field.value.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Selected:{" "}
                          {field.value
                            .map(
                              (v) =>
                                MENU_ITEMS.find((item) => item.value === v)
                                  ?.label,
                            )
                            .join(", ")}
                        </p>
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
                        className="min-h-24 text-base border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:focus:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] focus:translate-x-[-1px] focus:translate-y-[-1px] transition-all duration-150 bg-white dark:bg-black font-medium resize-none"
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
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 text-base border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-150 bg-white dark:bg-black font-medium">
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
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
                className="h-12 px-6 text-base font-bold border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-150 bg-white dark:bg-black"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 px-6 text-base font-bold border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-150 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Order
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
