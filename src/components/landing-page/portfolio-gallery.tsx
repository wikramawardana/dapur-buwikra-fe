"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getUploadUrl } from "@/lib/api.config";
import { formatPortfolioDate, getPortfolioSortTime } from "@/lib/menu-utils";
import { getPublishedMenus } from "@/services/menu.service";
import type { Menu } from "@/types/menu.types";

export function PortfolioGallery() {
  const [menus, setMenus] = React.useState<Menu[]>([]);
  const [selected, setSelected] = React.useState<Menu | null>(null);
  const [imageIndex, setImageIndex] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [sortOrder, setSortOrder] = React.useState<"newest" | "oldest">(
    "newest",
  );

  React.useEffect(() => {
    getPublishedMenus()
      .then((records) =>
        setMenus(records.filter((menu) => menu.content_type === "portfolio")),
      )
      .catch(() => setMenus([]))
      .finally(() => setIsLoading(false));
  }, []);

  const open = (menu: Menu) => {
    setSelected(menu);
    setImageIndex(0);
  };

  const images = selected?.image_urls ?? [];
  const selectedImage = images[imageIndex]
    ? getUploadUrl(images[imageIndex])
    : null;
  const sortedMenus = React.useMemo(
    () =>
      [...menus].sort((a, b) => {
        const aTime = getPortfolioSortTime(a.portfolio_date);
        const bTime = getPortfolioSortTime(b.portfolio_date);
        if (aTime === null) return 1;
        if (bTime === null) return -1;
        const difference = bTime - aTime;
        return sortOrder === "newest" ? difference : -difference;
      }),
    [menus, sortOrder],
  );

  if (isLoading) {
    return (
      <div className="h-80 animate-pulse border-4 border-black bg-white" />
    );
  }

  if (menus.length === 0) {
    return (
      <div className="border-4 border-dashed border-black bg-white px-6 py-16 text-center">
        <p className="text-2xl font-black">Portfolio segera hadir.</p>
        <p className="mt-2 font-medium text-gray-500">
          Koleksi masakan sedang dipersiapkan.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-end gap-2">
        <span className="mr-1 text-xs font-black uppercase tracking-wide text-gray-500">
          Urutkan:
        </span>
        <button
          type="button"
          onClick={() => setSortOrder("newest")}
          className={`border-2 border-black px-3 py-2 text-sm font-bold ${sortOrder === "newest" ? "bg-black text-white" : "bg-white"}`}
        >
          Terbaru
        </button>
        <button
          type="button"
          onClick={() => setSortOrder("oldest")}
          className={`border-2 border-black px-3 py-2 text-sm font-bold ${sortOrder === "oldest" ? "bg-black text-white" : "bg-white"}`}
        >
          Terlama
        </button>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sortedMenus.map((menu) => {
          const cover = menu.image_urls?.[0]
            ? getUploadUrl(menu.image_urls[0])
            : null;
          return (
            <button
              key={menu.id}
              type="button"
              onClick={() => open(menu)}
              className="overflow-hidden border-4 border-black bg-white text-left shadow-[5px_5px_0_0_#000] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_0_#000]"
            >
              {cover ? (
                <img
                  src={cover}
                  alt={menu.title}
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-gray-100 text-6xl">
                  🍱
                </div>
              )}
              <div className="border-t-4 border-black p-4">
                <p className="text-xs font-black uppercase tracking-wide text-brut-blue">
                  {formatPortfolioDate(menu.portfolio_date)}
                </p>
                <h2 className="mt-2 line-clamp-3 text-lg font-black text-gray-700">
                  {menu.description || "Portofolio masakan Dapur Bu Wikra"}
                </h2>
                {menu.image_urls.length > 1 && (
                  <p className="mt-3 text-xs font-bold uppercase tracking-wide text-brut-blue">
                    {menu.image_urls.length} photos
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(isOpen) => !isOpen && setSelected(null)}
      >
        <DialogContent className="max-w-3xl overflow-hidden border-4 border-black bg-white p-0 shadow-neo [&>button]:hidden">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="absolute right-3 top-3 z-20 border-2 border-black bg-white p-2 shadow-[2px_2px_0_0_#000]"
            aria-label="Close portfolio preview"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="relative bg-gray-100">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={selected?.title ?? "Portfolio"}
                className="max-h-[70vh] w-full object-contain"
              />
            ) : (
              <div className="flex h-72 items-center justify-center text-6xl">
                🍱
              </div>
            )}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setImageIndex((index) =>
                      index === 0 ? images.length - 1 : index - 1,
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 border-2 border-black bg-white p-2"
                  aria-label="Previous photo"
                >
                  <ChevronLeft />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setImageIndex((index) => (index + 1) % images.length)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 border-2 border-black bg-white p-2"
                  aria-label="Next photo"
                >
                  <ChevronRight />
                </button>
              </>
            )}
          </div>
          {selected && (
            <div className="border-t-4 border-black bg-black px-5 py-4 text-white">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-300">
                {formatPortfolioDate(selected.portfolio_date)}
              </p>
              <p className="mt-2 whitespace-pre-line text-lg font-bold">
                {selected.description || "Portofolio masakan Dapur Bu Wikra"}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
