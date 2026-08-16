import { ChefHat, Images, Utensils } from "lucide-react";
import Link from "next/link";
import {
  CatalogSection,
  FaqSection,
  Hero,
  HowItWorksSection,
  MenuSection,
  WeeklyMenuSection,
} from "@/components/landing-page";
import { loadLandingContent } from "@/lib/landing-content";

function App() {
  const content = loadLandingContent();

  return (
    <div className="min-h-screen overflow-x-hidden font-sans text-brut-black selection:bg-yellow-300 selection:text-black bg-[#fffdf5]">
      {/* Top Navbar */}
      <nav className="border-b-4 border-black bg-yellow-300 sticky top-0 z-50 shadow-[0_4px_0_0_#000]">
        <div className="container mx-auto px-4 h-20 flex justify-between items-center max-w-6xl">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-black text-xl sm:text-2xl tracking-tight text-black hover:opacity-80 transition-opacity"
            >
              <div className="flex h-11 w-11 items-center justify-center border-3 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <ChefHat className="h-6 w-6 text-black" />
              </div>
              <span className="hidden sm:inline font-black tracking-tight text-black">
                {content.header.brand}
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/portfolio"
              className="flex items-center gap-2 border-2 border-black bg-white px-3.5 py-2 font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-yellow-100 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:px-4 text-xs sm:text-sm"
            >
              <Images size={16} />
              <span className="hidden sm:inline">Jejak Rasa</span>
            </Link>
            <Link
              href="/order"
              className="flex items-center gap-2 border-2 border-black bg-black text-white px-4 py-2 font-black shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-neutral-800 sm:px-5 text-xs sm:text-sm uppercase tracking-wide"
            >
              <Utensils size={16} className="text-yellow-300" />
              <span>Pesan Katering</span>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* 1. Hero Section (Story Carousel: Cerita Kami) */}
        <Hero content={content.hero} />

        {/* 2. Active Weekly Menu Section (Warm appetizing apricot/terracotta theme) */}
        <WeeklyMenuSection content={content.hero} />

        {/* 3. Volume 1: Katalog Bebas Micin (Fresh herbal sage theme) */}
        <CatalogSection />

        {/* 4. How It Works: 3 Langkah Mudah Pesan (Warm turmeric golden theme) */}
        <HowItWorksSection />

        {/* 5. Jejak Rasa Featured Gallery Collection (Warm sunny cream) */}
        <MenuSection content={content.featured} />

        {/* 6. FAQ Accordion (Cozy honey cream) */}
        <FaqSection />
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-black bg-black text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center border-2 border-white bg-yellow-300">
              <ChefHat className="h-6 w-6 text-black" />
            </div>
            <div>
              <p className="font-black text-lg text-white">DAPUR BU WIKRA</p>
              <p className="text-xs text-white/60">
                Katering Kantor Harian &amp; Mingguan • 100% Bebas Micin
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold">
            <Link
              href="/order"
              className="text-yellow-300 hover:underline uppercase"
            >
              Pesan Katering
            </Link>
            <span className="text-white/30">•</span>
            <Link
              href="/portfolio"
              className="text-white hover:text-yellow-300 hover:underline uppercase"
            >
              Jejak Rasa
            </Link>
            <span className="text-white/30">•</span>
            <Link
              href="/orders"
              className="text-white hover:text-yellow-300 hover:underline uppercase"
            >
              Portal Admin
            </Link>
            <span className="text-white/30">•</span>
            <a
              href="https://api.whatsapp.com/send?text=Halo%20Dapur%20Bu%20Wikra!"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:underline uppercase"
            >
              Hubungi WhatsApp
            </a>
          </div>
        </div>
        <div className="container mx-auto max-w-6xl text-center text-xs text-white/40 mt-8 pt-6 border-t border-white/10">
          &copy; {new Date().getFullYear()} Dapur Bu Wikra. All rights reserved.
          Dimasak dengan cinta setiap subuh.
        </div>
      </footer>
    </div>
  );
}

export default App;
