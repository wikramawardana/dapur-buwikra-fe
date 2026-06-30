"use client";

import { ChevronDown, Search, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  DAYS_OF_WEEK,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  SORT_OPTIONS,
} from "@/lib/constants";
import { getActivePickupPoints } from "@/services/pickup-point.service";
import type {
  OrderFilters,
  OrderStatus,
  PaymentStatus,
} from "@/types/order.types";

interface OrdersFiltersProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
}

interface MultiSelectFilterProps {
  allLabel: string;
  idPrefix: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

function getFilterValues(value?: string | string[] | ""): string[] {
  if (!value) return [];
  const values = Array.isArray(value) ? value : value.split(",");

  return values.map((item) => item.trim()).filter(Boolean);
}

function getFilteredValues<T extends string>(
  value: string | string[] | "" | undefined,
  options: readonly { value: T; label: string }[],
): T[] {
  return getFilterValues(value).filter((item): item is T =>
    options.some((option) => option.value === item),
  );
}

function MultiSelectFilter({
  allLabel,
  idPrefix,
  options,
  selectedValues,
  onChange,
}: MultiSelectFilterProps) {
  const filterLabel =
    selectedValues.length === 0
      ? allLabel
      : selectedValues
          .map(
            (value) =>
              options.find((option) => option.value === value)?.label ?? value,
          )
          .join(", ");

  const handleToggle = (value: string, isChecked: boolean) => {
    const nextValues = isChecked
      ? [...selectedValues, value]
      : selectedValues.filter((selectedValue) => selectedValue !== value);

    onChange(nextValues);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between neo-brutal neo-brutal-white font-normal"
        >
          <span className="truncate">{filterLabel}</span>
          <ChevronDown className="h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-56 rounded-none border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
      >
        <div className="space-y-2">
          {options.map((option) => {
            const checkboxId = `${idPrefix}-${option.value}`;
            return (
              <div key={option.value} className="flex items-center gap-2">
                <Checkbox
                  id={checkboxId}
                  checked={selectedValues.includes(option.value)}
                  onCheckedChange={(checked) =>
                    handleToggle(option.value, checked === true)
                  }
                />
                <Label
                  htmlFor={checkboxId}
                  className="cursor-pointer text-sm font-medium"
                >
                  {option.label}
                </Label>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function getPaymentStatusValues(
  paymentStatus: OrderFilters["payment_status"],
): PaymentStatus[] {
  return getFilteredValues(paymentStatus, PAYMENT_STATUSES);
}

function getOrderStatusValues(status: OrderFilters["status"]): OrderStatus[] {
  return getFilteredValues(status, ORDER_STATUSES);
}

export function OrdersFilters({
  filters,
  onFiltersChange,
}: OrdersFiltersProps) {
  const [search, setSearch] = React.useState(filters.search || "");
  const [pickupPoints, setPickupPoints] = React.useState<string[]>([]);
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  React.useEffect(() => {
    setSearch(filters.search || "");
  }, [filters.search]);

  React.useEffect(
    () => () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    },
    [],
  );

  React.useEffect(() => {
    getActivePickupPoints()
      .then((res) => {
        setPickupPoints(res.data.map((point) => point.name));
      })
      .catch(() => {
        setPickupPoints([]);
      });
  }, []);

  const updateFilters = (updates: Partial<OrderFilters>) => {
    onFiltersChange({
      ...filters,
      ...updates,
      page: 1,
    });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      updateFilters({ search: value });
    }, 300);
  };

  const handleClearFilters = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setSearch("");
    onFiltersChange({
      page: 1,
      page_size: filters.page_size,
      sort_by: "name",
      sort_order: "asc",
      date_from: filters.date_from,
      date_to: filters.date_to,
    });
  };

  const selectedPaymentStatuses = getPaymentStatusValues(
    filters.payment_status,
  );
  const selectedOrderStatuses = getOrderStatusValues(filters.status);
  const selectedDays = getFilterValues(filters.day);
  const selectedPickupPoints = getFilterValues(filters.drop_off_location);
  const pickupPointOptions = Array.from(
    new Set([...pickupPoints, ...selectedPickupPoints]),
  ).map((location) => ({
    value: location,
    label: location,
  }));

  const handleOrderStatusChange = (statuses: string[]) => {
    updateFilters({
      status: statuses.length > 0 ? (statuses as OrderStatus[]) : "",
    });
  };

  const handlePaymentStatusChange = (statuses: string[]) => {
    updateFilters({
      payment_status: statuses.length > 0 ? (statuses as PaymentStatus[]) : "",
    });
  };

  const handleDayChange = (days: string[]) => {
    updateFilters({
      day: days.length > 0 ? days : "",
    });
  };

  const handlePickupPointChange = (locations: string[]) => {
    updateFilters({
      drop_off_location: locations.length > 0 ? locations : "",
    });
  };

  const hasActiveFilters =
    !!filters.search ||
    selectedDays.length > 0 ||
    selectedPaymentStatuses.length > 0 ||
    selectedOrderStatuses.length > 0 ||
    selectedPickupPoints.length > 0 ||
    !!filters.name ||
    (filters.sort_by || "name") !== "name" ||
    (filters.sort_order || "asc") !== "asc";

  return (
    <div className="space-y-3 border-2 border-black bg-white p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-black dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="order-search" className="font-bold">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="order-search"
              placeholder="Search name, email, or order..."
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="w-full pl-9 neo-brutal neo-brutal-white"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={handleClearFilters}
            className="gap-2 neo-brutal neo-brutal-white"
          >
            <X className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase">Order Status</Label>
          <MultiSelectFilter
            allLabel="All statuses"
            idPrefix="status-filter"
            options={[...ORDER_STATUSES]}
            selectedValues={selectedOrderStatuses}
            onChange={handleOrderStatusChange}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase">Payment</Label>
          <MultiSelectFilter
            allLabel="All payments"
            idPrefix="payment-filter"
            options={[...PAYMENT_STATUSES]}
            selectedValues={selectedPaymentStatuses}
            onChange={handlePaymentStatusChange}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase">Day</Label>
          <MultiSelectFilter
            allLabel="All days"
            idPrefix="day-filter"
            options={DAYS_OF_WEEK.map((day) => ({ value: day, label: day }))}
            selectedValues={selectedDays}
            onChange={handleDayChange}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase">Pickup Point</Label>
          <MultiSelectFilter
            allLabel="All pickup points"
            idPrefix="pickup-filter"
            options={pickupPointOptions}
            selectedValues={selectedPickupPoints}
            onChange={handlePickupPointChange}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase">Sort By</Label>
          <Select
            value={filters.sort_by || "name"}
            onValueChange={(value) => updateFilters({ sort_by: value })}
          >
            <SelectTrigger className="w-full neo-brutal neo-brutal-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase">Direction</Label>
          <Select
            value={filters.sort_order || "asc"}
            onValueChange={(value: "asc" | "desc") =>
              updateFilters({ sort_order: value })
            }
          >
            <SelectTrigger className="w-full neo-brutal neo-brutal-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
