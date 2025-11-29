"use client";

import * as React from "react";
import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { DAYS_OF_WEEK, ORDER_STATUSES, SORT_OPTIONS } from "@/lib/constants";
import type { OrderFilters } from "@/types/order.types";

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
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(
    filters.date_from ? new Date(filters.date_from) : undefined
  );
  const [dateTo, setDateTo] = React.useState<Date | undefined>(
    filters.date_to ? new Date(filters.date_to) : undefined
  );
  const [sortBy, setSortBy] = React.useState(filters.sort_by || "date");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">(
    filters.sort_order || "desc"
  );

  // Sync local state with external filter changes (e.g., from clear or pagination)
  React.useEffect(() => {
    setSearch(filters.search || "");
    setName(filters.name || "");
    setDay(filters.day || "all");
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
      date_from: dateFrom ? format(dateFrom, "yyyy-MM-dd") : "",
      date_to: dateTo ? format(dateTo, "yyyy-MM-dd") : "",
      sort_by: sortBy,
      sort_order: sortOrder,
      page: 1,
    });
  };

  const handleClearFilters = () => {
    setSearch("");
    setName("");
    setDay("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSortBy("date");
    setSortOrder("desc");
    onFiltersChange({
      page: 1,
      page_size: filters.page_size,
      sort_by: "created_at",
      sort_order: "desc",
    });
  };

  const hasActiveFilters =
    search || name || day !== "all" || dateFrom || dateTo;

  // Check if local state differs from applied filters
  const hasUnappliedChanges =
    search !== (filters.search || "") ||
    name !== (filters.name || "") ||
    day !== (filters.day || "all") ||
    (dateFrom ? format(dateFrom, "yyyy-MM-dd") : "") !==
      (filters.date_from || "") ||
    (dateTo ? format(dateTo, "yyyy-MM-dd") : "") !== (filters.date_to || "") ||
    sortBy !== (filters.sort_by || "date") ||
    sortOrder !== (filters.sort_order || "desc");

  return (
    <div className="space-y-4">
      {/* Top Row: Search, Name, Day */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1">
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
          className="neo-brutal neo-brutal-white w-full sm:w-[200px]"
        />

        {/* Day Filter */}
        <div className="w-full sm:w-[180px]">
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
        </div>
      </div>

      {/* Bottom Row: Date, Sort, Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Date Range:
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start text-left font-normal w-[130px] neo-brutal neo-brutal-white"
                >
                  {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From date"}
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
                  className="justify-start text-left font-normal w-[130px] neo-brutal neo-brutal-white"
                >
                  {dateTo ? format(dateTo, "MMM dd, yyyy") : "To date"}
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

          <Separator orientation="vertical" className="h-8 hidden sm:block" />

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Sort:
            </span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger
                className="w-[130px] neo-brutal neo-brutal-white"
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
                className="w-[110px] neo-brutal neo-brutal-white"
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
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Button
            onClick={handleApplyFilters}
            size="sm"
            className={`gap-2 neo-brutal ${
              hasUnappliedChanges ? "" : "neo-brutal-white"
            }`}
            variant={hasUnappliedChanges ? "default" : "outline"}
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
