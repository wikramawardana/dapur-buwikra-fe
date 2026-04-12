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
  image_urls: string[];
  is_active: boolean;
  is_featured: boolean;
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
  is_featured: boolean;
}

export interface UpdateMenuPayload {
  title?: string;
  description?: string;
  items?: MenuItem[];
  is_active?: boolean;
  is_featured?: boolean;
}

export interface MenusPaginatedData {
  data: Menu[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

export interface MenusResponse {
  status: string;
  message: string;
  data: MenusPaginatedData;
}

export interface SingleMenuResponse {
  status: string;
  message: string;
  data: Menu;
}
