"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  CreditCard,
  History,
  Info,
  Loader2,
  LogOut,
  MapPin,
  Minus,
  Plus,
  Receipt,
  RotateCcw,
  Sparkles,
  Trash2,
  User,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { authClient } from "@/lib/auth-client";
import { formatCurrency } from "@/lib/format";
import { createOrder } from "@/services/orders.service";
import { getActivePickupPoints } from "@/services/pickup-point.service";
import { getActivePriceList } from "@/services/pricelist.service";
import type { CreateOrderPayload, DayOrder, Order } from "@/types/order.types";
import type { PriceListItem } from "@/types/pricelist.types";

const orderFormSchema = z.object({
  name: z.string().min(2, "Nama pemesan minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  selectedDates: z.array(z.string()).min(1, "Pilih minimal 1 hari katering"),
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
  drop_off_location: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

interface CustomerOrderFormProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
  weekStartDate: string;
  weekEndDate: string;
}

interface WeekDayItem {
  dateKey: string;
  dayName: string;
  formattedDate: string;
  rawDate: Date;
}

export function CustomerOrderForm({
  user,
  weekStartDate,
  weekEndDate: _weekEndDate,
}: CustomerOrderFormProps) {
  const [priceListItems, setPriceListItems] = React.useState<PriceListItem[]>(
    [],
  );
  const [isLoadingPriceList, setIsLoadingPriceList] = React.useState(true);
  const [pickupPoints, setPickupPoints] = React.useState<string[]>([]);
  const [isLoadingPickupPoints, setIsLoadingPickupPoints] =
    React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submittedOrder, setSubmittedOrder] = React.useState<Order | null>(
    null,
  );

  // Generate 5 work days (Mon-Fri) for this week
  const weekDays = React.useMemo<WeekDayItem[]>(() => {
    try {
      const monday = new Date(`${weekStartDate}T00:00:00`);
      return [0, 1, 2, 3, 4].map((offset) => {
        const d = addDays(monday, offset);
        const dateKey = format(d, "yyyy-MM-dd");
        const dayName = format(d, "EEEE", { locale: idLocale });
        const formattedDate = format(d, "d MMM yyyy", { locale: idLocale });
        return {
          dateKey,
          dayName,
          formattedDate,
          rawDate: d,
        };
      });
    } catch {
      return [];
    }
  }, [weekStartDate]);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      name: user.name || "",
      email: user.email || "",
      selectedDates: weekDays.map((d) => d.dateKey),
      dayOrders: {},
      notes: "",
      drop_off_location: "",
    },
  });

  // Keep name & email updated with user session
  React.useEffect(() => {
    if (user.email) {
      form.setValue("email", user.email);
    }
    if (user.name && !form.getValues("name")) {
      form.setValue("name", user.name);
    }
  }, [user, form]);

  // When week changes, initialize selected dates
  React.useEffect(() => {
    if (weekDays.length > 0) {
      const allDates = weekDays.map((d) => d.dateKey);
      form.setValue("selectedDates", allDates);
      form.setValue("dayOrders", {});
    }
  }, [weekDays, form]);

  // Fetch active pricelist & pickup points
  React.useEffect(() => {
    let isMounted = true;
    setIsLoadingPriceList(true);
    setIsLoadingPickupPoints(true);

    getActivePriceList()
      .then((res) => {
        if (!isMounted) return;
        const items = res.data?.data || res.data || [];
        setPriceListItems(Array.isArray(items) ? items : []);
      })
      .catch((err) => {
        console.error("Failed to load pricelist:", err);
        toast.error("Gagal memuat daftar menu");
      })
      .finally(() => {
        if (isMounted) setIsLoadingPriceList(false);
      });

    getActivePickupPoints()
      .then((res) => {
        if (!isMounted) return;
        setPickupPoints(res.data.map((p) => p.name));
      })
      .catch((err) => {
        console.error("Failed to load pickup points:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingPickupPoints(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedDates = form.watch("selectedDates") || [];
  const dayOrders = form.watch("dayOrders") || {};

  // Group price list items into categories
  const mainItems = React.useMemo(
    () =>
      (priceListItems || [])
        .filter((item) => item.category === "main")
        .sort((a, b) => a.price - b.price),
    [priceListItems],
  );

  const addonItems = React.useMemo(
    () =>
      (priceListItems || [])
        .filter((item) => item.category === "addon")
        .sort((a, b) => a.price - b.price),
    [priceListItems],
  );

  // Toggle selection for a specific date
  const toggleDate = (dateKey: string) => {
    const current = form.getValues("selectedDates") || [];
    let updated: string[];
    if (current.includes(dateKey)) {
      updated = current.filter((d) => d !== dateKey);
      // Remove day orders for unselected date
      const currentDayOrders = { ...form.getValues("dayOrders") };
      delete currentDayOrders[dateKey];
      form.setValue("dayOrders", currentDayOrders);
    } else {
      updated = [...current, dateKey].sort();
    }
    form.setValue("selectedDates", updated, { shouldValidate: true });
  };

  const selectAllDays = () => {
    form.setValue(
      "selectedDates",
      weekDays.map((d) => d.dateKey),
      { shouldValidate: true },
    );
  };

  const clearAllDays = () => {
    form.setValue("selectedDates", [], { shouldValidate: true });
    form.setValue("dayOrders", {});
  };

  // Add menu item to a date
  const addItemToDay = (dateKey: string, item: PriceListItem) => {
    const currentDayOrders = form.getValues("dayOrders") || {};
    const dayItems = [...(currentDayOrders[dateKey] || [])];

    const existingIdx = dayItems.findIndex((i) => i.name === item.name);
    if (existingIdx >= 0) {
      dayItems[existingIdx].qty += 1;
    } else {
      dayItems.push({
        name: item.name,
        qty: 1,
        unit_price: item.price,
      });
    }

    form.setValue("dayOrders", {
      ...currentDayOrders,
      [dateKey]: dayItems,
    });
  };

  // Update item quantity
  const updateItemQty = (dateKey: string, itemIdx: number, delta: number) => {
    const currentDayOrders = form.getValues("dayOrders") || {};
    const dayItems = [...(currentDayOrders[dateKey] || [])];

    if (dayItems[itemIdx]) {
      const newQty = dayItems[itemIdx].qty + delta;
      if (newQty <= 0) {
        dayItems.splice(itemIdx, 1);
      } else {
        dayItems[itemIdx].qty = newQty;
      }
      form.setValue("dayOrders", {
        ...currentDayOrders,
        [dateKey]: dayItems,
      });
    }
  };

  // Remove item
  const removeItemFromDay = (dateKey: string, itemIdx: number) => {
    const currentDayOrders = form.getValues("dayOrders") || {};
    const dayItems = [...(currentDayOrders[dateKey] || [])];
    dayItems.splice(itemIdx, 1);

    form.setValue("dayOrders", {
      ...currentDayOrders,
      [dateKey]: dayItems,
    });
  };

  // Quick Copy day's menu to all other selected days
  const copyDayToAllSelectedDays = (sourceDateKey: string) => {
    const sourceItems = dayOrders[sourceDateKey] || [];
    if (sourceItems.length === 0) {
      toast.error("Belum ada menu yang dipilih pada hari ini");
      return;
    }

    const currentDayOrders = { ...form.getValues("dayOrders") };
    for (const dateKey of selectedDates) {
      currentDayOrders[dateKey] = sourceItems.map((item) => ({ ...item }));
    }

    form.setValue("dayOrders", currentDayOrders);
    toast.success("Menu berhasil disalin ke semua hari yang dipilih!");
  };

  // Total summary calculations
  const totalSummary = React.useMemo(() => {
    let grandTotal = 0;
    let totalItemCount = 0;
    const daySummaries: Record<string, { count: number; subtotal: number }> =
      {};

    for (const dateKey of selectedDates) {
      const items = dayOrders[dateKey] || [];
      const subtotal = items.reduce(
        (sum, item) => sum + item.qty * item.unit_price,
        0,
      );
      const count = items.reduce((sum, item) => sum + item.qty, 0);
      daySummaries[dateKey] = { count, subtotal };
      grandTotal += subtotal;
      totalItemCount += count;
    }

    return { grandTotal, totalItemCount, daySummaries };
  }, [selectedDates, dayOrders]);

  // Form Submit
  const onSubmit = async (values: OrderFormValues) => {
    // Validate that at least one day has items
    const dayOrdersPayload: DayOrder[] = selectedDates
      .sort()
      .map((dateKey) => {
        const matched = weekDays.find((d) => d.dateKey === dateKey);
        const dayName = matched ? matched.dayName : "Day";
        const items = values.dayOrders[dateKey] || [];
        return {
          day: dayName,
          date: dateKey,
          items,
        };
      })
      .filter((d) => d.items.length > 0);

    if (dayOrdersPayload.length === 0) {
      toast.error("Pilih minimal satu menu makanan untuk hari yang Anda pilih");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateOrderPayload = {
        name: values.name.trim(),
        email: values.email.trim(),
        day_orders: dayOrdersPayload,
        notes: values.notes?.trim() || "",
        drop_off_location: values.drop_off_location || undefined,
      };

      const response = await createOrder(payload);
      setSubmittedOrder(response.data);
      toast.success("Pesanan berhasil dikirim!");
    } catch (error) {
      console.error("Order submission error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal membuat pesanan. Silakan coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form for a new order
  const handleOrderAgain = () => {
    setSubmittedOrder(null);
    form.reset({
      name: user.name || "",
      email: user.email || "",
      selectedDates: weekDays.map((d) => d.dateKey),
      dayOrders: {},
      notes: "",
      drop_off_location: "",
    });
  };

  // SUCCESS STATE VIEW
  if (submittedOrder) {
    return (
      <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-10 my-8">
        <div className="max-w-2xl mx-auto space-y-6 text-center">
          <div className="mx-auto w-20 h-20 bg-green-400 border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CheckCircle2 className="h-12 w-12 text-black" />
          </div>

          <div className="space-y-2">
            <span className="bg-black text-white px-3 py-1 text-xs font-black uppercase tracking-wider">
              Pesanan Diterima
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-black">
              Terima Kasih, {submittedOrder.name}!
            </h2>
            <p className="text-base text-black/70 font-medium max-w-md mx-auto">
              Pesanan katering Anda telah berhasil kami terima dan sedang dalam
              antrean konfirmasi dapur.
            </p>
          </div>

          {/* Order Details Card */}
          <div className="border-3 border-black bg-[#fdfbf7] p-5 text-left space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-center pb-3 border-b-2 border-black">
              <div>
                <p className="text-xs font-bold text-black/60 uppercase">
                  ID Pesanan
                </p>
                <p className="font-mono font-bold text-sm text-black">
                  {submittedOrder.id}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-black/60 uppercase">
                  Status
                </p>
                <span className="inline-block bg-yellow-300 border-2 border-black px-2 py-0.5 text-xs font-black uppercase">
                  Menunggu Konfirmasi
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-wider text-black">
                Rincian Hari & Menu
              </p>
              {submittedOrder.day_orders.map((dayOrder, i) => (
                <div
                  key={i}
                  className="bg-white border-2 border-black p-3 text-sm"
                >
                  <div className="flex justify-between font-bold border-b border-black/10 pb-1 mb-1.5">
                    <span>
                      {dayOrder.day} ({dayOrder.date})
                    </span>
                    <span>
                      {formatCurrency(
                        dayOrder.items.reduce(
                          (sum, it) => sum + it.qty * it.unit_price,
                          0,
                        ),
                      )}
                    </span>
                  </div>
                  <ul className="text-xs text-black/80 space-y-1">
                    {dayOrder.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span>
                          {item.qty}x {item.name}
                        </span>
                        <span>
                          {formatCurrency(item.qty * item.unit_price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {submittedOrder.drop_off_location && (
              <div className="flex items-center gap-2 text-sm font-bold bg-white border-2 border-black p-3">
                <MapPin className="h-4 w-4 text-red-500 shrink-0" />
                <span>
                  Lokasi Pengantaran: {submittedOrder.drop_off_location}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t-2 border-black">
              <span className="font-black text-lg">Total Pembayaran</span>
              <span className="font-black text-2xl text-black">
                {formatCurrency(submittedOrder.total_price)}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/orders"
              className="w-full sm:w-auto flex items-center justify-center gap-2 h-12 px-6 font-black bg-blue-400 hover:bg-blue-500 text-black border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <History className="h-4 w-4" />
              <span>Lihat Status Pesanan</span>
            </Link>

            <Link
              href="/payment/qris"
              className="w-full sm:w-auto flex items-center justify-center gap-2 h-12 px-6 font-black bg-yellow-300 hover:bg-yellow-400 text-black border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <CreditCard className="h-4 w-4" />
              <span>Bayar via QRIS</span>
            </Link>

            <Button
              type="button"
              variant="outline"
              onClick={handleOrderAgain}
              className="w-full sm:w-auto h-12 px-6 font-bold bg-white text-black border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-none"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Pesan Lagi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ORDER FORM VIEW
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 my-8">
        {/* Step 1: Customer Information Card */}
        <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 sm:p-7">
          <div className="flex items-center gap-2 pb-3 mb-5 border-b-3 border-black">
            <User className="h-5 w-5 text-brut-blue" />
            <h3 className="text-lg sm:text-xl font-black uppercase tracking-wide text-black">
              1. Data Pemesan
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Customer Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-black uppercase tracking-wide text-black">
                    Nama Lengkap / Panggilan *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Masukkan nama Anda"
                      className="h-12 text-base font-bold border-2 border-black rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-white focus:bg-yellow-50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="font-bold text-red-600" />
                </FormItem>
              )}
            />

            {/* Email (Read-only / Logged in account) */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel className="text-sm font-black uppercase tracking-wide text-black">
                      Email Akun *
                    </FormLabel>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-green-700 bg-green-100 border border-green-700 px-2 py-0.5">
                        ✓ Terhubung
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await authClient.signOut();
                            window.location.reload();
                          } catch (err) {
                            console.error("Sign out error:", err);
                          }
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-800 hover:underline cursor-pointer border border-red-300 bg-red-50 px-2 py-0.5 transition-colors"
                        title="Ganti ke akun Google lain"
                      >
                        <LogOut className="h-3 w-3" />
                        <span>Ganti Akun</span>
                      </button>
                    </div>
                  </div>
                  <FormControl>
                    <Input
                      type="email"
                      readOnly
                      disabled
                      className="h-12 text-base font-bold border-2 border-black rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-gray-100 text-black cursor-not-allowed opacity-90"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-black/60 font-medium">
                    Email otomatis diambil dari akun Google Anda untuk
                    konfirmasi pesanan.
                  </p>
                </FormItem>
              )}
            />

            {/* Drop-off / Pickup Point */}
            <FormField
              control={form.control}
              name="drop_off_location"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-sm font-black uppercase tracking-wide text-black">
                    Lokasi Pengantaran / Drop-off Point
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingPickupPoints}
                  >
                    <FormControl>
                      <SelectTrigger className="h-12 text-base font-bold border-2 border-black rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-white">
                        <SelectValue
                          placeholder={
                            isLoadingPickupPoints
                              ? "Memuat titik pengantaran..."
                              : "Pilih lokasi pengantaran / drop-off point"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      {pickupPoints.map((point) => (
                        <SelectItem
                          key={point}
                          value={point}
                          className="font-bold text-sm py-2 cursor-pointer focus:bg-yellow-100"
                        >
                          📍 {point}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="font-bold text-red-600" />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Step 2: Choose Active Days Card */}
        <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-5 border-b-3 border-black">
            <div className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-brut-blue" />
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-wide text-black">
                2. Pilih Hari Katering
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAllDays}
                className="h-8 text-xs font-black border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-yellow-200 hover:bg-yellow-300"
              >
                Pilih Semua (Senin–Jumat)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAllDays}
                className="h-8 text-xs font-bold border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white hover:bg-gray-100"
              >
                Hapus
              </Button>
            </div>
          </div>

          <p className="text-sm font-medium text-black/70 mb-4">
            Klik hari di bawah ini untuk mengaktifkan atau menonaktifkan pesanan
            pada hari tersebut:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {weekDays.map((day) => {
              const isSelected = selectedDates.includes(day.dateKey);
              const itemCount =
                totalSummary.daySummaries[day.dateKey]?.count || 0;

              return (
                <button
                  key={day.dateKey}
                  type="button"
                  onClick={() => toggleDate(day.dateKey)}
                  className={`p-3 text-left border-3 border-black transition-all rounded-none cursor-pointer flex flex-col justify-between min-h-[90px] ${
                    isSelected
                      ? "bg-yellow-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]"
                      : "bg-gray-100 opacity-60 hover:opacity-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-black text-base uppercase text-black">
                      {day.dayName}
                    </span>
                    <div
                      className={`w-5 h-5 border-2 border-black flex items-center justify-center ${
                        isSelected ? "bg-black text-white" : "bg-white"
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-black/70 mt-1">
                      {day.formattedDate}
                    </p>
                    {isSelected && (
                      <span className="inline-block mt-1 text-[11px] font-black bg-black text-yellow-300 px-1.5 py-0.2">
                        {itemCount > 0 ? `${itemCount} porsi` : "Pilih Menu"}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedDates.length === 0 && (
            <div className="mt-4 p-3 bg-red-100 border-2 border-black flex items-center gap-2 text-sm font-bold text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                Silakan pilih minimal satu hari untuk memesan katering.
              </span>
            </div>
          )}
        </div>

        {/* Step 3: Menu Items Selection per Day */}
        {selectedDates.length > 0 && (
          <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-3 border-black">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brut-blue" />
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-wide text-black">
                  3. Pilih Menu & Add-on per Hari
                </h3>
              </div>
              <span className="text-xs font-bold text-black/70 bg-gray-100 border-2 border-black px-2.5 py-1">
                {selectedDates.length} Hari Aktif
              </span>
            </div>

            {isLoadingPriceList ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-black" />
                <span className="font-bold text-sm">Memuat daftar menu...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {weekDays
                  .filter((day) => selectedDates.includes(day.dateKey))
                  .map((day) => {
                    const items = dayOrders[day.dateKey] || [];
                    const subtotal =
                      totalSummary.daySummaries[day.dateKey]?.subtotal || 0;

                    return (
                      <div
                        key={day.dateKey}
                        className="border-3 border-black bg-[#faf9f5] p-4 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                      >
                        {/* Day Card Header */}
                        <div>
                          <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-black">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-lg text-black uppercase">
                                  {day.dayName}
                                </span>
                                <span className="text-xs font-bold text-black/60 bg-white border border-black px-1.5 py-0.5">
                                  {day.formattedDate}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-base text-black">
                                {formatCurrency(subtotal)}
                              </span>
                            </div>
                          </div>

                          {/* Items Added List */}
                          {items.length === 0 ? (
                            <div className="py-4 text-center border-2 border-dashed border-black/30 bg-white mb-3">
                              <p className="text-xs font-bold text-black/50">
                                Belum ada menu ditambahkan
                              </p>
                              <p className="text-[11px] text-black/40 mt-0.5">
                                Klik tombol &quot;Tambah Menu&quot; di bawah
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2 mb-3">
                              {items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                >
                                  <div className="min-w-0 pr-2">
                                    <p className="font-bold text-sm text-black truncate">
                                      {item.name}
                                    </p>
                                    <p className="text-xs font-semibold text-black/60">
                                      {formatCurrency(item.unit_price)} ×{" "}
                                      {item.qty} ={" "}
                                      <span className="text-black font-bold">
                                        {formatCurrency(
                                          item.unit_price * item.qty,
                                        )}
                                      </span>
                                    </p>
                                  </div>

                                  {/* Qty Adjusters */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() =>
                                        updateItemQty(day.dateKey, idx, -1)
                                      }
                                      className="h-7 w-7 rounded-none border-2 border-black bg-white hover:bg-red-100"
                                      aria-label="Kurangi porsi"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-7 text-center font-black text-sm">
                                      {item.qty}
                                    </span>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() =>
                                        updateItemQty(day.dateKey, idx, 1)
                                      }
                                      className="h-7 w-7 rounded-none border-2 border-black bg-white hover:bg-green-100"
                                      aria-label="Tambah porsi"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      onClick={() =>
                                        removeItemFromDay(day.dateKey, idx)
                                      }
                                      className="h-7 w-7 rounded-none border-2 border-black bg-red-400 hover:bg-red-500 text-black ml-1"
                                      aria-label="Hapus menu"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Card Footer: Add Item Popover & Quick Copy */}
                        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-between h-10 text-sm font-bold border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white hover:bg-yellow-100"
                              >
                                <span className="flex items-center gap-1.5">
                                  <Plus className="h-4 w-4" />
                                  Tambah Menu / Add-on
                                </span>
                                <ChevronDown className="h-4 w-4 opacity-70" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-[300px] p-0 border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                              align="start"
                            >
                              <Command>
                                <CommandList>
                                  <CommandEmpty className="p-3 text-xs font-bold text-center">
                                    Menu tidak ditemukan
                                  </CommandEmpty>
                                  {mainItems.length > 0 && (
                                    <CommandGroup heading="Paket Utama / Makanan">
                                      {mainItems.map((item) => (
                                        <CommandItem
                                          key={item.id}
                                          onSelect={() =>
                                            addItemToDay(day.dateKey, item)
                                          }
                                          className="cursor-pointer font-bold text-xs py-2 hover:bg-yellow-100"
                                        >
                                          <span className="flex-1">
                                            {item.name}
                                          </span>
                                          <span className="text-black font-mono">
                                            {formatCurrency(item.price)}
                                          </span>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  )}
                                  {addonItems.length > 0 && (
                                    <CommandGroup heading="Add-on & Pelengkap">
                                      {addonItems.map((item) => (
                                        <CommandItem
                                          key={item.id}
                                          onSelect={() =>
                                            addItemToDay(day.dateKey, item)
                                          }
                                          className="cursor-pointer font-bold text-xs py-2 hover:bg-yellow-100"
                                        >
                                          <span className="flex-1">
                                            {item.name}
                                          </span>
                                          <span className="text-black font-mono">
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

                          {items.length > 0 && selectedDates.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                copyDayToAllSelectedDays(day.dateKey)
                              }
                              title="Salin menu hari ini ke semua hari katering yang dipilih"
                              className="w-full sm:w-auto h-10 px-3 text-xs font-black border-2 border-black rounded-none bg-blue-100 hover:bg-blue-200 shrink-0"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Salin ke Semua
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Special Notes */}
        <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 sm:p-7">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b-3 border-black">
            <Info className="h-5 w-5 text-brut-blue" />
            <h3 className="text-lg sm:text-xl font-black uppercase tracking-wide text-black">
              4. Catatan Khusus (Opsional)
            </h3>
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Contoh: Tanpa sambal, tidak pedas, antar sebelum jam 11:30, alergi udang, dsb."
                    className="min-h-24 text-base font-medium border-2 border-black rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-white resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="font-bold text-red-600" />
              </FormItem>
            )}
          />
        </div>

        {/* Step 5: Sticky Summary & Submit Bar */}
        <div className="border-4 border-black bg-yellow-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Receipt className="h-5 w-5 text-black" />
                <span className="font-black text-sm uppercase tracking-wide text-black">
                  Ringkasan Total Pesanan
                </span>
              </div>
              <p className="text-xs font-bold text-black/70">
                {selectedDates.length} Hari Dipilih •{" "}
                {totalSummary.totalItemCount} Porsi Menu
              </p>
              <p className="text-3xl sm:text-4xl font-black text-black tracking-tight">
                {formatCurrency(totalSummary.grandTotal)}
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || totalSummary.totalItemCount === 0}
              className="w-full md:w-auto min-w-[260px] h-14 text-lg font-black bg-black text-white hover:bg-black/90 border-3 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Mengirim Pesanan...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Kirim Pesanan Sekarang</span>
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
