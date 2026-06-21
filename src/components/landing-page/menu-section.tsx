import type React from "react";
import type { LandingContent } from "@/types/landing-content";
import { FeaturedCarousel } from "./featured-carousel";

interface MenuSectionProps {
  content: LandingContent["featured"];
}

export const MenuSection: React.FC<MenuSectionProps> = ({ content }) => {
  return (
    <section className="bg-white border-y-4 border-black py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h2 className="text-5xl font-black mb-4">{content.title}</h2>
            {/* <p className="text-xl font-medium text-gray-600 max-w-lg">
              Dimasak dari jam 2 pagi dengan penuh kasih sayang (dan bumbu
              rahasia).
            </p> */}
          </div>
        </div>

        <FeaturedCarousel
          emptyTitle={content.emptyTitle}
          emptyBody={content.emptyBody}
        />

        {/* TODO: Uncomment this when menu is ready
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MENU_ITEMS.map((item) => (
            <NeoCard
              key={item.id}
              hoverEffect
              className="flex flex-col h-full !p-0"
            >
              <div className="relative h-48 border-b-4 border-black">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                {item.isBestSeller && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-black font-bold px-3 py-1 border-2 border-black flex items-center gap-1 shadow-neo-hover">
                    <Star size={16} className="fill-black" /> FAVORIT
                  </div>
                )}
                {item.isSpicy && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white font-bold px-3 py-1 border-2 border-black flex items-center gap-1 shadow-neo-hover">
                    <Flame size={16} className="fill-white" /> PEDAS
                  </div>
                )}
              </div>

              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-2xl font-bold leading-none">
                    {item.name}
                  </h3>
                </div>
                <p className="text-gray-600 font-medium mb-6 flex-grow border-l-2 border-gray-300 pl-3">
                  {item.description}
                </p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t-4 border-black border-dashed">
                  <span className="text-2xl font-black">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(item.price)}
                  </span>
                  <button className="bg-black text-white p-3 hover:bg-brut-blue transition-colors border-2 border-transparent hover:border-black">
                    <ShoppingBag size={20} />
                  </button>
                </div>
              </div>
            </NeoCard>
          ))}
        </div>
        */}
      </div>
    </section>
  );
};
