"use client";

import { MapPin, Sparkles } from "lucide-react";
import type React from "react";
import type { LandingContent } from "@/types/landing-content";
import { NeoButton } from "./neocard";
import { StoryCarousel } from "./story-carousel";

interface HeroProps {
  content: LandingContent["hero"];
}

export const Hero: React.FC<HeroProps> = ({ content }) => {
  return (
    <section className="border-b-4 border-black bg-[#fff9eb] py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 order-2 md:order-1">
            <div className="inline-flex items-center gap-2 bg-yellow-300 text-black px-4 py-2 font-black border-3 border-black transform -rotate-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] uppercase text-xs sm:text-sm">
              <Sparkles className="h-4 w-4" />
              <span>{content.badge}</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-tight text-brut-black">
              {content.titleBefore}{" "}
              <span className="bg-yellow-300 px-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] underline decoration-4 decoration-black underline-offset-4 inline-block transform rotate-1">
                {content.titleHighlight}
              </span>
              <br />
              {content.titleAfter}
            </h1>

            <p className="text-base sm:text-xl font-bold text-black/75 max-w-lg leading-relaxed">
              {content.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <NeoButton
                variant="primary"
                onClick={() =>
                  document
                    .getElementById("weekly-menu-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                {content.primaryCta}
              </NeoButton>
              <NeoButton
                variant="secondary"
                className="flex items-center justify-center gap-2"
                onClick={() =>
                  document
                    .getElementById("catalog-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <MapPin size={20} />
                <span>Lihat Katalog Menu</span>
              </NeoButton>
            </div>
          </div>

          <div className="order-1 md:order-2 flex justify-center relative">
            <StoryCarousel />
          </div>
        </div>
      </div>
    </section>
  );
};
