"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  ImageIcon,
  Sparkles,
} from "lucide-react";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getUploadUrl } from "@/lib/api.config";
import type { WeekOption } from "@/lib/week-utils";
import { getPublishedMenus } from "@/services/menu.service";
import type { Menu } from "@/types/menu.types";

interface WeeklyMenuPreviewProps {
  currentWeekStart: string;
  currentWeekEnd: string;
  weekOptions: WeekOption[];
  onWeekChange: (weekStart: string) => void;
}

function formatDateRange(dateFrom: string, dateTo: string): string {
  try {
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
  } catch {
    return `${dateFrom} – ${dateTo}`;
  }
}

export function WeeklyMenuPreview({
  currentWeekStart,
  currentWeekEnd,
  weekOptions,
  onWeekChange,
}: WeeklyMenuPreviewProps) {
  const [publishedMenus, setPublishedMenus] = React.useState<Menu[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);

  // Fetch published menus
  React.useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getPublishedMenus()
      .then((menus) => {
        if (!isMounted) return;
        setPublishedMenus(menus);
      })
      .catch((err) => {
        console.error("Failed to load published menus:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Find menu matching this week's start/end dates
  const currentWeekMenu = React.useMemo(() => {
    if (!publishedMenus || publishedMenus.length === 0) return null;

    // 1. Direct match with start_date or range
    const exactMatch = publishedMenus.find((m) => {
      if (m.start_date === currentWeekStart) return true;
      if (m.start_date && m.end_date) {
        return m.start_date <= currentWeekStart && m.end_date >= currentWeekEnd;
      }
      return false;
    });

    if (exactMatch) return exactMatch;

    // 2. Fallback: if user picked current week and no exact match, pick the most recent weekly menu
    return (
      publishedMenus.find(
        (m) => (m.content_type || "weekly_menu") === "weekly_menu",
      ) || null
    );
  }, [publishedMenus, currentWeekStart, currentWeekEnd]);

  const images = currentWeekMenu?.image_urls || [];
  const currentImage = images[selectedImageIndex]
    ? getUploadUrl(images[selectedImageIndex])
    : null;

  return (
    <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
      {/* Top Bar: Week Selector */}
      <div className="bg-yellow-300 border-b-4 border-black p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-black text-white px-2 py-0.5 text-xs font-black uppercase tracking-wider">
              Weekly Menu
            </span>
            <span className="text-xs font-bold text-black/70">
              Periode Katering
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight mt-1">
            {formatDateRange(currentWeekStart, currentWeekEnd)}
          </h2>
        </div>

        {/* Week Switcher Dropdown */}
        <div className="w-full sm:w-auto min-w-[240px]">
          <Select value={currentWeekStart} onValueChange={onWeekChange}>
            <SelectTrigger className="h-11 bg-white font-bold text-sm border-2 border-black rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <CalendarDays className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Pilih Minggu" />
            </SelectTrigger>
            <SelectContent className="border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {weekOptions.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="font-medium text-sm py-2 cursor-pointer focus:bg-yellow-100"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Menu Body */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Flyer Image Preview (left / top) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          {isLoading ? (
            <div className="w-full h-56 bg-gray-100 animate-pulse border-2 border-black flex items-center justify-center">
              <span className="text-sm font-bold text-black/50">
                Memuat menu...
              </span>
            </div>
          ) : images.length > 0 ? (
            <div className="w-full relative group">
              <button
                type="button"
                onClick={() => {
                  setSelectedImageIndex(0);
                  setIsModalOpen(true);
                }}
                className="w-full h-64 sm:h-72 bg-gray-100 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center overflow-hidden cursor-pointer relative"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getUploadUrl(images[0])}
                  alt={currentWeekMenu?.title || "Brosur Menu Mingguan"}
                  className="w-full h-full object-contain p-2"
                />
                <span className="absolute bottom-3 right-3 flex items-center gap-1.5 border-2 border-black bg-white px-3 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Eye className="h-3.5 w-3.5" /> Lihat Brosur Menu
                </span>
                {images.length > 1 && (
                  <span className="absolute top-3 right-3 border-2 border-black bg-black text-white px-2 py-1 text-xs font-black">
                    +{images.length - 1} foto
                  </span>
                )}
              </button>
            </div>
          ) : (
            <div className="w-full h-56 bg-yellow-50 border-3 border-dashed border-black/40 flex flex-col items-center justify-center p-4 text-center">
              <ImageIcon className="h-10 w-10 text-black/40 mb-2" />
              <p className="font-bold text-sm text-black/70">
                Brosur gambar belum tersedia
              </p>
              <p className="text-xs text-black/50 mt-1">
                Anda tetap dapat memilih hidangan di formulir bawah
              </p>
            </div>
          )}
        </div>

        {/* Menu Description & Details (right) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brut-blue" />
            <h3 className="text-xl sm:text-2xl font-black text-black">
              {currentWeekMenu?.title || "Menu Katering Mingguan"}
            </h3>
          </div>

          <p className="text-base text-black/80 font-medium whitespace-pre-line leading-relaxed bg-gray-50 border-2 border-black/20 p-4">
            {currentWeekMenu?.description ||
              "Menu masakan lezat rumahan Dapur Bu Wikra dibuat segar setiap hari dengan bahan-bahan pilihan tanpa pengawet. Silakan pilih hari dan menu pesanan Anda di bawah ini!"}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs sm:text-sm font-bold">
            <div className="border-2 border-black bg-blue-50 p-2.5 text-center">
              🍱 Fresh Daily
            </div>
            <div className="border-2 border-black bg-green-50 p-2.5 text-center">
              🌿 Halal & Higienis
            </div>
            <div className="border-2 border-black bg-purple-50 p-2.5 text-center col-span-2 sm:col-span-1">
              🛵 Antar Tepat Waktu
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox / Modal for Full Size Menu Image */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[96vh] overflow-y-auto rounded-none border-4 border-black bg-white p-0 shadow-neo sm:max-w-5xl">
          <DialogTitle className="sr-only">
            {currentWeekMenu?.title || "Brosur Menu"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Tampilan ukuran penuh brosur menu mingguan
          </DialogDescription>
          <div className="relative flex min-h-72 items-center justify-center bg-gray-900 p-4">
            {currentImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentImage}
                alt={currentWeekMenu?.title || "Menu Mingguan"}
                className="h-auto max-h-[80vh] w-auto max-w-full object-contain border-2 border-white"
              />
            )}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImageIndex((index) =>
                      index === 0 ? images.length - 1 : index - 1,
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 border-2 border-black bg-white p-2 shadow-[3px_3px_0_0_#000] hover:bg-yellow-300 transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImageIndex(
                      (index) => (index + 1) % images.length,
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 border-2 border-black bg-white p-2 shadow-[3px_3px_0_0_#000] hover:bg-yellow-300 transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
          <div className="border-t-4 border-black bg-black p-4 text-white flex justify-between items-center">
            <div>
              <p className="font-black text-base text-yellow-300">
                {currentWeekMenu?.title || "Menu Mingguan Dapur Bu Wikra"}
              </p>
              <p className="text-xs text-white/70">
                {formatDateRange(currentWeekStart, currentWeekEnd)}
              </p>
            </div>
            {images.length > 1 && (
              <span className="text-xs font-bold bg-white text-black px-2 py-1">
                {selectedImageIndex + 1} / {images.length}
              </span>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
