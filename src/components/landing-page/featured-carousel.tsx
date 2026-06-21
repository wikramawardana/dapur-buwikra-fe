"use client";

import { X } from "lucide-react";
import * as React from "react";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getUploadUrl } from "@/lib/api.config";
import { getFeaturedMenus } from "@/services/menu.service";
import type { Menu } from "@/types/menu.types";

interface FeaturedCarouselProps {
  emptyTitle: string;
  emptyBody: string;
}

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({
  emptyTitle,
  emptyBody,
}) => {
  const [menus, setMenus] = React.useState<Menu[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [api, setApi] = React.useState<CarouselApi>();
  const [selected, setSelected] = React.useState<Menu | null>(null);

  React.useEffect(() => {
    getFeaturedMenus()
      .then(setMenus)
      .catch(() => setMenus([]))
      .finally(() => setIsLoading(false));
  }, []);

  // Auto-advance every 4 seconds
  React.useEffect(() => {
    if (!api || menus.length <= 1) return;
    const t = setInterval(() => api.scrollNext(), 4000);
    return () => clearInterval(t);
  }, [api, menus.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-72 border-4 border-dashed border-black bg-gray-50">
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
        <h3 className="text-3xl font-black mb-2 text-center">{emptyTitle}</h3>
        <p className="text-lg font-medium text-gray-600 text-center max-w-md">
          {emptyBody}
        </p>
      </div>
    );
  }

  const selectedImageUrl = selected?.image_urls?.[0]
    ? getUploadUrl(selected.image_urls[0])
    : null;

  return (
    <>
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: "start" }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {menus.map((menu) => {
            const imageUrl = menu.image_urls?.[0]
              ? getUploadUrl(menu.image_urls[0])
              : null;

            return (
              <CarouselItem
                key={menu.id}
                className="pl-4 basis-1/2 md:basis-1/3"
              >
                <button
                  type="button"
                  className="w-full text-left border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-zoom-in"
                  onClick={() => setSelected(menu)}
                >
                  {/* Portrait image */}
                  <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={menu.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-5xl">🍱</span>
                      </div>
                    )}
                  </div>

                  {/* Caption */}
                  <div className="bg-white px-3 py-2.5 border-t-4 border-black">
                    <p className="font-black text-sm leading-tight line-clamp-1">
                      {menu.title}
                    </p>
                    {menu.items.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {menu.items
                          .slice(0, 3)
                          .map((i) => i.name)
                          .join(" · ")}
                        {menu.items.length > 3
                          ? ` · +${menu.items.length - 3}`
                          : ""}
                      </p>
                    )}
                  </div>
                </button>
              </CarouselItem>
            );
          })}
        </CarouselContent>

        <CarouselPrevious className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -left-4" />
        <CarouselNext className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -right-4" />
      </Carousel>

      {/* Zoom dialog */}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="border-4 border-black shadow-neo bg-white max-w-xl p-0 overflow-hidden [&>button]:hidden">
          {/* Close button */}
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="absolute top-2 right-2 z-10 bg-white border-2 border-black p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          {selectedImageUrl ? (
            <img
              src={selectedImageUrl}
              alt={selected?.title ?? "Menu"}
              className="w-full object-contain max-h-[80vh]"
            />
          ) : (
            <div className="w-full h-64 flex items-center justify-center bg-gray-100">
              <span className="text-6xl">🍱</span>
            </div>
          )}

          {selected && (
            <div className="bg-black text-white px-4 py-3">
              <p className="font-black text-base leading-tight">
                {selected.title}
              </p>
              {selected.items.length > 0 && (
                <p className="text-sm text-white/70 mt-1">
                  {selected.items.map((i) => i.name).join(" · ")}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
