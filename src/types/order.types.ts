// New structure: items within each day order
export interface OrderMenuItem {
  name: string;
  qty: number;
  unit_price: number;
}

// Day order with specific date and items for that day
export interface DayOrder {
  day: string;
  date: string;
  items: OrderMenuItem[];
}

export interface Order {
  id: string;
  name: string;
  email?: string;
  day_orders: DayOrder[];
  total_price: number;
  notes: string;
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

export interface SingleOrderResponse {
  status: string;
  message: string;
  data: Order;
}

export interface CreateOrderPayload {
  name: string;
  email?: string;
  day_orders: DayOrder[];
  notes?: string;
}

export interface UpdateOrderPayload {
  name?: string;
  email?: string;
  day_orders?: DayOrder[];
  payment_status?: PaymentStatus;
  notes?: string;
}

export interface OrderFilters {
  search?: string;
  page?: number;
  page_size?: number;
  status?: OrderStatus | "";
  payment_status?: PaymentStatus | "";
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
  count_by_day: number;
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

export interface OrderCountByDayItem {
  day: string;
  count: number;
}

export interface OrderCountByDayResponse {
  status: string;
  message: string;
  data: {
    days: OrderCountByDayItem[];
    total: number;
  };
}
