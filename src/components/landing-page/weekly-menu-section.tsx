"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Sparkles,
  Utensils,
} from "lucide-react";
import Link from "next/link";
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
      className="scroll-mt-20 border-b-4 border-black bg-[#fff4e6] py-16 sm:py-24"
    >
      <div className="container mx-auto max-w-6xl px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 bg-yellow-300 border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Sparkles className="h-4 w-4" />
            Pilihan Menu Terbit
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight leading-tight">
            {content.weeklyMenuTitle || "Menu Katering Mingguan"}
          </h2>
          <p className="text-base sm:text-lg font-medium text-black/70 max-w-2xl mx-auto">
            Jadwal menu berganti setiap minggu. Dimasak segar setiap subuh, 100%
            bebas micin, dan siap diantar hangat ke kantor Anda.
          </p>
        </div>

        {/* Informative Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10 text-xs sm:text-sm font-bold max-w-4xl mx-auto">
          <div className="border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 text-center">
            <CalendarDays className="h-4 w-4 text-black" />
            <span>{content.weeklyMenuFeature1}</span>
          </div>
          <div className="border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 text-center">
            <Sparkles className="h-4 w-4 text-black" />
            <span>{content.weeklyMenuFeature2}</span>
          </div>
          <div className="border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 text-center">
            <Clock className="h-4 w-4 text-black" />
            <span>{content.weeklyMenuFeature3}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="h-80 animate-pulse border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" />
        ) : menus.length === 0 ? (
          <div className="border-4 border-dashed border-black bg-white px-6 py-14 text-center max-w-2xl mx-auto shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xl font-black">{content.weeklyMenuEmpty}</p>
          </div>
        ) : (
          <Carousel
            opts={{ align: "start", loop: menus.length > 2 }}
            className="mx-4 sm:mx-10"
          >
            <CarouselContent className="-ml-5 py-2">
              {menus.map((menu) => {
                const imageUrl = menu.image_urls?.[0]
                  ? getUploadUrl(menu.image_urls[0])
                  : null;
                const orderLink = menu.start_date
                  ? `/order/${menu.start_date}`
                  : "/order";
                const isNewest = menu.id === newestMenuId;

                return (
                  <CarouselItem
                    key={menu.id}
                    className="basis-full pl-5 md:basis-1/2"
                  >
                    <article className="flex h-full flex-col overflow-hidden border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
                      {/* Card Header Tag */}
                      <div className="bg-yellow-300 border-b-4 border-black px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="bg-black text-white px-2 py-0.5 text-xs font-black uppercase tracking-wider">
                            {isNewest ? "Menu Aktif" : "Arsip Menu"}
                          </span>
                          {menu.start_date && menu.end_date && (
                            <span className="text-xs font-black text-black">
                              {formatDateRange(menu.start_date, menu.end_date)}
                            </span>
                          )}
                        </div>
                        {isNewest && (
                          <span className="text-xs font-black bg-red-500 text-white px-2 py-0.5 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] animate-pulse">
                            🔥 NEW
                          </span>
                        )}
                      </div>

                      {/* Image Preview Container */}
                      <button
                        type="button"
                        onClick={() => openPreview(menu)}
                        className="group relative flex h-64 sm:h-72 w-full items-center justify-center bg-gray-50 border-b-4 border-black cursor-pointer overflow-hidden"
                        aria-label={`Preview brosur ${menu.title}`}
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={menu.title}
                            className="h-full w-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-6xl">
                            🍱
                          </div>
                        )}
                        <span className="absolute bottom-3 right-3 flex items-center gap-1.5 border-2 border-black bg-white px-3 py-1.5 text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] opacity-90 group-hover:opacity-100 transition-opacity">
                          <Eye className="h-3.5 w-3.5" /> Buka Brosur
                        </span>
                      </button>

                      {/* Card Content & Action Bar */}
                      <div className="flex-1 flex flex-col justify-between p-5 space-y-4">
                        <div>
                          <h3 className="text-xl font-black text-black mb-2 line-clamp-1">
                            {menu.title}
                          </h3>
                          <p className="line-clamp-3 whitespace-pre-line text-sm sm:text-base font-medium text-black/70 leading-relaxed bg-[#faf9f5] border-2 border-black/10 p-3">
                            {menu.description ||
                              "Menu mingguan lezat rumahan Dapur Bu Wikra, dimasak fresh tanpa bahan pengawet."}
                          </p>
                        </div>

                        <div className="pt-3 border-t-2 border-black/10 flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => openPreview(menu)}
                            className="text-xs font-black uppercase underline hover:text-brut-blue cursor-pointer"
                          >
                            Lihat Foto
                          </button>
                          <Link
                            href={orderLink}
                            className="inline-flex items-center gap-2 border-2 border-black bg-yellow-300 px-4 py-2.5 text-xs sm:text-sm font-black uppercase text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-400 hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                          >
                            <Utensils className="h-4 w-4" />
                            <span>Pesan Menu Ini</span>
                          </Link>
                        </div>
                      </div>
                    </article>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            {menus.length > 1 && (
              <>
                <CarouselPrevious className="-left-6 sm:-left-11 h-10 w-10 sm:h-12 sm:w-12 rounded-none border-3 border-black bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 transition-colors" />
                <CarouselNext className="-right-6 sm:-right-11 h-10 w-10 sm:h-12 sm:w-12 rounded-none border-3 border-black bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 transition-colors" />
              </>
            )}
          </Carousel>
        )}
      </div>

      {/* Lightbox / Modal Image Preview */}
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
          <div className="relative flex min-h-72 items-center justify-center bg-gray-950 p-2 sm:p-4">
            {previewImage ? (
              <img
                src={previewImage}
                alt={selectedMenu?.title ?? "Weekly menu"}
                className="h-auto max-h-[82vh] w-auto max-w-full object-contain"
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 border-2 border-black bg-white p-2 shadow-[3px_3px_0_0_#000] hover:bg-yellow-300 transition-colors cursor-pointer"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 border-2 border-black bg-white p-2 shadow-[3px_3px_0_0_#000] hover:bg-yellow-300 transition-colors cursor-pointer"
                  aria-label="Next image"
                >
                  <ChevronRight />
                </button>
              </>
            )}
          </div>
          {selectedMenu && (
            <div className="border-t-4 border-black bg-black p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                {selectedMenu.start_date && selectedMenu.end_date && (
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-yellow-300">
                    Periode:{" "}
                    {formatDateRange(
                      selectedMenu.start_date,
                      selectedMenu.end_date,
                    )}
                  </p>
                )}
                <p className="whitespace-pre-line text-base sm:text-lg font-bold text-white">
                  {selectedMenu.description ||
                    selectedMenu.title ||
                    "Menu mingguan Dapur Bu Wikra"}
                </p>
              </div>
              <Link
                href={
                  selectedMenu.start_date
                    ? `/order/${selectedMenu.start_date}`
                    : "/order"
                }
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-2 border-white bg-yellow-300 px-5 py-3 text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:bg-yellow-400 hover:translate-x-[1px] hover:translate-y-[1px] transition-all shrink-0"
              >
                <Utensils className="h-4 w-4" />
                <span>Pesan Menu Ini</span>
              </Link>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
