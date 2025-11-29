"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2, Check, ChevronsUpDown } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { DAYS_OF_WEEK, PAYMENT_STATUSES } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { createOrder } from "@/services/orders.service";
import type { CreateOrderPayload } from "@/types/order.types";

const orderFormSchema = z.object({
  days: z.array(z.string()).min(1, "At least one day is required"),
  dates: z.array(z.string()).min(1, "At least one date is required"),
  name: z.string().min(1, "Name is required"),
  ordered: z.string().min(1, "Ordered item is required"),
  qty: z.number().min(1, "Quantity must be at least 1"),
  unit_price: z.number().min(0, "Unit price must be positive"),
  payment_status: z.enum(["paid", "unpaid"]),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

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
      ordered: "",
      qty: 1,
      unit_price: 0,
      payment_status: "unpaid",
    },
  });

  const qty = form.watch("qty");
  const unitPrice = form.watch("unit_price");
  const totalPrice = qty * unitPrice;

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      form.reset();
    }
  };

  const onSubmit = async (data: OrderFormValues) => {
    setIsSubmitting(true);
    try {
      await createOrder(data as CreateOrderPayload);
      toast.success("Order created successfully!");
      handleOpenChange(false);
      onOrderCreated?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create order"
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
          className="gap-2 h-11 px-6 text-base font-medium shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="h-5 w-5" />
          Create New Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-6xl max-h-[95vh] overflow-y-auto custom-scrollbar">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="text-2xl font-bold">
            Create New Order
          </DialogTitle>
          <DialogDescription className="text-base">
            Fill in the order details below. All fields marked with * are
            required.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Section 1: Schedule */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <h3 className="text-lg font-semibold">Order Schedule</h3>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Days */}
                <FormField
                  control={form.control}
                  name="days"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base font-semibold">
                        Days of Week *
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Select which days this order applies to
                      </p>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between h-12 text-base font-normal",
                                (!field.value || field.value.length === 0) &&
                                  "text-muted-foreground"
                              )}
                            >
                              {field.value && field.value.length > 0
                                ? `${field.value.length} day(s) selected`
                                : "Select days"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                                          current.filter((d) => d !== day)
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
                                          : "opacity-0"
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
                      <FormLabel className="text-base font-semibold">
                        Specific Dates *
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Pick the exact dates for this order
                      </p>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full h-12 justify-start text-left font-normal text-base"
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
                                  format(date, "yyyy-MM-dd")
                                ) || [];
                              field.onChange(formattedDates);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
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
              <div className="flex items-center gap-2 pb-2 border-b">
                <h3 className="text-lg font-semibold">
                  Customer & Order Details
                </h3>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base font-semibold">
                        Customer Name *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter customer name"
                          className="h-12 text-base"
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
                      <FormLabel className="text-base font-semibold">
                        Ordered Item *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Nasi Goreng, Ayam Bakar"
                          className="h-12 text-base"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section 3: Pricing */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <h3 className="text-lg font-semibold">Pricing & Payment</h3>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {/* Quantity */}
                <FormField
                  control={form.control}
                  name="qty"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base font-semibold">
                        Quantity *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          className="h-12 text-base"
                          placeholder="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Unit Price */}
                <FormField
                  control={form.control}
                  name="unit_price"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base font-semibold">
                        Unit Price (IDR) *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="100"
                          className="h-12 text-base"
                          placeholder="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Payment Status */}
                <FormField
                  control={form.control}
                  name="payment_status"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base font-semibold">
                        Payment Status *
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 text-base">
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
            <div className="rounded-xl bg-linear-to-r from-primary/10 to-primary/5 p-6 border-2 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Order Price
                  </p>
                  <p className="text-base font-medium">
                    {qty} × {formatCurrency(unitPrice)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-primary">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
                className="h-12 px-6 text-base"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 px-6 text-base"
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
