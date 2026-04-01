import {
  addWeeks,
  endOfWeek,
  format,
  getDay,
  startOfWeek,
  subWeeks,
} from "date-fns";

export interface WeekOption {
  label: string;
  value: string;
  dateFrom: string;
  dateTo: string;
}

const WEEK_OPTIONS_RANGE = { past: 8, future: 4 };

function mondayWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function fridayWeekEnd(date: Date): Date {
  const end = endOfWeek(date, { weekStartsOn: 1 });
  const friday = new Date(end);
  friday.setDate(friday.getDate() - 2);
  return friday;
}

export function getWeekRange(referenceDate: Date): {
  dateFrom: string;
  dateTo: string;
} {
  const monday = mondayWeekStart(referenceDate);
  const friday = fridayWeekEnd(referenceDate);
  return {
    dateFrom: format(monday, "yyyy-MM-dd"),
    dateTo: format(friday, "yyyy-MM-dd"),
  };
}

/**
 * Returns the week to display on initial load.
 * Mon-Fri: current week. Sat-Sun: next week.
 */
export function getDefaultWeek(): { dateFrom: string; dateTo: string } {
  const today = new Date();
  const dayOfWeek = getDay(today);
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const target = isWeekend ? addWeeks(today, 1) : today;
  return getWeekRange(target);
}

export function getWeekValue(dateFrom: string): string {
  return dateFrom;
}

function formatWeekLabel(monday: Date, friday: Date, today: Date): string {
  const todayMonday = mondayWeekStart(today);
  const diff = Math.round(
    (monday.getTime() - todayMonday.getTime()) / (7 * 24 * 60 * 60 * 1000),
  );

  const range = `${format(monday, "d MMM")} - ${format(friday, "d MMM yyyy")}`;

  if (diff === 0) return `This Week (${range})`;
  if (diff === 1) return `Next Week (${range})`;
  if (diff === -1) return `Last Week (${range})`;
  return range;
}

export function generateWeekOptions(): WeekOption[] {
  const today = new Date();
  const options: WeekOption[] = [];

  for (let i = -WEEK_OPTIONS_RANGE.past; i <= WEEK_OPTIONS_RANGE.future; i++) {
    const ref =
      i === 0 ? today : i > 0 ? addWeeks(today, i) : subWeeks(today, -i);
    const monday = mondayWeekStart(ref);
    const friday = fridayWeekEnd(ref);
    const dateFrom = format(monday, "yyyy-MM-dd");
    const dateTo = format(friday, "yyyy-MM-dd");

    options.push({
      label: formatWeekLabel(monday, friday, today),
      value: dateFrom,
      dateFrom,
      dateTo,
    });
  }

  return options;
}
