import { API_BASE_URL, apiFetch, buildQueryString } from "@/lib/api.config";
import type {
  CreateMenuPayload,
  Menu,
  MenusResponse,
  SingleMenuResponse,
  UpdateMenuPayload,
} from "@/types/menu.types";

export interface GetMenusParams {
  page?: number;
  page_size?: number;
}

/**
 * Fetch all menus with pagination
 */
export async function getMenus(
  params?: GetMenusParams,
): Promise<MenusResponse> {
  const query = buildQueryString(params || {});
  return apiFetch<MenusResponse>(`/menus${query}`);
}

/**
 * Fetch a menu by ID
 */
export async function getMenuById(id: string): Promise<SingleMenuResponse> {
  return apiFetch<SingleMenuResponse>(`/menus/${id}`);
}

/**
 * Fetch menus by date
 */
export async function getMenuByDate(date: string): Promise<SingleMenuResponse> {
  return apiFetch<SingleMenuResponse>(`/menus/by-date/${date}`);
}

/**
 * Create a new menu
 */
export async function createMenu(
  payload: CreateMenuPayload,
): Promise<SingleMenuResponse> {
  return apiFetch<SingleMenuResponse>("/menus", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Update a menu
 */
export async function updateMenu(
  id: string,
  payload: UpdateMenuPayload,
): Promise<SingleMenuResponse> {
  return apiFetch<SingleMenuResponse>(`/menus/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/**
 * Upload an image to a menu
 */
export async function uploadMenuImage(
  id: string,
  file: File,
): Promise<SingleMenuResponse> {
  const formData = new FormData();
  formData.append("image", file);

  return apiFetch<SingleMenuResponse>(`/menus/${id}/images`, {
    method: "POST",
    body: formData,
    skipContentType: true, // Let browser set Content-Type with boundary for FormData
  });
}

/**
 * Delete a menu image
 */
export async function deleteMenuImage(
  id: string,
  imageUrl: string,
): Promise<void> {
  return apiFetch<void>(
    `/menus/${id}/images?image_url=${encodeURIComponent(imageUrl)}`,
    {
      method: "DELETE",
    },
  );
}

/**
 * Delete all menu images
 */
export async function deleteAllMenuImages(id: string): Promise<void> {
  return apiFetch<void>(`/menus/${id}/images/all`, {
    method: "DELETE",
  });
}

/**
 * Delete a menu
 */
export async function deleteMenu(id: string): Promise<void> {
  return apiFetch<void>(`/menus/${id}`, {
    method: "DELETE",
  });
}

/**
 * Fetch featured menus (public, no auth required)
 */
export async function getFeaturedMenus(): Promise<Menu[]> {
  const res = await fetch(`${API_BASE_URL}/public/menus/featured`);
  if (!res.ok) return [];
  const json = await res.json();
  return json?.data ?? [];
}

/** Fetch all published public content, including non-homepage portfolio work. */
export async function getPublishedMenus(): Promise<Menu[]> {
  const res = await fetch(`${API_BASE_URL}/public/menus`);
  if (!res.ok) return [];
  const json = await res.json();
  return json?.data ?? [];
}
