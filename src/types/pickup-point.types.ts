export interface PickupPoint {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePickupPointPayload {
  name: string;
  is_active?: boolean;
}

export interface UpdatePickupPointPayload {
  name?: string;
  is_active?: boolean;
}

export interface PickupPointPaginatedData {
  data: PickupPoint[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

export interface PickupPointListResponse {
  status: string;
  message: string;
  data: PickupPointPaginatedData;
}

export interface ActivePickupPointsResponse {
  status: string;
  message: string;
  data: PickupPoint[];
}

export interface SinglePickupPointResponse {
  status: string;
  message: string;
  data: PickupPoint;
}
