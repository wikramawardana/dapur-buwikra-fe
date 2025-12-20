export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  isSpicy?: boolean;
  isBestSeller?: boolean;
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  comment: string;
}
