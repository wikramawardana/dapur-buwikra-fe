import { buildQueryString } from "@/lib/api.config";
import type { ShopeeSummaryStats, ShopeeTransactionRow } from "@/lib/shopee-db";

export interface ShopeeTransactionsResponse {
  success: boolean;
  data: ShopeeTransactionRow[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: ShopeeSummaryStats;
}

export interface ShopeeTokenStatusResponse {
  success: boolean;
  configured: boolean;
  maskedToken: string;
  isValid: boolean;
  error?: string;
}

export interface ShopeeSyncResponse {
  success: boolean;
  count: number;
  inserted: number;
  updated: number;
  tokenExpired: boolean;
  message: string;
}

export async function fetchShopeeTransactions(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: "all" | "claimed" | "unclaimed";
  startDate?: string;
  endDate?: string;
}): Promise<ShopeeTransactionsResponse> {
  const query = buildQueryString(params);
  const resp = await fetch(`/api/admin/shopee/transactions${query}`);
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || "Gagal mengambil data transaksi ShopeePay");
  }
  return resp.json();
}

export async function syncShopeeMutations(
  days: number = 7,
): Promise<ShopeeSyncResponse> {
  const resp = await fetch("/api/admin/shopee/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ days }),
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error || "Gagal sinkronisasi dengan ShopeePay");
  }
  return data;
}

export async function linkShopeeTransactionToOrder(payload: {
  transactionId: string;
  orderId: string;
  customerName?: string;
  markOrderPaid?: boolean;
}): Promise<{ success: boolean; message: string }> {
  const resp = await fetch("/api/admin/shopee/link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error || "Gagal menghubungkan transaksi");
  }
  return data;
}

export async function fetchShopeeTokenStatus(): Promise<ShopeeTokenStatusResponse> {
  const resp = await fetch("/api/admin/shopee/token");
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || "Gagal memeriksa status token");
  }
  return resp.json();
}

export async function updateShopeeTokenSetting(
  token: string,
): Promise<{ success: boolean; message: string }> {
  const resp = await fetch("/api/admin/shopee/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error || "Gagal memperbarui token");
  }
  return data;
}
