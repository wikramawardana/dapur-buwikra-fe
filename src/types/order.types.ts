export interface Order {
  id: string;
  day: string;
  date: string;
  name: string;
  ordered: string;
  qty: number;
  unit_price: number;
  total_price: number;
  notes: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = "pending" | "completed" | "cancelled";
export type PaymentStatus = "paid" | "unpaid";

export interface PaginationInfo {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface OrdersResponse {
  status: string;
  message: string;
  data: {
    data: Order[];
    pagination: PaginationInfo;
  };
}

export interface CreateOrderPayload {
  day: string;
  date: string;
  name: string;
  ordered: string;
  qty: number;
  unit_price: number;
  payment_status: PaymentStatus;
}

export interface OrderFilters {
  search?: string;
  page?: number;
  page_size?: number;
  status?: OrderStatus | "";
  day?: string;
  name?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface OrderStats {
  total_count: number;
  total_sum: number;
}

export interface OrderStatsResponse {
  status: string;
  message: string;
  data: OrderStats;
}

export interface OrderCountResponse {
  status: string;
  message: string;
  data: {
    count: number;
  };
}

export interface OrderSumResponse {
  status: string;
  message: string;
  data: {
    total_amount: number;
  };
}
