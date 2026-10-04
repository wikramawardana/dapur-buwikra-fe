export type FlyerTemplateStyle = "bento_yellow" | "makan_apa_orange";

export interface MenuDishes {
  main: string;
  carbs: string;
  side: string;
  condiment: string;
  additional?: string[];
}

export interface ParsedMenuData {
  title: string;
  date: string; // YYYY-MM-DD
  price?: number;
  price_label?: string; // e.g. "25K" or "Rp 25.000"
  content_type: "portfolio" | "weekly_menu";
  dishes: MenuDishes;
  description: string;
  tagline: string;
}

export interface GenerateMenuRequest {
  text?: string;
  parsed_data?: ParsedMenuData;
  style?: FlyerTemplateStyle;
  image_url?: string;
  auto_publish?: boolean;
}

export interface GenerateMenuResponse {
  success: boolean;
  parsed_data: ParsedMenuData;
  preview_image?: string; // Base64 Data URL or public image URL
  menu_id?: string;
  published_image_url?: string;
  error?: string;
}
