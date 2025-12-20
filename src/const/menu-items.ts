import type { MenuItem } from "@/types/landing-page";

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 1,
    name: "Ayam Bakar Madu",
    description:
      "Ayam bakar dengan olesan madu hutan asli, manis gurih meresap sampai tulang.",
    price: 25000,
    image: "https://picsum.photos/400/300?random=1",
    isBestSeller: true,
  },
  {
    id: 2,
    name: "Sambal Goreng Ati",
    description:
      "Ati ampela dimasak pedas nendang dengan pete pilihan (bisa request tanpa pete).",
    price: 18000,
    image: "https://picsum.photos/400/300?random=2",
    isSpicy: true,
  },
  {
    id: 3,
    name: "Tumis Kangkung Belacan",
    description:
      "Sayur segar dadakan, ditumis pakai terasi udang rebon. Harumnya bikin laper.",
    price: 12000,
    image: "https://picsum.photos/400/300?random=3",
  },
  {
    id: 4,
    name: "Telur Balado Padang",
    description:
      "Telur rebus digoreng sebentar lalu disiram sambal balado merah merona.",
    price: 10000,
    image: "https://picsum.photos/400/300?random=4",
    isSpicy: true,
  },
];
