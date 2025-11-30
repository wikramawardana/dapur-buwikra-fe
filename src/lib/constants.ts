export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Friday",
] as const;

export const MENU_ITEMS = [
  { value: "nasi", label: "Nasi", price: 17500, perDay: true },
  {
    value: "add_on_kulit_kecil",
    label: "Add On Kulit Kecil",
    price: 7500,
    perDay: false,
  },
  {
    value: "add_on_kulit_besar",
    label: "Add On Kulit Besar",
    price: 15000,
    perDay: false,
  },
  {
    value: "add_on_tambah_porsi",
    label: "Add On Tambah Porsi",
    price: 2500,
    perDay: true,
  },
  {
    value: "add_on_tambah_porsi_besar",
    label: "Add On Tambah Porsi Besar",
    price: 7500,
    perDay: true,
  },
] as const;

export const ORDER_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const PAYMENT_STATUSES = [
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
] as const;

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const SORT_OPTIONS = [
  { value: "date", label: "Date" },
  { value: "name", label: "Name" },
  { value: "total_price", label: "Total Price" },
  { value: "created_at", label: "Created At" },
] as const;
