import { apiFetch } from "@/lib/api.config";
import type {
  CreateMenuPayload,
  MenusResponse,
  SingleMenuResponse,
  UpdateMenuPayload,
} from "@/types/menu.types";

/**
 * Fetch all menus
 */
export async function getMenus(): Promise<MenusResponse> {
  return apiFetch<MenusResponse>("/menus");
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
    headers: {
      // Remove Content-Type to let browser set it with boundary for FormData
    },
    body: formData,
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
