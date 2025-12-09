export interface MenuItem {
    name: string;
    description?: string;
    price: number;
}

export interface Menu {
    id: string;
    start_date: string;
    end_date: string;
    title: string;
    description?: string;
    items: MenuItem[];
    images: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateMenuPayload {
    start_date: string;
    end_date: string;
    title: string;
    description?: string;
    items: MenuItem[];
    is_active: boolean;
}

export interface UpdateMenuPayload {
    title?: string;
    description?: string;
    items?: MenuItem[];
    is_active?: boolean;
}

export interface MenusResponse {
    status: string;
    message: string;
    data: Menu[];
}

export interface SingleMenuResponse {
    status: string;
    message: string;
    data: Menu;
}
