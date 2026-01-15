"use client";

import { format } from "date-fns";
import { CalendarIcon, Filter, Search, X } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import {
  DAYS_OF_WEEK,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  SORT_OPTIONS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type {
  OrderFilters,
  OrderStatus,
  PaymentStatus,
} from "@/types/order.types";

interface OrdersFiltersProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
}

export function OrdersFilters({
  filters,
  onFiltersChange,
}: OrdersFiltersProps) {
  // Local state for all filter inputs
  const [search, setSearch] = React.useState(filters.search || "");
  const [name, setName] = React.useState(filters.name || "");
  const [day, setDay] = React.useState(filters.day || "all");
  const [paymentStatus, setPaymentStatus] = React.useState(
    filters.payment_status || "all",
  );
  const [orderStatus, setOrderStatus] = React.useState(filters.status || "all");
  // Combined date range state
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    () => {
      const from = filters.date_from ? new Date(filters.date_from) : undefined;
      const to = filters.date_to ? new Date(filters.date_to) : undefined;
      return from || to ? { from, to } : undefined;
    },
  );
  const [sortBy, setSortBy] = React.useState(filters.sort_by || "date");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">(
    filters.sort_order || "desc",
  );

  // Sync local state with external filter changes (e.g., from clear or pagination)
  React.useEffect(() => {
    setSearch(filters.search || "");
    setName(filters.name || "");
    setDay(filters.day || "all");
    setPaymentStatus(filters.payment_status || "all");
    setOrderStatus(filters.status || "all");
    const from = filters.date_from ? new Date(filters.date_from) : undefined;
    const to = filters.date_to ? new Date(filters.date_to) : undefined;
    setDateRange(from || to ? { from, to } : undefined);
    setSortBy(filters.sort_by || "date");
    setSortOrder(filters.sort_order || "desc");
  }, [filters]);

  const handleApplyFilters = () => {
    onFiltersChange({
      ...filters,
      search,
      name,
      day: day === "all" ? "" : day,
      payment_status:
        paymentStatus === "all" ? "" : (paymentStatus as PaymentStatus),
      status: orderStatus === "all" ? undefined : (orderStatus as OrderStatus),
      date_from: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "",
      date_to: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "",
      sort_by: sortBy,
      sort_order: sortOrder,
      page: 1,
    });
  };

  const handleClearFilters = () => {
    setSearch("");
    setName("");
    setDay("all");
    setPaymentStatus("all");
    setOrderStatus("all");
    setDateRange(undefined);
    setSortBy("date");
    setSortOrder("desc");
    onFiltersChange({
      page: 1,
      page_size: 20,
      sort_by: "date",
      sort_order: "desc",
    });
  };

  // Check if any filters are active (different from defaults)
  // Default is: no search, no name, all days, all payment status, no date range
  const hasActiveFilters =
    search ||
    name ||
    day !== "all" ||
    paymentStatus !== "all" ||
    orderStatus !== "all" ||
    dateRange?.from ||
    dateRange?.to;

  // Check if local state differs from applied filters
  const hasUnappliedChanges =
    search !== (filters.search || "") ||
    name !== (filters.name || "") ||
    day !== (filters.day || "all") ||
    paymentStatus !== (filters.payment_status || "all") ||
    orderStatus !== (filters.status || "all") ||
    (dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "") !==
      (filters.date_from || "") ||
    (dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "") !==
      (filters.date_to || "") ||
    sortBy !== (filters.sort_by || "date") ||
    sortOrder !== (filters.sort_order || "desc");

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top Row: Search, Name, Day, Payment Status, Order Status */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-5 sm:gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
            className="pl-9 neo-brutal neo-brutal-white w-full"
          />
        </div>

        {/* Name Filter */}
        <Input
          placeholder="Filter by name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
          className="neo-brutal neo-brutal-white w-full"
        />

        {/* Day Filter */}
        <Select value={day} onValueChange={setDay}>
          <SelectTrigger className="neo-brutal neo-brutal-white w-full">
            <SelectValue placeholder="All Days" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Days</SelectItem>
            {DAYS_OF_WEEK.map((day) => (
              <SelectItem key={day} value={day}>
                {day}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Payment Status Filter */}
        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
          <SelectTrigger className="neo-brutal neo-brutal-white w-full">
            <SelectValue placeholder="All Payment Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payment Status</SelectItem>
            {PAYMENT_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Order Status Filter */}
        <Select value={orderStatus} onValueChange={setOrderStatus}>
          <SelectTrigger className="neo-brutal neo-brutal-white w-full">
            <SelectValue placeholder="All Order Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Order Status</SelectItem>
            {ORDER_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bottom Row: Date Range, Sort, Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap sm:gap-3">
        {/* Date Range Picker */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Date:
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "justify-start text-left font-normal w-[240px] neo-brutal neo-brutal-white text-xs sm:text-sm",
                  !dateRange && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM dd")} -{" "}
                      {format(dateRange.to, "MMM dd, yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "MMM dd, yyyy")
                  )
                ) : (
                  "Pick a date range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Sort:
          </span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger
              className="w-[140px] neo-brutal neo-brutal-white"
              size="sm"
            >
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sortOrder}
            onValueChange={(value: "asc" | "desc") => setSortOrder(value)}
          >
            <SelectTrigger
              className="w-[140px] neo-brutal neo-brutal-white"
              size="sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:ml-auto">
          <Button
            onClick={handleApplyFilters}
            size="sm"
            className={`gap-2 neo-brutal ${
              hasUnappliedChanges
                ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-600 shadow-lg ring-2 ring-blue-400 ring-offset-2 animate-pulse"
                : "bg-blue-500 hover:bg-blue-600 text-white border-blue-600"
            }`}
          >
            <Filter className="h-4 w-4" />
            Apply Filters
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="gap-2 neo-brutal neo-brutal-white"
            >
              <X className="h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
