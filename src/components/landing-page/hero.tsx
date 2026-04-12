"use client";

import { Heart, MapPin } from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getUploadUrl } from "@/lib/api.config";
import { getDefaultWeek } from "@/lib/week-utils";
import { getFeaturedMenus } from "@/services/menu.service";
import type { Menu } from "@/types/menu.types";
import { NeoButton, NeoCard } from "./neocard";

function getDatesForWeek(dateFrom: string): string[] {
  const start = new Date(`${dateFrom}T00:00:00`);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

function formatWeekLabel(dateFrom: string, dateTo: string): string {
  const from = new Date(`${dateFrom}T00:00:00`);
  const to = new Date(`${dateTo}T00:00:00`);
  const monthYear = from.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
  return `${from.getDate()}–${to.getDate()} ${monthYear}`;
}

export const Hero: React.FC = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [weekMenus, setWeekMenus] = useState<Menu[]>([]);
  const [weekLabel, setWeekLabel] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleShowMenu = async () => {
    setShowMenu(true);
    if (weekMenus.length > 0) return;
    setIsLoading(true);
    try {
      const { dateFrom, dateTo } = getDefaultWeek();
      setWeekLabel(formatWeekLabel(dateFrom, dateTo));
      const allMenus = await getFeaturedMenus();
      const dates = getDatesForWeek(dateFrom);
      const mapped = dates.map(
        (date) => allMenus.find((m) => m.start_date === date) ?? null,
      );
      setWeekMenus(mapped.filter((m): m is Menu => m !== null));
    } catch {
      setWeekMenus([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="container mx-auto px-4 py-12 md:py-20 max-w-6xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left Content: Text */}
        <div className="space-y-8 order-2 md:order-1">
          <div className="inline-block bg-black text-white px-4 py-2 font-bold border-2 border-black transform -rotate-2">
            KHUSUS ANAK KANTOR
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight text-brut-black">
            BUKAN CATERING{" "}
            <span className="text-brut-blue underline decoration-4 decoration-black underline-offset-4">
              BIASA
            </span>
            .
          </h1>

          <NeoCard className="bg-yellow-300 transform rotate-1">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Heart className="fill-black" /> The Story:
            </h3>
            <p className="font-medium text-lg border-l-4 border-black pl-4">
              "Simple aja sebenernya. Istri saya masak, terus pengen dinilai
              sama temen-temen kantor. Eh, Alhamdulillah pada cocok &
              ketagihan!"
            </p>
          </NeoCard>

          <div className="flex flex-col sm:flex-row gap-4">
            <NeoButton variant="primary" onClick={handleShowMenu}>
              Lihat Menu
            </NeoButton>
            <NeoButton
              variant="secondary"
              className="flex items-center justify-center gap-2"
              onClick={handleShowMenu}
            >
              <MapPin size={20} />
              Area Kantor Only
            </NeoButton>
          </div>
        </div>

        {/* Right Content: Logo Visual */}
        <div className="order-1 md:order-2 flex justify-center relative">
          <div className="absolute inset-0 bg-brut-blue border-4 border-black transform translate-x-4 translate-y-4 z-0" />
          <div className="relative z-10 bg-white border-4 border-black shadow-neo-lg w-full max-w-md flex flex-col items-center overflow-hidden">
            <img
              src="/image/dapur-buwikra-logo.png"
              alt="Logo Dapur Bu Wikra"
              className="w-full h-auto object-cover border-b-4 border-black"
            />
            <div className="text-center py-4 px-6">
              <h2 className="text-3xl font-black uppercase tracking-tighter">
                Katering Kantoran
              </h2>
              <p className="text-sm font-bold bg-black text-white inline-block px-2 mt-2">
                EST. 2025
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Menu Dialog */}
      <Dialog open={showMenu} onOpenChange={setShowMenu}>
        <DialogContent className="border-4 border-black shadow-neo bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">
              Menu Minggu Ini
            </DialogTitle>
            {weekLabel && (
              <p className="text-sm font-bold bg-black text-white inline-block px-2 py-0.5 w-fit">
                {weekLabel}
              </p>
            )}
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-8">
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
          ) : weekMenus.length === 0 ? (
            <p className="text-center text-gray-400 italic py-8">
              Menu belum tersedia
            </p>
          ) : (
            <div className="flex flex-col gap-6 pt-2">
              {weekMenus.map((menu, i) => {
                const imageUrl = menu?.image_urls?.[0]
                  ? getUploadUrl(menu.image_urls[0])
                  : null;
                return (
                  <div
                    key={i}
                    className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={menu?.title ?? "Menu"}
                        className="w-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                        <span className="text-6xl">🍱</span>
                      </div>
                    )}
                    {menu && (
                      <div className="bg-black text-white px-4 py-2">
                        <p className="font-black text-sm leading-tight">
                          {menu.title}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
