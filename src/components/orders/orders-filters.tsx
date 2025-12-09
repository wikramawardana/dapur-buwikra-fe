"use client";

import { format } from "date-fns";
import { Filter, Search, X } from "lucide-react";
import * as React from "react";
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
import { DAYS_OF_WEEK, PAYMENT_STATUSES, SORT_OPTIONS } from "@/lib/constants";
import type { OrderFilters, PaymentStatus } from "@/types/order.types";

/**
 * Get the current work week (Monday to Friday).
 * If today is Saturday or Sunday, return next week's Monday to Friday.
 */
function getCurrentWorkWeek(): { dateFrom: Date; dateTo: Date } {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  let monday: Date;

  if (dayOfWeek === 0) {
    // Sunday: get next week (Monday is tomorrow)
    monday = new Date(today);
    monday.setDate(today.getDate() + 1);
  } else if (dayOfWeek === 6) {
    // Saturday: get next week (Monday is in 2 days)
    monday = new Date(today);
    monday.setDate(today.getDate() + 2);
  } else {
    // Weekday: get current week's Monday
    monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek - 1));
  }

  // Friday is 4 days after Monday
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  return {
    dateFrom: monday,
    dateTo: friday,
  };
}

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
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(
    filters.date_from ? new Date(filters.date_from) : undefined,
  );
  const [dateTo, setDateTo] = React.useState<Date | undefined>(
    filters.date_to ? new Date(filters.date_to) : undefined,
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
    setDateFrom(filters.date_from ? new Date(filters.date_from) : undefined);
    setDateTo(filters.date_to ? new Date(filters.date_to) : undefined);
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
      date_from: dateFrom ? format(dateFrom, "yyyy-MM-dd") : "",
      date_to: dateTo ? format(dateTo, "yyyy-MM-dd") : "",
      sort_by: sortBy,
      sort_order: sortOrder,
      page: 1,
    });
  };

  const handleClearFilters = () => {
    const workWeek = getCurrentWorkWeek();
    setSearch("");
    setName("");
    setDay("all");
    setPaymentStatus("all");
    setDateFrom(workWeek.dateFrom);
    setDateTo(workWeek.dateTo);
    setSortBy("name");
    setSortOrder("asc");
    onFiltersChange({
      page: 1,
      page_size: 20,
      sort_by: "name",
      sort_order: "asc",
      date_from: format(workWeek.dateFrom, "yyyy-MM-dd"),
      date_to: format(workWeek.dateTo, "yyyy-MM-dd"),
    });
  };

  // Get current work week for comparison
  const currentWorkWeek = React.useMemo(() => getCurrentWorkWeek(), []);
  const isDefaultDateRange =
    dateFrom &&
    dateTo &&
    format(dateFrom, "yyyy-MM-dd") ===
      format(currentWorkWeek.dateFrom, "yyyy-MM-dd") &&
    format(dateTo, "yyyy-MM-dd") ===
      format(currentWorkWeek.dateTo, "yyyy-MM-dd");

  const hasActiveFilters =
    search ||
    name ||
    day !== "all" ||
    paymentStatus !== "all" ||
    !isDefaultDateRange;

  // Check if local state differs from applied filters
  const hasUnappliedChanges =
    search !== (filters.search || "") ||
    name !== (filters.name || "") ||
    day !== (filters.day || "all") ||
    paymentStatus !== (filters.payment_status || "all") ||
    (dateFrom ? format(dateFrom, "yyyy-MM-dd") : "") !==
      (filters.date_from || "") ||
    (dateTo ? format(dateTo, "yyyy-MM-dd") : "") !== (filters.date_to || "") ||
    sortBy !== (filters.sort_by || "date") ||
    sortOrder !== (filters.sort_order || "desc");

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top Row: Search, Name, Day, Payment Status */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-3">
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
      </div>

      {/* Bottom Row: Date Range, Sort, Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap sm:gap-3">
        {/* Date Range */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Date:
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="justify-start text-left font-normal w-[140px] neo-brutal neo-brutal-white text-xs sm:text-sm"
              >
                {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground">→</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="justify-start text-left font-normal w-[140px] neo-brutal neo-brutal-white text-xs sm:text-sm"
              >
                {dateTo ? format(dateTo, "MMM dd, yyyy") : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
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
