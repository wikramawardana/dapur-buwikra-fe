import { apiFetch, buildQueryString } from "@/lib/api.config";
import type {
  CreateOrderPayload,
  OrderCountByDayResponse,
  OrderCountResponse,
  OrderCustomersResponse,
  OrderFilters,
  OrderSumResponse,
  OrdersResponse,
  SingleOrderResponse,
  UpdateOrderPayload,
} from "@/types/order.types";

/**
 * Fetch orders with filters and pagination
 */
export async function getOrders(
  filters: OrderFilters = {},
): Promise<OrdersResponse> {
  const queryString = buildQueryString(filters);
  return apiFetch<OrdersResponse>(`/orders${queryString}`);
}

/**
 * Fetch a single order by ID
 */
export async function getOrderById(id: string): Promise<SingleOrderResponse> {
  return apiFetch<SingleOrderResponse>(`/orders/${id}`);
}

/**
 * Fetch distinct previous customers from inserted orders
 */
export async function getOrderCustomers(): Promise<OrderCustomersResponse> {
  return apiFetch<OrderCustomersResponse>("/orders/customers");
}

/**
 * Create a new order
 */
export async function createOrder(
  payload: CreateOrderPayload,
): Promise<SingleOrderResponse> {
  return apiFetch<SingleOrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Update an order
 */
export async function updateOrder(
  id: string,
  payload: UpdateOrderPayload,
): Promise<SingleOrderResponse> {
  return apiFetch<SingleOrderResponse>(`/orders/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/**
 * Delete an order
 */
export async function deleteOrder(id: string): Promise<void> {
  return apiFetch<void>(`/orders/${id}`, {
    method: "DELETE",
  });
}

/**
 * Get total orders count
 */
export async function getOrdersCount(
  filters: OrderFilters = {},
): Promise<OrderCountResponse> {
  const queryString = buildQueryString(filters);
  return apiFetch<OrderCountResponse>(`/orders/count${queryString}`);
}

/**
 * Get total orders sum (revenue)
 */
export async function getOrdersSum(
  filters: OrderFilters = {},
): Promise<OrderSumResponse> {
  const queryString = buildQueryString(filters);
  return apiFetch<OrderSumResponse>(`/orders/sum${queryString}`);
}

/**
 * Get orders count by day
 */
export async function getOrdersCountByDay(
  filters: OrderFilters = {},
): Promise<OrderCountByDayResponse> {
  const queryString = buildQueryString(filters);
  return apiFetch<OrderCountByDayResponse>(
    `/orders/count-by-day${queryString}`,
  );
}

/**
 * Accept a pending order (Admin/Chef only)
 */
export async function acceptOrder(
  id: string,
  notes?: string,
): Promise<SingleOrderResponse> {
  return apiFetch<SingleOrderResponse>(`/orders/${id}/accept`, {
    method: "PATCH",
    body: JSON.stringify({ notes }),
  });
}

/**
 * Reject a pending order (Admin/Chef only)
 */
export async function rejectOrder(
  id: string,
  reason: string,
): Promise<SingleOrderResponse> {
  return apiFetch<SingleOrderResponse>(`/orders/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

/**
 * Start an accepted order (Admin/Chef only)
 */
export async function startOrder(id: string): Promise<SingleOrderResponse> {
  return apiFetch<SingleOrderResponse>(`/orders/${id}/start`, {
    method: "PATCH",
  });
}

/**
 * Complete an order (Admin/Chef only)
 */
export async function completeOrder(
  id: string,
  notes?: string,
): Promise<SingleOrderResponse> {
  return apiFetch<SingleOrderResponse>(`/orders/${id}/complete`, {
    method: "PATCH",
    body: JSON.stringify({ notes }),
  });
}

/**
 * Cancel an order (Admin/Chef only)
 */
export async function cancelOrder(
  id: string,
  reason?: string,
): Promise<SingleOrderResponse> {
  return apiFetch<SingleOrderResponse>(`/orders/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}
