"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format, getDay } from "date-fns";
import {
  CalendarIcon,
  ChevronsUpDown,
  ImageIcon,
  Loader2,
  Minus,
  Plus,
  Trash2,
  X,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { getUploadUrl } from "@/lib/api.config";
import { useSession } from "@/lib/auth-client";
import { formatCurrency } from "@/lib/format";
import { getMenuByDate } from "@/services/menu.service";
import { createOrder } from "@/services/orders.service";
import { getActivePriceList } from "@/services/pricelist.service";
import type { Menu } from "@/types/menu.types";
import type {
  CreateOrderPayload,
  DayOrder,
  OrderMenuItem,
} from "@/types/order.types";
import type { PriceListItem } from "@/types/pricelist.types";

// Day name mapping
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Schema for the new order structure
const orderFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  selectedDates: z.array(z.date()).min(1, "At least one date is required"),
  dayOrders: z.record(
    z.string(),
    z.array(
      z.object({
        name: z.string(),
        qty: z.number().min(1),
        unit_price: z.number().min(0),
      }),
    ),
  ),
  notes: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

// Calculate total price from all day orders
const calculateTotalPrice = (
  dayOrders: Record<string, OrderMenuItem[]>,
): number => {
  return Object.values(dayOrders).reduce((total, items) => {
    return (
      total +
      items.reduce((dayTotal, item) => dayTotal + item.qty * item.unit_price, 0)
    );
  }, 0);
};

interface CreateOrderDialogProps {
  onOrderCreated?: () => void;
}

export function CreateOrderDialog({ onOrderCreated }: CreateOrderDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [priceListItems, setPriceListItems] = React.useState<PriceListItem[]>(
    [],
  );
  const [isLoadingPriceList, setIsLoadingPriceList] = React.useState(false);

  // Menu preview state
  const [menuCache, setMenuCache] = React.useState<Record<string, Menu | null>>(
    {},
  );
  const [loadingMenus, setLoadingMenus] = React.useState<
    Record<string, boolean>
  >({});
  const [previewMenu, setPreviewMenu] = React.useState<Menu | null>(null);
  const [previewImageIndex, setPreviewImageIndex] = React.useState(0);

  // Get session for email prefill
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const sessionEmail = session?.user?.email || "";
  const sessionName = session?.user?.name || "";

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      name: "",
      email: "",
      selectedDates: [],
      dayOrders: {},
      notes: "",
    },
  });

  // Prefill form with session data when dialog opens
  React.useEffect(() => {
    if (open && session?.user) {
      // For non-admin, prefill both name and email from session
      if (!isAdmin) {
        form.setValue("email", sessionEmail);
        form.setValue("name", sessionName);
      }
    }
  }, [open, session, isAdmin, sessionEmail, sessionName, form]);

  const selectedDates = form.watch("selectedDates");
  const dayOrders = form.watch("dayOrders");
  const totalPrice = calculateTotalPrice(dayOrders || {});

  // Fetch price list when dialog opens
  React.useEffect(() => {
    if (open && priceListItems.length === 0) {
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
  }, [open, priceListItems.length]);

  // Get day name from date
  const getDayName = (date: Date): string => {
    return DAY_NAMES[getDay(date)];
  };

  // Format date key for dayOrders record
  const getDateKey = (date: Date): string => {
    return format(date, "yyyy-MM-dd");
  };

  // Fetch menu for a specific date
  const fetchMenuForDate = async (dateKey: string) => {
    // Check cache first
    if (menuCache[dateKey] !== undefined) {
      if (menuCache[dateKey]) {
        setPreviewMenu(menuCache[dateKey]);
        setPreviewImageIndex(0);
      }
      return;
    }

    setLoadingMenus((prev) => ({ ...prev, [dateKey]: true }));
    try {
      const response = await getMenuByDate(dateKey);
      const menu = response.data;
      setMenuCache((prev) => ({ ...prev, [dateKey]: menu }));
      if (menu?.image_urls && menu.image_urls.length > 0) {
        setPreviewMenu(menu);
        setPreviewImageIndex(0);
      } else {
        toast.info("No menu image available for this date");
      }
    } catch {
      setMenuCache((prev) => ({ ...prev, [dateKey]: null }));
      toast.info("No menu available for this date");
    } finally {
      setLoadingMenus((prev) => ({ ...prev, [dateKey]: false }));
    }
  };

  // Close preview
  const closePreview = () => {
    setPreviewMenu(null);
    setPreviewImageIndex(0);
  };

  // Add item to a specific day
  const addItemToDay = (dateKey: string, item: PriceListItem) => {
    const currentDayOrders = form.getValues("dayOrders") || {};
    const dayItems = currentDayOrders[dateKey] || [];

    // Check if item already exists
    const existingIndex = dayItems.findIndex((i) => i.name === item.name);
    if (existingIndex >= 0) {
      // Increase quantity
      dayItems[existingIndex].qty += 1;
    } else {
      // Add new item
      dayItems.push({
        name: item.name,
        qty: 1,
        unit_price: item.price,
      });
    }

    form.setValue("dayOrders", {
      ...currentDayOrders,
      [dateKey]: [...dayItems],
    });
  };

  // Update item quantity
  const updateItemQty = (dateKey: string, itemIndex: number, delta: number) => {
    const currentDayOrders = form.getValues("dayOrders") || {};
    const dayItems = [...(currentDayOrders[dateKey] || [])];

    if (dayItems[itemIndex]) {
      dayItems[itemIndex].qty = Math.max(1, dayItems[itemIndex].qty + delta);
      form.setValue("dayOrders", {
        ...currentDayOrders,
        [dateKey]: dayItems,
      });
    }
  };

  // Remove item from day
  const removeItemFromDay = (dateKey: string, itemIndex: number) => {
    const currentDayOrders = form.getValues("dayOrders") || {};
    const dayItems = [...(currentDayOrders[dateKey] || [])];
    dayItems.splice(itemIndex, 1);

    form.setValue("dayOrders", {
      ...currentDayOrders,
      [dateKey]: dayItems,
    });
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      form.reset();
    }
  };

  const onSubmit = async (data: OrderFormValues) => {
    setIsSubmitting(true);
    try {
      // Convert form data to API payload
      const dayOrdersPayload: DayOrder[] = data.selectedDates
        .sort((a, b) => a.getTime() - b.getTime())
        .map((date) => {
          const dateKey = getDateKey(date);
          const items = data.dayOrders[dateKey] || [];
          return {
            day: getDayName(date),
            date: dateKey,
            items: items,
          };
        })
        .filter((dayOrder) => dayOrder.items.length > 0);

      if (dayOrdersPayload.length === 0) {
        toast.error("Please add at least one item to your order");
        setIsSubmitting(false);
        return;
      }

      const payload: CreateOrderPayload = {
        name: data.name,
        email: data.email || undefined,
        day_orders: dayOrdersPayload,
        notes: data.notes || "",
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

  // Group price list items by category (with defensive check)
  const mainItems = (priceListItems || []).filter(
    (item) => item.category === "main",
  );
  const addonItems = (priceListItems || []).filter(
    (item) => item.category === "addon",
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="gap-2 h-9 px-3 text-sm sm:h-11 sm:px-6 sm:text-base font-bold border-2 border-black dark:border-white bg-blue-400 text-black hover:bg-blue-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-150 rounded-none"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">Create New Order</span>
          <span className="sm:hidden">New Order</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-6xl max-h-[95vh] overflow-y-auto custom-scrollbar border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-none bg-white dark:bg-black">
        <DialogHeader className="space-y-2 sm:space-y-3 pb-3 sm:pb-4 border-b-2 border-black dark:border-white">
          <DialogTitle className="text-xl sm:text-2xl font-black uppercase tracking-tight">
            Create New Order
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base font-medium text-black/70 dark:text-white/70">
            Select dates and add items for each day. Different items can be
            ordered for different days.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 sm:space-y-8"
          >
            {/* Section 1: Customer Info */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-black dark:border-white">
                <h3 className="text-base sm:text-lg font-bold uppercase tracking-wide">
                  Customer Info
                </h3>
              </div>
              <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 items-start">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-bold uppercase tracking-wide">
                        Customer Name *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter customer name"
                          className="h-12 text-base border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-black font-medium"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-bold uppercase tracking-wide">
                        Email *{!isAdmin && " (from your account)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="customer@email.com"
                          disabled={!isAdmin}
                          className={`h-12 text-base border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-black font-medium ${
                            !isAdmin ? "opacity-70 cursor-not-allowed" : ""
                          }`}
                          {...field}
                        />
                      </FormControl>
                      {!isAdmin && (
                        <p className="text-xs text-muted-foreground">
                          Email is auto-filled from your account
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section 2: Date Selection */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-black dark:border-white">
                <h3 className="text-base sm:text-lg font-bold uppercase tracking-wide">
                  Select Dates
                </h3>
              </div>
              <FormField
                control={form.control}
                name="selectedDates"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-bold uppercase tracking-wide">
                      Order Dates *
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full h-12 justify-start text-left font-medium text-base border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-black"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value && field.value.length > 0
                              ? `${field.value.length} date(s) selected`
                              : "Click to pick dates"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="multiple"
                          selected={field.value}
                          onSelect={(dates) => {
                            field.onChange(dates || []);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {field.value && field.value.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Selected:{" "}
                        {field.value
                          .sort((a, b) => a.getTime() - b.getTime())
                          .map((d) => format(d, "EEE, MMM d"))
                          .join(" • ")}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 3: Day-by-Day Item Selection */}
            {selectedDates && selectedDates.length > 0 && (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b-2 border-black dark:border-white">
                  <h3 className="text-base sm:text-lg font-bold uppercase tracking-wide">
                    Items Per Day
                  </h3>
                </div>

                {isLoadingPriceList ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading menu items...</span>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {selectedDates
                      .sort((a, b) => a.getTime() - b.getTime())
                      .map((date) => {
                        const dateKey = getDateKey(date);
                        const dayName = getDayName(date);
                        const dayItems = dayOrders?.[dateKey] || [];
                        const dayTotal = dayItems.reduce(
                          (sum, item) => sum + item.qty * item.unit_price,
                          0,
                        );

                        return (
                          <div
                            key={dateKey}
                            className="border-2 border-black dark:border-white p-4 bg-gray-50 dark:bg-gray-900"
                          >
                            {/* Day Header */}
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-black/20 dark:border-white/20">
                              <div className="flex items-center gap-2">
                                <div>
                                  <p className="font-bold text-lg">{dayName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {format(date, "MMM d, yyyy")}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs rounded-none border-black/50 dark:border-white/50 hover:bg-blue-100 dark:hover:bg-blue-900"
                                  onClick={() => fetchMenuForDate(dateKey)}
                                  disabled={loadingMenus[dateKey]}
                                >
                                  {loadingMenus[dateKey] ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <>
                                      <ImageIcon className="h-3 w-3 mr-1" />
                                      Menu
                                    </>
                                  )}
                                </Button>
                              </div>
                              <p className="font-bold text-lg">
                                {formatCurrency(dayTotal)}
                              </p>
                            </div>

                            {/* Selected Items */}
                            {dayItems.length > 0 && (
                              <div className="space-y-2 mb-3">
                                {dayItems.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between bg-white dark:bg-black p-2 border border-black/20 dark:border-white/20"
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">
                                        {item.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {formatCurrency(item.unit_price)} each
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 rounded-none border-black dark:border-white"
                                        onClick={() =>
                                          updateItemQty(dateKey, idx, -1)
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
                                          updateItemQty(dateKey, idx, 1)
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
                                          removeItemFromDay(dateKey, idx)
                                        }
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add Item Dropdown */}
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full justify-between h-10 text-sm border-2 border-dashed border-black/50 dark:border-white/50 rounded-none bg-transparent hover:bg-black/5 dark:hover:bg-white/5"
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
                                              addItemToDay(dateKey, item)
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
                                              addItemToDay(dateKey, item)
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
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* Section 4: Notes */}
            <div className="space-y-3 sm:space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-bold uppercase tracking-wide">
                      Notes (Optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any special instructions..."
                        className="min-h-20 text-base border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-black font-medium resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Total Price Display */}
            <div className="border-2 border-black dark:border-white bg-green-200 dark:bg-green-900 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-black dark:text-white mb-1">
                    Total Price
                  </p>
                  <p className="text-xs text-black/70 dark:text-white/70">
                    {selectedDates?.length || 0} day(s) selected
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
                className="h-12 px-6 text-base font-bold border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-black"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 px-6 text-base font-bold border-2 border-black dark:border-white rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Order
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {/* Menu Preview Modal */}
        {previewMenu?.image_urls && previewMenu.image_urls.length > 0 && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
            onClick={closePreview}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute -top-12 right-0 h-10 w-10 rounded-none border-2 border-white bg-black/50 text-white hover:bg-black/70 z-10"
                onClick={closePreview}
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Menu title */}
              <div className="absolute -top-12 left-0 text-white">
                <p className="font-bold text-lg">{previewMenu.title}</p>
                <p className="text-sm text-white/70">
                  {format(new Date(previewMenu.start_date), "MMM d")} -{" "}
                  {format(new Date(previewMenu.end_date), "MMM d, yyyy")}
                </p>
              </div>

              {/* Image */}
              <div className="relative bg-white dark:bg-black border-4 border-white shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getUploadUrl(previewMenu.image_urls[previewImageIndex])}
                  alt={previewMenu.title}
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
              </div>

              {/* Navigation for multiple images */}
              {previewMenu.image_urls.length > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-none border-white text-white bg-black/50 hover:bg-black/70"
                    onClick={() =>
                      setPreviewImageIndex((prev) =>
                        prev > 0 ? prev - 1 : previewMenu.image_urls.length - 1,
                      )
                    }
                  >
                    Previous
                  </Button>
                  <span className="text-white text-sm">
                    {previewImageIndex + 1} / {previewMenu.image_urls.length}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-none border-white text-white bg-black/50 hover:bg-black/70"
                    onClick={() =>
                      setPreviewImageIndex((prev) =>
                        prev < previewMenu.image_urls.length - 1 ? prev + 1 : 0,
                      )
                    }
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
