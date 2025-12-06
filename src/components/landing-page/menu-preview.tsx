import type React from "react";
import type { MenuItem } from "@/types/landing-page";

export const MenuPreview: React.FC = () => {
  const menus: MenuItem[] = [
    {
      id: 1,
      name: "Nasi Liwet Komplit",
      description:
        "Nasi liwet teri, ayam goreng lengkuas, tahu tempe bacem, lalapan, sambal terasi.",
      price: "25.000",
      image: "https://picsum.photos/400/300?random=1",
      category: "paket",
    },
    {
      id: 2,
      name: "Dendeng Balado",
      description:
        "Dendeng sapi kering renyah disiram sambal balado merah pedas.",
      price: "35.000",
      image: "https://picsum.photos/400/300?random=2",
      category: "ala-carte",
    },
    {
      id: 3,
      name: "Ayam Bakar Taliwang",
      description: "Ayam kampung muda bakar dengan bumbu pedas khas Lombok.",
      price: "30.000",
      image: "https://picsum.photos/400/300?random=3",
      category: "ala-carte",
    },
    {
      id: 4,
      name: "Sayur Asem & Empal",
      description:
        "Sayur asem jakarta segar, empal daging gepuk, ikan asin, sambal.",
      price: "28.000",
      image: "https://picsum.photos/400/300?random=4",
      category: "paket",
    },
  ];

  return (
    <section
      id="menu"
      className="py-24 bg-blue-100 border-b-4 border-black relative"
    >
      <div
        className="absolute inset-0 z-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)",
          backgroundSize: "40px 40px",
          backgroundPosition: "0 0, 20px 20px",
        }}
      ></div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b-4 border-black pb-8">
          <div>
            <h2 className="text-4xl md:text-6xl font-black text-black uppercase mb-4">
              Menu Andalan
            </h2>
            <p className="text-xl font-bold text-black">
              Minggu ini di Dapur Bu Wikra.
            </p>
          </div>
          <button
            type="button"
            className="hidden md:block px-6 py-2 bg-black text-white font-bold border-2 border-transparent hover:bg-blue-600 hover:border-black transition-colors"
          >
            LIHAT MENU LENGKAP &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {menus.map((item) => (
            <div
              key={item.id}
              className="bg-white border-4 border-black flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <div className="relative h-48 border-b-4 border-black overflow-hidden group">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                />
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 font-bold border-l-4 border-b-4 border-black text-xs uppercase">
                  {item.category}
                </div>
              </div>

              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-black text-black mb-2 uppercase leading-tight">
                  {item.name}
                </h3>
                <p className="text-black font-medium text-sm mb-6 line-clamp-2 flex-grow">
                  {item.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t-2 border-black border-dashed">
                  <span className="text-xl font-black text-blue-700">
                    Rp {item.price}
                  </span>
                  <button
                    type="button"
                    className="w-10 h-10 bg-black text-white flex items-center justify-center hover:bg-blue-600 border-2 border-black transition-colors font-bold text-xl"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center md:hidden">
          <button
            type="button"
            className="w-full px-6 py-4 bg-black text-white font-bold border-2 border-black hover:bg-blue-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            LIHAT SEMUA MENU &rarr;
          </button>
        </div>
      </div>
    </section>
  );
};
