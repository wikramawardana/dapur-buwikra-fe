import { LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Hero } from "@/components/landing-page/hero";
import { MenuSection } from "@/components/landing-page/menu-section";

function App() {
  return (
    <div className="min-h-screen pb-20 overflow-x-hidden font-sans text-brut-black selection:bg-brut-blue selection:text-white">
      {/* Simple Header */}
      <nav className="border-b-4 border-black bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 h-20 flex justify-between items-center max-w-6xl">
          <div className="flex items-center gap-2">
            <span className="font-black text-2xl tracking-tight hidden sm:block">
              DAPUR BU WIKRA
            </span>
          </div>
          <Link
            href="/orders"
            className="flex items-center gap-2 px-4 py-2 font-bold bg-brut-blue text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <LayoutDashboard size={18} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </div>
      </nav>

      <main>
        <Hero />
        <MenuSection />

        {/* Availability Banner */}
        <section className="container mx-auto px-4 py-12">
          <div className="bg-black text-white border-4 border-brut-blue p-8 md:p-12 shadow-neo-lg text-center transform md:rotate-1">
            <h3 className="text-3xl md:text-5xl font-black mb-4">
              MAAF YA, MASIH TERBATAS!
            </h3>
            <p className="text-lg md:text-xl font-medium max-w-2xl mx-auto">
              Saat ini Dapur Bu Wikra hanya melayani pengiriman di lingkungan
              kantor saja. Doain ya biar bisa buka cabang buat umum!
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
