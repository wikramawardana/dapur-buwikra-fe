"use client";

import { Search, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const ALL_VALUE = "all";

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

  const hasActiveFilters =
    !!filters.search ||
    !!filters.day ||
    !!filters.payment_status ||
    !!filters.status ||
    !!filters.drop_off_location ||
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
          <Select
            value={filters.status || ALL_VALUE}
            onValueChange={(value) =>
              updateFilters({
                status: value === ALL_VALUE ? "" : (value as OrderStatus),
              })
            }
          >
            <SelectTrigger className="w-full neo-brutal neo-brutal-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All statuses</SelectItem>
              {ORDER_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase">Payment</Label>
          <Select
            value={filters.payment_status || ALL_VALUE}
            onValueChange={(value) =>
              updateFilters({
                payment_status:
                  value === ALL_VALUE ? "" : (value as PaymentStatus),
              })
            }
          >
            <SelectTrigger className="w-full neo-brutal neo-brutal-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All payments</SelectItem>
              {PAYMENT_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase">Day</Label>
          <Select
            value={filters.day || ALL_VALUE}
            onValueChange={(value) =>
              updateFilters({ day: value === ALL_VALUE ? "" : value })
            }
          >
            <SelectTrigger className="w-full neo-brutal neo-brutal-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All days</SelectItem>
              {DAYS_OF_WEEK.map((day) => (
                <SelectItem key={day} value={day}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase">Pickup Point</Label>
          <Select
            value={filters.drop_off_location || ALL_VALUE}
            onValueChange={(value) =>
              updateFilters({
                drop_off_location: value === ALL_VALUE ? "" : value,
              })
            }
          >
            <SelectTrigger className="w-full neo-brutal neo-brutal-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All pickup points</SelectItem>
              {pickupPoints.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
