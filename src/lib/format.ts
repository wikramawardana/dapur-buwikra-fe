import { format, parseISO } from "date-fns";

/**
 * Format a number as Indonesian Rupiah currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a date string to a readable format
 */
export function formatDate(
  dateString: string,
  formatStr = "dd MMM yyyy",
): string {
  try {
    const date = parseISO(dateString);
    return format(date, formatStr);
  } catch {
    return dateString;
  }
}

/**
 * Format a datetime string to a readable format
 */
export function formatDateTime(dateString: string): string {
  return formatDate(dateString, "dd MMM yyyy, HH:mm");
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num);
}
