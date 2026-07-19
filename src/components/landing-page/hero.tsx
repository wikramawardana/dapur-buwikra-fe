"use client";

import { MapPin } from "lucide-react";
import type React from "react";
import type { LandingContent } from "@/types/landing-content";
import { NeoButton } from "./neocard";
import { StoryCarousel } from "./story-carousel";

interface HeroProps {
  content: LandingContent["hero"];
}

export const Hero: React.FC<HeroProps> = ({ content }) => {
  return (
    <section className="container mx-auto px-4 py-12 md:py-20 max-w-6xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8 order-2 md:order-1">
          <div className="inline-block bg-black text-white px-4 py-2 font-bold border-2 border-black transform -rotate-2">
            {content.badge}
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight text-brut-black">
            {content.titleBefore}{" "}
            <span className="text-brut-blue underline decoration-4 decoration-black underline-offset-4">
              {content.titleHighlight}
            </span>
            {content.titleAfter}
          </h1>

          <div className="flex flex-col sm:flex-row gap-4">
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
                  .getElementById("area-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <MapPin size={20} />
              {content.secondaryCta}
            </NeoButton>
          </div>
        </div>

        <div className="order-1 md:order-2 flex justify-center relative">
          <StoryCarousel />
        </div>
      </div>
    </section>
  );
};
