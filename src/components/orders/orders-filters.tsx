"use client";

import { Filter, Plus, Search, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DAYS_OF_WEEK,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  SORT_OPTIONS,
} from "@/lib/constants";
import { getOrderCustomers } from "@/services/orders.service";
import type {
  OrderFilters,
  OrderStatus,
  PaymentStatus,
} from "@/types/order.types";

interface OrdersFiltersProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
}

type FilterType = "day" | "payment_status" | "status" | "drop_off_location" | "name";

interface ActiveFilter {
  type: FilterType;
  value: string;
  label: string;
}

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "payment_status", label: "Payment Status" },
  { value: "status", label: "Order Status" },
  { value: "drop_off_location", label: "Pickup Point" },
  { value: "name", label: "Name" },
];

export function OrdersFilters({
  filters,
  onFiltersChange,
}: OrdersFiltersProps) {
  const [search, setSearch] = React.useState(filters.search || "");
  const [sortBy, setSortBy] = React.useState(filters.sort_by || "name");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">(
    filters.sort_order || "asc",
  );
  const [pickupPoints, setPickupPoints] = React.useState<string[]>([]);
  const [activeFilters, setActiveFilters] = React.useState<ActiveFilter[]>([]);
  const [selectedFilterType, setSelectedFilterType] = React.useState<FilterType | "">("");
  const [selectedFilterValue, setSelectedFilterValue] = React.useState("");

  // Sync from parent filters
  React.useEffect(() => {
    setSearch(filters.search || "");
    setSortBy(filters.sort_by || "name");
    setSortOrder(filters.sort_order || "asc");
    
    // Rebuild active filters from parent
    const newActive: ActiveFilter[] = [];
    if (filters.day) {
      newActive.push({ type: "day", value: filters.day, label: `Day: ${filters.day}` });
    }
    if (filters.payment_status) {
      const ps = PAYMENT_STATUSES.find(p => p.value === filters.payment_status);
      newActive.push({ type: "payment_status", value: filters.payment_status, label: `Payment: ${ps?.label || filters.payment_status}` });
    }
    if (filters.status) {
      const os = ORDER_STATUSES.find(s => s.value === filters.status);
      newActive.push({ type: "status", value: filters.status, label: `Status: ${os?.label || filters.status}` });
    }
    if (filters.drop_off_location) {
      newActive.push({ type: "drop_off_location", value: filters.drop_off_location, label: `Pickup: ${filters.drop_off_location}` });
    }
    if (filters.name) {
      newActive.push({ type: "name", value: filters.name, label: `Name: ${filters.name}` });
    }
    setActiveFilters(newActive);
  }, [filters]);

  // Fetch distinct pickup points from customers
  React.useEffect(() => {
    getOrderCustomers()
      .then((res) => {
        const unique = Array.from(
          new Set(
            res.data
              .map((c) => c.drop_off_location)
              .filter((loc): loc is string => !!loc && loc.trim() !== ""),
          ),
        ).sort();
        setPickupPoints(unique);
      })
      .catch(() => {
        setPickupPoints([]);
      });
  }, []);

  const addFilter = () => {
    if (!selectedFilterType || !selectedFilterValue) return;
    
    // Remove existing filter of same type
    const filtered = activeFilters.filter(f => f.type !== selectedFilterType);
    
    let label = "";
    if (selectedFilterType === "day") {
      label = `Day: ${selectedFilterValue}`;
    } else if (selectedFilterType === "payment_status") {
      const ps = PAYMENT_STATUSES.find(p => p.value === selectedFilterValue);
      label = `Payment: ${ps?.label || selectedFilterValue}`;
    } else if (selectedFilterType === "status") {
      const os = ORDER_STATUSES.find(s => s.value === selectedFilterValue);
      label = `Status: ${os?.label || selectedFilterValue}`;
    } else if (selectedFilterType === "drop_off_location") {
      label = `Pickup: ${selectedFilterValue}`;
    } else if (selectedFilterType === "name") {
      label = `Name: ${selectedFilterValue}`;
    }
    
    setActiveFilters([...filtered, { type: selectedFilterType, value: selectedFilterValue, label }]);
    setSelectedFilterType("");
    setSelectedFilterValue("");
    applyFilters([...filtered, { type: selectedFilterType, value: selectedFilterValue, label }], search);
  };

  const removeFilter = (type: FilterType) => {
    const newFilters = activeFilters.filter(f => f.type !== type);
    setActiveFilters(newFilters);
    applyFilters(newFilters, search);
  };

  const applyFilters = (filtersList: ActiveFilter[], searchTerm: string) => {
    const newFilters: OrderFilters = {
      search: searchTerm || "",
      sort_by: sortBy,
      sort_order: sortOrder,
      page: 1,
      date_from: filters.date_from,
      date_to: filters.date_to,
    };
    
    filtersList.forEach(f => {
      if (f.type === "day") newFilters.day = f.value;
      else if (f.type === "payment_status") newFilters.payment_status = f.value as PaymentStatus;
      else if (f.type === "status") newFilters.status = f.value as OrderStatus;
      else if (f.type === "drop_off_location") newFilters.drop_off_location = f.value;
      else if (f.type === "name") newFilters.name = f.value;
    });
    
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    setSearch("");
    setActiveFilters([]);
    setSortBy("name");
    setSortOrder("asc");
    onFiltersChange({
      page: 1,
      page_size: 20,
      sort_by: "name",
      sort_order: "asc",
    });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    // Apply search immediately
    const newFilters: OrderFilters = {
      search: value || "",
      sort_by: sortBy,
      sort_order: sortOrder,
      page: 1,
      date_from: filters.date_from,
      date_to: filters.date_to,
    };
    
    activeFilters.forEach(f => {
      if (f.type === "day") newFilters.day = f.value;
      else if (f.type === "payment_status") newFilters.payment_status = f.value as PaymentStatus;
      else if (f.type === "status") newFilters.status = f.value as OrderStatus;
      else if (f.type === "drop_off_location") newFilters.drop_off_location = f.value;
      else if (f.type === "name") newFilters.name = f.value;
    });
    
    onFiltersChange(newFilters);
  };

  const hasActiveFilters = activeFilters.length > 0 || search;

  const renderFilterValueInput = () => {
    if (!selectedFilterType) return null;
    
    if (selectedFilterType === "day") {
      return (
        <Select value={selectedFilterValue} onValueChange={setSelectedFilterValue}>
          <SelectTrigger className="w-[150px] neo-brutal neo-brutal-white">
            <SelectValue placeholder="Select day" />
          </SelectTrigger>
          <SelectContent>
            {DAYS_OF_WEEK.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    
    if (selectedFilterType === "payment_status") {
      return (
        <Select value={selectedFilterValue} onValueChange={setSelectedFilterValue}>
          <SelectTrigger className="w-[150px] neo-brutal neo-brutal-white">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    
    if (selectedFilterType === "status") {
      return (
        <Select value={selectedFilterValue} onValueChange={setSelectedFilterValue}>
          <SelectTrigger className="w-[150px] neo-brutal neo-brutal-white">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    
    if (selectedFilterType === "drop_off_location") {
      return (
        <Select value={selectedFilterValue} onValueChange={setSelectedFilterValue}>
          <SelectTrigger className="w-[150px] neo-brutal neo-brutal-white">
            <SelectValue placeholder="Select pickup" />
          </SelectTrigger>
          <SelectContent>
            {pickupPoints.map((loc) => (
              <SelectItem key={loc} value={loc}>{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    
    if (selectedFilterType === "name") {
      return (
        <Input
          placeholder="Enter name..."
          value={selectedFilterValue}
          onChange={(e) => setSelectedFilterValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addFilter()}
          className="w-[150px] neo-brutal neo-brutal-white"
        />
      );
    }
    
    return null;
  };

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Add Filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 neo-brutal neo-brutal-white w-full"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedFilterType} onValueChange={(v) => {
            setSelectedFilterType(v as FilterType);
            setSelectedFilterValue("");
          }}>
            <SelectTrigger className="w-[140px] neo-brutal neo-brutal-white">
              <Plus className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Add filter" />
            </SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {renderFilterValueInput()}
          
          <Button
            onClick={addFilter}
            size="sm"
            disabled={!selectedFilterType || !selectedFilterValue}
            className="neo-brutal bg-green-500 hover:bg-green-600 text-white"
          >
            Add
          </Button>
        </div>
      </div>

      {/* Row 2: Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((f) => (
            <Badge
              key={f.type}
              variant="secondary"
              className="gap-1 neo-brutal neo-brutal-white"
            >
              {f.label}
              <button
                onClick={() => removeFilter(f.type)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Row 3: Sort + Clear */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Sort:
          </span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] neo-brutal neo-brutal-white" size="sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(v: "asc" | "desc") => setSortOrder(v)}>
            <SelectTrigger className="w-[140px] neo-brutal neo-brutal-white" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="gap-2 neo-brutal neo-brutal-white sm:ml-auto"
          >
            <X className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>
    </div>
  );
}
