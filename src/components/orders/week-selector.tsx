"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateWeekOptions, getDefaultWeek } from "@/lib/week-utils";

interface WeekSelectorProps {
  value: string;
  onChange: (dateFrom: string, dateTo: string) => void;
}

export function WeekSelector({ value, onChange }: WeekSelectorProps) {
  const options = React.useMemo(() => generateWeekOptions(), []);

  const currentIndex = options.findIndex((o) => o.value === value);

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prev = options[currentIndex - 1];
      onChange(prev.dateFrom, prev.dateTo);
    }
  };

  const handleNext = () => {
    if (currentIndex < options.length - 1) {
      const next = options[currentIndex + 1];
      onChange(next.dateFrom, next.dateTo);
    }
  };

  const handleSelect = (val: string) => {
    const option = options.find((o) => o.value === val);
    if (option) {
      onChange(option.dateFrom, option.dateTo);
    }
  };

  const handleToday = () => {
    const def = getDefaultWeek();
    onChange(def.dateFrom, def.dateTo);
  };

  return (
    <div className="flex items-center gap-2">
      <CalendarDays className="h-4 w-4 text-black/60 dark:text-white/60 shrink-0 hidden sm:block" />
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0 border-2 border-black dark:border-white rounded-none hover:bg-yellow-100 dark:hover:bg-yellow-900"
        onClick={handlePrev}
        disabled={currentIndex <= 0}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Select value={value} onValueChange={handleSelect}>
        <SelectTrigger className="w-[220px] sm:w-[280px] border-2 border-black dark:border-white rounded-none font-bold text-xs sm:text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
          <SelectValue placeholder="Select week" />
        </SelectTrigger>
        <SelectContent className="border-2 border-black dark:border-white rounded-none">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="font-medium text-xs sm:text-sm"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0 border-2 border-black dark:border-white rounded-none hover:bg-yellow-100 dark:hover:bg-yellow-900"
        onClick={handleNext}
        disabled={currentIndex >= options.length - 1}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 border-2 border-black dark:border-white rounded-none font-bold text-xs hover:bg-yellow-100 dark:hover:bg-yellow-900 hidden sm:flex"
        onClick={handleToday}
      >
        Today
      </Button>
    </div>
  );
}
