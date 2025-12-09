import { apiFetch, buildQueryString } from "@/lib/api.config";
import type {
    CreatePriceListPayload,
    PriceListResponse,
    SinglePriceListResponse,
    UpdatePriceListPayload,
} from "@/types/pricelist.types";

/**
 * Fetch all price list items
 */
export async function getPriceList(): Promise<PriceListResponse> {
    return apiFetch<PriceListResponse>("/price-list");
}

/**
 * Fetch active price list items only
 */
export async function getActivePriceList(): Promise<PriceListResponse> {
    return apiFetch<PriceListResponse>("/price-list/active");
}

/**
 * Fetch a single price list item by ID
 */
export async function getPriceListById(
    id: string
): Promise<SinglePriceListResponse> {
    return apiFetch<SinglePriceListResponse>(`/price-list/${id}`);
}

/**
 * Create a new price list item
 */
export async function createPriceListItem(
    payload: CreatePriceListPayload
): Promise<SinglePriceListResponse> {
    return apiFetch<SinglePriceListResponse>("/price-list", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

/**
 * Update a price list item
 */
export async function updatePriceListItem(
    id: string,
    payload: UpdatePriceListPayload
): Promise<SinglePriceListResponse> {
    return apiFetch<SinglePriceListResponse>(`/price-list/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

/**
 * Delete a price list item
 */
export async function deletePriceListItem(id: string): Promise<void> {
    return apiFetch<void>(`/price-list/${id}`, {
        method: "DELETE",
    });
}
