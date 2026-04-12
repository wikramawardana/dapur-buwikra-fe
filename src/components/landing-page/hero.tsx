"use client";

import { Heart, MapPin, Rocket } from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NeoButton, NeoCard } from "./neocard";

export const Hero: React.FC = () => {
  const [showComingSoon, setShowComingSoon] = useState(false);
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
            <NeoButton
              variant="primary"
              onClick={() => setShowComingSoon(true)}
            >
              Lihat Menu Hari Ini
            </NeoButton>
            <NeoButton
              variant="secondary"
              className="flex items-center justify-center gap-2"
              onClick={() => setShowComingSoon(true)}
            >
              <MapPin size={20} />
              Area Kantor Only
            </NeoButton>
          </div>
        </div>

        {/* Right Content: Logo Visual */}
        <div className="order-1 md:order-2 flex justify-center relative">
          <div className="absolute inset-0 bg-brut-blue border-4 border-black transform translate-x-4 translate-y-4 z-0"></div>
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

      {/* Coming Soon Dialog */}
      <Dialog open={showComingSoon} onOpenChange={setShowComingSoon}>
        <DialogContent className="border-4 border-black shadow-neo bg-white max-w-sm text-center">
          <DialogHeader className="items-center">
            <div className="bg-brut-blue p-4 rounded-full border-4 border-black mb-2">
              <Rocket className="w-10 h-10 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase">
              Coming Soon!
            </DialogTitle>
            <DialogDescription className="text-base font-medium text-black">
              Fitur ini masih dalam pengembangan. Tunggu update selanjutnya ya!
            </DialogDescription>
          </DialogHeader>
          <NeoButton
            variant="primary"
            onClick={() => setShowComingSoon(false)}
            className="w-full mt-2"
          >
            OK, Siap!
          </NeoButton>
        </DialogContent>
      </Dialog>
    </section>
  );
};
