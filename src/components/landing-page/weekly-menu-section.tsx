"use client";

import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import * as React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { getUploadUrl } from "@/lib/api.config";
import { getFeaturedMenus } from "@/services/menu.service";
import type { LandingContent } from "@/types/landing-content";
import type { Menu } from "@/types/menu.types";

interface WeeklyMenuSectionProps {
  content: LandingContent["hero"];
}

function formatDateRange(dateFrom: string, dateTo: string): string {
  const from = new Date(`${dateFrom}T00:00:00`);
  const to = new Date(`${dateTo}T00:00:00`);
  return `${from.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  })} – ${to.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

export function WeeklyMenuSection({ content }: WeeklyMenuSectionProps) {
  const [menus, setMenus] = React.useState<Menu[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedMenu, setSelectedMenu] = React.useState<Menu | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);

  React.useEffect(() => {
    getFeaturedMenus()
      .then((records) =>
        setMenus(
          records
            .filter(
              (menu) =>
                (menu.content_type || "weekly_menu") === "weekly_menu" &&
                Boolean(menu.start_date && menu.end_date),
            )
            .sort((a, b) =>
              (b.start_date ?? "").localeCompare(a.start_date ?? ""),
            ),
        ),
      )
      .catch(() => setMenus([]))
      .finally(() => setIsLoading(false));
  }, []);

  const openPreview = (menu: Menu) => {
    setSelectedMenu(menu);
    setSelectedImageIndex(0);
  };

  const previewImages = selectedMenu?.image_urls ?? [];
  const previewImage = previewImages[selectedImageIndex]
    ? getUploadUrl(previewImages[selectedImageIndex])
    : null;
  const newestMenuId = React.useMemo(
    () =>
      menus.reduce<Menu | null>((newest, menu) => {
        if (!newest) return menu;
        return new Date(menu.created_at).getTime() >
          new Date(newest.created_at).getTime()
          ? menu
          : newest;
      }, null)?.id,
    [menus],
  );

  return (
    <section
      id="weekly-menu-section"
      className="scroll-mt-20 border-y-4 border-black bg-blue-100 py-16"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <div>
            <p className="mb-2 text-sm font-black uppercase tracking-widest text-brut-blue">
              Published weekly menus
            </p>
            <h2 className="text-4xl font-black sm:text-5xl">
              {content.weeklyMenuTitle}
            </h2>
          </div>
        </div>

        {isLoading ? (
          <div className="h-72 animate-pulse border-4 border-black bg-white/60" />
        ) : menus.length === 0 ? (
          <div className="border-4 border-dashed border-black bg-white px-6 py-14 text-center">
            <p className="text-xl font-black">{content.weeklyMenuEmpty}</p>
          </div>
        ) : (
          <Carousel
            opts={{ align: "start", loop: menus.length > 2 }}
            className="mx-8 sm:mx-10"
          >
            <CarouselContent className="-ml-5 py-2">
              {menus.map((menu) => {
                const imageUrl = menu.image_urls?.[0]
                  ? getUploadUrl(menu.image_urls[0])
                  : null;
                return (
                  <CarouselItem
                    key={menu.id}
                    className="basis-full pl-5 md:basis-1/2"
                  >
                    <article className="flex h-full flex-col overflow-hidden border-4 border-black bg-white shadow-[6px_6px_0_0_#000]">
                      <button
                        type="button"
                        onClick={() => openPreview(menu)}
                        className="group relative flex h-64 w-full items-center justify-center bg-gray-100 sm:h-80"
                        aria-label={`Preview ${menu.title}`}
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={menu.title}
                            className="h-full w-full object-contain p-2"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-6xl">
                            🍱
                          </div>
                        )}
                        <span className="absolute bottom-3 right-3 flex items-center gap-2 border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase shadow-[3px_3px_0_0_#000] transition-transform group-hover:-translate-y-0.5">
                          <Eye className="h-4 w-4" /> Preview
                        </span>
                        {menu.id === newestMenuId && (
                          <span className="absolute left-3 top-3 border-2 border-black bg-yellow-400 px-3 py-1.5 text-xs font-black uppercase shadow-[3px_3px_0_0_#000]">
                            🔥 New!
                          </span>
                        )}
                      </button>
                      <div className="flex-1 border-t-4 border-black p-5">
                        {menu.start_date && menu.end_date && (
                          <p className="mb-2 text-xs font-black uppercase tracking-wide text-brut-blue">
                            {formatDateRange(menu.start_date, menu.end_date)}
                          </p>
                        )}
                        <p className="line-clamp-4 whitespace-pre-line text-lg font-bold text-gray-700">
                          {menu.description || "Menu mingguan Dapur Bu Wikra"}
                        </p>
                      </div>
                    </article>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            {menus.length > 1 && (
              <>
                <CarouselPrevious className="-left-9 h-10 w-10 rounded-none border-2 border-black bg-white shadow-[3px_3px_0_0_#000] sm:-left-11" />
                <CarouselNext className="-right-9 h-10 w-10 rounded-none border-2 border-black bg-white shadow-[3px_3px_0_0_#000] sm:-right-11" />
              </>
            )}
          </Carousel>
        )}
      </div>

      <Dialog
        open={Boolean(selectedMenu)}
        onOpenChange={(open) => !open && setSelectedMenu(null)}
      >
        <DialogContent className="max-h-[96vh] overflow-y-auto rounded-none border-4 border-black bg-white p-0 shadow-neo sm:max-w-5xl">
          <DialogTitle className="sr-only">
            {selectedMenu?.title ?? "Weekly menu preview"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Full-size weekly menu image preview
          </DialogDescription>
          <div className="relative flex min-h-72 items-center justify-center bg-gray-100">
            {previewImage ? (
              <img
                src={previewImage}
                alt={selectedMenu?.title ?? "Weekly menu"}
                className="h-auto max-h-[84vh] w-auto max-w-full object-contain"
              />
            ) : (
              <span className="text-7xl">🍱</span>
            )}
            {previewImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImageIndex((index) =>
                      index === 0 ? previewImages.length - 1 : index - 1,
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 border-2 border-black bg-white p-2 shadow-[3px_3px_0_0_#000]"
                  aria-label="Previous image"
                >
                  <ChevronLeft />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImageIndex(
                      (index) => (index + 1) % previewImages.length,
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 border-2 border-black bg-white p-2 shadow-[3px_3px_0_0_#000]"
                  aria-label="Next image"
                >
                  <ChevronRight />
                </button>
              </>
            )}
          </div>
          {selectedMenu && (
            <div className="border-t-4 border-black bg-black p-5 text-white">
              {selectedMenu.start_date && selectedMenu.end_date && (
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-blue-300">
                  {formatDateRange(
                    selectedMenu.start_date,
                    selectedMenu.end_date,
                  )}
                </p>
              )}
              <p className="whitespace-pre-line text-lg font-bold text-white">
                {selectedMenu.description || "Menu mingguan Dapur Bu Wikra"}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
