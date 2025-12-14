export type PriceListCategory = "main" | "addon";

export interface PriceListItem {
  id: string;
  name: string;
  price: number;
  category: PriceListCategory;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePriceListPayload {
  name: string;
  price: number;
  category: PriceListCategory;
}

export interface UpdatePriceListPayload {
  name?: string;
  price?: number;
  category?: PriceListCategory;
  is_active?: boolean;
}

export interface PriceListPaginatedData {
  data: PriceListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

export interface PriceListResponse {
  status: string;
  message: string;
  data: PriceListPaginatedData;
}

export interface SinglePriceListResponse {
  status: string;
  message: string;
  data: PriceListItem;
}
