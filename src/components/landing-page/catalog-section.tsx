"use client";

import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sparkles,
  Utensils,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import {
  Carousel,
  type CarouselApi,
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
import { cn } from "@/lib/utils";

const CATALOG_BASE_URL = "https://static.wikra.cloud/landing/catalog-volume-1";

const CATALOG_SLIDES = [
  {
    src: `${CATALOG_BASE_URL}/00-cover.jpeg`,
    title: "Volume 1: Katalog Bebas Micin",
    subtitle: "Sajian istimewa berbalut kehangatan rumah, 100% Tanpa Micin",
    badge: "Cover",
  },
  {
    src: `${CATALOG_BASE_URL}/01-ada-kenangan.jpeg`,
    title: "Ada Kenangan di Setiap Suapan",
    subtitle:
      "Rasa masakan ibu selalu memanggil pulang dengan kehangatan sejati",
    badge: "Cerita Rasa",
  },
  {
    src: `${CATALOG_BASE_URL}/02-mash-n-grill.jpeg`,
    title: "Mash 'n Grill",
    subtitle:
      "Si Tumbuk dan Si Panggang • Harmoni ayam panggang juicy & mashed potato",
    badge: "Hidangan 01",
  },
  {
    src: `${CATALOG_BASE_URL}/03-meat-n-misoa.jpeg`,
    title: "Meat 'n Misoa",
    subtitle: "Si Seruput Lumer • Misoa sutra & kaldu daging gurih hangat",
    badge: "Hidangan 02",
  },
  {
    src: `${CATALOG_BASE_URL}/04-balinese-bites.jpeg`,
    title: "Balinese Bites",
    subtitle: "Si Lilit & Si Matah • Sate lilit rempah & segarnya sambal matah",
    badge: "Hidangan 03",
  },
  {
    src: `${CATALOG_BASE_URL}/05-aromatic-kecombrang.jpeg`,
    title: "Aromatic Kecombrang",
    subtitle:
      "Si Wangi & Si Gurih • Nasi goreng kecombrang wangi & sate ayam empuk",
    badge: "Hidangan 04",
  },
  {
    src: `${CATALOG_BASE_URL}/06-smoky-n-spiced.jpeg`,
    title: "Smoky 'n Spiced",
    subtitle: "Si Bakar & Si Pepes • Ikan bakar gurih & pepes tahu lembut",
    badge: "Hidangan 05",
  },
  {
    src: `${CATALOG_BASE_URL}/07-sour-n-salty.jpeg`,
    title: "Sour 'n Salty",
    subtitle: "Si Segar Gurih • Kuah asam segar berpadu ikan asin gurih renyah",
    badge: "Hidangan 06",
  },
  {
    src: `${CATALOG_BASE_URL}/08-fiery-n-crisp.jpeg`,
    title: "Fiery 'n Crisp",
    subtitle:
      "Si Chili Padi & Si Crunchy • Daging pedas gurih & kangkung renyah",
    badge: "Hidangan 07",
  },
  {
    src: `${CATALOG_BASE_URL}/09-charred-wrap.jpeg`,
    title: "Charred Wrap",
    subtitle: "Si Bakar Suwir • Nasi bakar tongkol suwir daun pisang",
    badge: "Hidangan 08",
  },
  {
    src: `${CATALOG_BASE_URL}/10-closing.jpeg`,
    title: "Sebab yang Asli, Punya Kelasnya Sendiri",
    subtitle: "Rasa murni dari alam, kehangatan sejati dari hati ibu",
    badge: "Penutup",
  },
];

export function CatalogSection() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;

    const updateCurrent = () => setCurrent(api.selectedScrollSnap());
    updateCurrent();
    api.on("select", updateCurrent);
    api.on("reInit", updateCurrent);

    return () => {
      api.off("select", updateCurrent);
      api.off("reInit", updateCurrent);
    };
  }, [api]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const currentSlide = CATALOG_SLIDES[current] || CATALOG_SLIDES[0];

  return (
    <section
      id="catalog-section"
      className="scroll-mt-16 bg-[#faf9f5] border-y-4 border-black py-16 sm:py-24 overflow-hidden"
    >
      <div className="container mx-auto max-w-6xl px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-yellow-300 border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <BookOpen className="h-4 w-4" />
              Volume 1 • Edisi Perdana
            </div>
            <h2 className="text-4xl sm:text-6xl font-black text-black tracking-tight leading-tight">
              Katalog Bebas Micin
            </h2>
            <p className="text-base sm:text-xl font-medium text-black/70 max-w-2xl">
              Bukan sekadar kenyang, tapi juga tenang. Sajian istimewa berbalut
              kehangatan rumah, diracik 100% tanpa MSG &amp; bahan pengawet.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/order"
              className="inline-flex items-center gap-2 border-3 border-black bg-yellow-300 hover:bg-yellow-400 px-5 py-3 text-sm sm:text-base font-black uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <Utensils className="h-4 w-4" />
              <span>Pesan Menu Ini</span>
            </Link>
          </div>
        </div>

        {/* Feature Highlights Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10 text-xs sm:text-sm font-bold">
          <div className="border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
            <span className="text-xl">🌱</span>
            <span>100% Bebas Micin &amp; Kaldu Alami</span>
          </div>
          <div className="border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
            <span className="text-xl">🍳</span>
            <span>Dimasak Fresh Tiap Subuh</span>
          </div>
          <div className="border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
            <span className="text-xl">🍱</span>
            <span>Porsi Lengkap &amp; Mengenyangkan</span>
          </div>
        </div>

        {/* Main Showcase Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Interactive Carousel Display */}
          <div className="lg:col-span-8">
            <div className="relative border-4 border-black bg-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <Carousel
                setApi={setApi}
                opts={{ loop: true }}
                className="w-full"
              >
                <CarouselContent className="ml-0">
                  {CATALOG_SLIDES.map((slide, index) => (
                    <CarouselItem key={slide.src} className="pl-0 relative">
                      <button
                        type="button"
                        onClick={() => openLightbox(index)}
                        className="w-full aspect-[16/9] relative bg-neutral-900 flex items-center justify-center cursor-pointer group"
                        aria-label={`Buka tampilan penuh slide ${index + 1}`}
                      >
                        <Image
                          src={slide.src}
                          alt={slide.title}
                          fill
                          priority={index === 0}
                          sizes="(max-width: 1024px) 100vw, 768px"
                          className="object-contain"
                        />
                        <span className="absolute bottom-4 right-4 flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] opacity-90 group-hover:opacity-100 transition-opacity">
                          <Eye className="h-3.5 w-3.5" /> Lihat Ukuran Penuh
                        </span>
                      </button>
                    </CarouselItem>
                  ))}
                </CarouselContent>

                <CarouselPrevious className="left-4 h-10 w-10 sm:h-12 sm:w-12 rounded-none border-3 border-black bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 hover:text-black transition-colors" />
                <CarouselNext className="right-4 h-10 w-10 sm:h-12 sm:w-12 rounded-none border-3 border-black bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 hover:text-black transition-colors" />
              </Carousel>

              {/* Bottom Carousel Controller Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t-4 border-black bg-white px-4 sm:px-6 py-3">
                <div className="flex items-center gap-2">
                  <span className="bg-black text-white px-2 py-0.5 text-xs font-black uppercase">
                    {currentSlide.badge}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-black truncate max-w-[200px] sm:max-w-xs">
                    {currentSlide.title}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Jump Dots */}
                  <div
                    className="flex gap-1 overflow-x-auto max-w-[160px] sm:max-w-none"
                    role="group"
                    aria-label="Pilih halaman katalog"
                  >
                    {CATALOG_SLIDES.map((slide, index) => (
                      <button
                        key={slide.src}
                        type="button"
                        onClick={() => api?.scrollTo(index)}
                        className={cn(
                          "h-3 w-3 sm:h-3.5 sm:w-3.5 border-2 border-black transition-all cursor-pointer",
                          current === index
                            ? "bg-yellow-400 scale-110 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                            : "bg-white hover:bg-gray-200",
                        )}
                        aria-label={`Slide ${index + 1}`}
                      />
                    ))}
                  </div>

                  <p className="font-mono text-xs sm:text-sm font-black bg-gray-100 border border-black px-2 py-0.5 shrink-0">
                    {String(current + 1).padStart(2, "0")} /{" "}
                    {String(CATALOG_SLIDES.length).padStart(2, "0")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Slide Info & Quick Selection List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="border-4 border-black bg-white p-5 sm:p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <div className="flex items-center justify-between gap-2 border-b-2 border-black pb-3">
                <span className="bg-yellow-300 border-2 border-black px-2.5 py-0.5 text-xs font-black uppercase tracking-wider">
                  {currentSlide.badge}
                </span>
                <span className="text-xs font-bold text-black/60">
                  Slide {current + 1} dari {CATALOG_SLIDES.length}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-black text-black">
                  {currentSlide.title}
                </h3>
                <p className="text-sm sm:text-base font-medium text-black/80 leading-relaxed bg-gray-50 border-2 border-black/20 p-3">
                  {currentSlide.subtitle}
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/order"
                  className="w-full flex items-center justify-center gap-2 border-2 border-black bg-black text-white hover:bg-brut-blue px-4 py-3 text-sm font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                >
                  <Sparkles className="h-4 w-4 text-yellow-300" />
                  <span>Pesan Katering Mingguan</span>
                </Link>
              </div>
            </div>

            {/* Quick Slide Navigation Mini-Grid */}
            <div className="border-3 border-black bg-white p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-xs font-black uppercase tracking-wide text-black/60 mb-2">
                Daftar Hidangan Katalog:
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
                {CATALOG_SLIDES.slice(2, 10).map((dish, i) => {
                  const actualIndex = i + 2;
                  const isSelected = current === actualIndex;
                  return (
                    <button
                      key={dish.src}
                      type="button"
                      onClick={() => api?.scrollTo(actualIndex)}
                      className={cn(
                        "text-left px-2 py-1.5 border truncate cursor-pointer transition-colors",
                        isSelected
                          ? "bg-yellow-300 border-black font-black"
                          : "bg-gray-50 border-gray-300 hover:bg-yellow-100 text-black/80",
                      )}
                    >
                      {dish.title}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox / Fullscreen Image Dialog */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-h-[96vh] overflow-y-auto rounded-none border-4 border-black bg-white p-0 shadow-neo sm:max-w-5xl">
          <DialogTitle className="sr-only">
            {CATALOG_SLIDES[lightboxIndex]?.title || "Katalog Bebas Micin"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Tampilan ukuran penuh katalog hidangan bebas micin
          </DialogDescription>
          <div className="relative flex min-h-72 items-center justify-center bg-gray-950 p-3 sm:p-6">
            {CATALOG_SLIDES[lightboxIndex] && (
              <div className="relative w-full aspect-[16/9] max-h-[80vh]">
                <Image
                  src={CATALOG_SLIDES[lightboxIndex].src}
                  alt={CATALOG_SLIDES[lightboxIndex].title}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </div>
            )}
            <button
              type="button"
              onClick={() =>
                setLightboxIndex((prev) =>
                  prev === 0 ? CATALOG_SLIDES.length - 1 : prev - 1,
                )
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 border-2 border-black bg-white p-2 text-black shadow-[3px_3px_0_0_#000] hover:bg-yellow-300 transition-colors cursor-pointer"
              aria-label="Slide sebelumnya"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() =>
                setLightboxIndex((prev) => (prev + 1) % CATALOG_SLIDES.length)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 border-2 border-black bg-white p-2 text-black shadow-[3px_3px_0_0_#000] hover:bg-yellow-300 transition-colors cursor-pointer"
              aria-label="Slide berikutnya"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
          <div className="border-t-4 border-black bg-black p-4 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="font-black text-base text-yellow-300">
                {CATALOG_SLIDES[lightboxIndex]?.title}
              </p>
              <p className="text-xs text-white/70">
                {CATALOG_SLIDES[lightboxIndex]?.subtitle}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-mono font-bold bg-white text-black px-2 py-1">
                {lightboxIndex + 1} / {CATALOG_SLIDES.length}
              </span>
              <Link
                href="/order"
                className="border-2 border-white bg-yellow-300 hover:bg-yellow-400 text-black px-3 py-1.5 text-xs font-black uppercase transition-colors"
              >
                Pesan Menu Ini
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
