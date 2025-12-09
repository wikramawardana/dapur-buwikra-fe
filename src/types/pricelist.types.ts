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

export interface PriceListResponse {
    status: string;
    message: string;
    data: PriceListItem[];
}

export interface SinglePriceListResponse {
    status: string;
    message: string;
    data: PriceListItem;
}
