import { apiFetch } from "@/lib/api.config";
import type {
  ActivePickupPointsResponse,
  CreatePickupPointPayload,
  PickupPointListResponse,
  SinglePickupPointResponse,
  UpdatePickupPointPayload,
} from "@/types/pickup-point.types";

export async function getPickupPoints(): Promise<PickupPointListResponse> {
  return apiFetch<PickupPointListResponse>("/pickup-points");
}

export async function getActivePickupPoints(): Promise<ActivePickupPointsResponse> {
  return apiFetch<ActivePickupPointsResponse>("/pickup-points/active");
}

export async function createPickupPoint(
  payload: CreatePickupPointPayload,
): Promise<SinglePickupPointResponse> {
  return apiFetch<SinglePickupPointResponse>("/pickup-points", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePickupPoint(
  id: string,
  payload: UpdatePickupPointPayload,
): Promise<SinglePickupPointResponse> {
  return apiFetch<SinglePickupPointResponse>(`/pickup-points/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deletePickupPoint(id: string): Promise<void> {
  return apiFetch<void>(`/pickup-points/${id}`, {
    method: "DELETE",
  });
}
