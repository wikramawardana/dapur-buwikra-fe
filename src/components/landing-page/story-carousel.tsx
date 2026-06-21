"use client";

import Image from "next/image";
import * as React from "react";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

const STORY_ASSET_BASE_URL =
  process.env.NEXT_PUBLIC_ASSET_URL ||
  "https://static.wikra.cloud/landing/story";

const STORY_SLIDES = [
  {
    src: `${STORY_ASSET_BASE_URL}/00-cover.jpeg`,
    alt: "Ada cerita di balik Dapur Bu Wikra",
  },
  {
    src: `${STORY_ASSET_BASE_URL}/01-rindu-rumah.jpeg`,
    alt: "Bagian 1: Rindu Rumah",
  },
  {
    src: `${STORY_ASSET_BASE_URL}/02-formula-rahasia.jpeg`,
    alt: "Bagian 2: Formula Rahasia",
  },
  {
    src: `${STORY_ASSET_BASE_URL}/03-sepiring-rasa.jpeg`,
    alt: "Bagian 3: Sepiring Rasa",
  },
  {
    src: `${STORY_ASSET_BASE_URL}/04-memori-kecil.jpeg`,
    alt: "Bagian 4: Memori Kecil",
  },
  {
    src: `${STORY_ASSET_BASE_URL}/05-benih-api.jpeg`,
    alt: "Bagian 5: Benih Api",
  },
  {
    src: `${STORY_ASSET_BASE_URL}/06-closing.jpeg`,
    alt: "Sekarang kamu tahu ceritanya",
  },
];

export function StoryCarousel() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

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

  React.useEffect(() => {
    if (!api) return;
    const interval = window.setInterval(() => api.scrollNext(), 6000);
    return () => window.clearInterval(interval);
  }, [api]);

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-0 translate-x-4 translate-y-4 border-4 border-black bg-brut-blue" />

      <div className="relative border-4 border-black bg-white shadow-neo-lg">
        <Carousel setApi={setApi} opts={{ loop: true }}>
          <CarouselContent className="ml-0">
            {STORY_SLIDES.map((slide, index) => (
              <CarouselItem key={slide.src} className="pl-0">
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  width={1080}
                  height={1350}
                  priority={index === 0}
                  sizes="(max-width: 768px) 100vw, 448px"
                  className="block h-auto w-full"
                />
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious className="left-3 size-10 rounded-none border-3 border-black bg-white shadow-[3px_3px_0_0_#000] hover:bg-white" />
          <CarouselNext className="right-3 size-10 rounded-none border-3 border-black bg-white shadow-[3px_3px_0_0_#000] hover:bg-white" />
        </Carousel>

        <div className="flex items-center justify-between gap-4 border-t-4 border-black bg-white px-4 py-3">
          <p className="text-xs font-black tracking-widest uppercase">
            Cerita Kami
          </p>
          <div
            className="flex gap-1.5"
            role="group"
            aria-label="Pilih slide cerita"
          >
            {STORY_SLIDES.map((slide, index) => (
              <button
                key={slide.src}
                type="button"
                onClick={() => api?.scrollTo(index)}
                className={cn(
                  "size-2.5 border border-black transition-colors",
                  current === index ? "bg-brut-blue" : "bg-white",
                )}
                aria-label={`Buka slide ${index + 1}`}
                aria-current={current === index ? "true" : undefined}
              />
            ))}
          </div>
          <p className="font-mono text-xs font-bold">
            {String(current + 1).padStart(2, "0")}/
            {String(STORY_SLIDES.length).padStart(2, "0")}
          </p>
        </div>
      </div>
    </div>
  );
}
