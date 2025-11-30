import { apiFetch, buildQueryString } from "@/lib/api.config";
import type {
  CreateOrderPayload,
  OrderCountResponse,
  OrderFilters,
  OrderSumResponse,
  OrdersResponse,
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
 * Create a new order
 */
export async function createOrder(
  payload: CreateOrderPayload,
): Promise<OrdersResponse> {
  return apiFetch<OrdersResponse>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Update an order
 */
export async function updateOrder(
  id: string,
  payload: Partial<CreateOrderPayload>,
): Promise<OrdersResponse> {
  return apiFetch<OrdersResponse>(`/orders/${id}`, {
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
