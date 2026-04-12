"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { getUploadUrl } from "@/lib/api.config";
import { getFeaturedMenus } from "@/services/menu.service";
import type { Menu } from "@/types/menu.types";

export const FeaturedCarousel: React.FC = () => {
  const [menus, setMenus] = React.useState<Menu[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    getFeaturedMenus()
      .then(setMenus)
      .catch(() => setMenus([]))
      .finally(() => setIsLoading(false));
  }, []);

  const prev = () => setCurrent((c) => (c - 1 + menus.length) % menus.length);
  const next = React.useCallback(
    () => setCurrent((c) => (c + 1) % menus.length),
    [menus.length],
  );

  // Auto-advance every 4 seconds
  React.useEffect(() => {
    if (menus.length <= 1) return;
    const t = setInterval(next, 4000);
    return () => clearInterval(t);
  }, [menus.length, next]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-56 border-4 border-dashed border-black bg-gray-50">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-3 w-3 bg-black rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (menus.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 border-4 border-dashed border-black bg-gray-50">
        <h3 className="text-3xl font-black mb-2 text-center">SEGERA HADIR!</h3>
        <p className="text-lg font-medium text-gray-600 text-center max-w-md">
          Menu lengkap lagi diracik. Sabar ya, dijamin worth the wait!
        </p>
      </div>
    );
  }

  const menu = menus[current];
  const imageUrl = menu.image_urls?.[0]
    ? getUploadUrl(menu.image_urls[0])
    : null;

  return (
    <div className="relative border-4 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      {/* Image area */}
      <div className="relative bg-gray-100 aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden">
        {imageUrl ? (
          <img
            key={menu.id}
            src={imageUrl}
            alt={menu.title}
            className="w-full h-full object-cover transition-opacity duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-6xl">🍱</span>
          </div>
        )}

        {/* Overlay caption */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white px-5 py-3">
          <p className="font-black text-lg md:text-xl leading-tight">
            {menu.title}
          </p>
          {menu.description && (
            <p className="text-sm text-white/80 mt-0.5 line-clamp-1">
              {menu.description}
            </p>
          )}
          {menu.items.length > 0 && (
            <p className="text-xs text-white/60 mt-1">
              {menu.items
                .slice(0, 4)
                .map((i) => i.name)
                .join(" · ")}
              {menu.items.length > 4 ? ` · +${menu.items.length - 4} more` : ""}
            </p>
          )}
        </div>
      </div>

      {/* Prev / Next buttons — only show if >1 menu */}
      {menus.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white border-2 border-black p-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[calc(-50%+2px)] transition-all"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white border-2 border-black p-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:translate-y-[calc(-50%)] transition-all"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dot indicators */}
          <div className="flex justify-center gap-2 py-3 bg-white border-t-2 border-black">
            {menus.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                className={`h-3 w-3 border-2 border-black transition-all ${
                  i === current ? "bg-black w-6" : "bg-white"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
