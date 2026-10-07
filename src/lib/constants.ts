export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

// MENU_ITEMS removed - now fetched from /price-list/active API

export const ORDER_STATUSES = [
  { value: "pending", label: "Menunggu" },
  { value: "accepted", label: "Diterima" },
  { value: "rejected", label: "Ditolak" },
  { value: "inprogress", label: "Diproses" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
] as const;

export const PAYMENT_STATUSES = [
  { value: "paid", label: "Lunas" },
  { value: "partial", label: "Sebagian dibayar" },
  { value: "unpaid", label: "Belum lunas" },
] as const;

export const DAY_PAYMENT_STATUSES = [
  { value: "paid", label: "Lunas" },
  { value: "unpaid", label: "Belum lunas" },
] as const;

export const DEFAULT_PAGE_SIZE = 100;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const SORT_OPTIONS = [
  { value: "date", label: "Tanggal" },
  { value: "name", label: "Nama" },
  { value: "total_price", label: "Total harga" },
  { value: "created_at", label: "Waktu dibuat" },
] as const;

export function formatRoleDisplay(role: string | null | undefined): string {
  return (
    (
      { admin: "Admin", chef: "Koki", user: "Pengguna" } as Record<
        string,
        string
      >
    )[role || ""] ?? "Belum memiliki peran"
  );
}
