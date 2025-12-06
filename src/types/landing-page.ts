export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: string;
  image: string;
  category: "paket" | "ala-carte";
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  text: string;
  avatar: string;
}

export interface AIPreference {
  budget: string;
  spiceLevel: "tidak-pedas" | "sedang" | "pedas";
  protein: "ayam" | "daging" | "ikan" | "campur";
  dietary?: string;
}

export interface AIMenuSuggestion {
  day: string;
  menuName: string;
  description: string;
  estimatedPrice: number;
  calories: number;
}
