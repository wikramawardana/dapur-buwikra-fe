import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PortfolioGallery } from "@/components/landing-page/portfolio-gallery";

export default function PortfolioPage() {
  return (
    <main className="min-h-screen bg-yellow-50 px-4 py-10 text-brut-black sm:py-16">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 border-2 border-black bg-white px-4 py-2 font-bold shadow-[3px_3px_0_0_#000]"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
        <div className="mb-10 max-w-3xl">
          <p className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-brut-blue">
            Dapur Bu Wikra
          </p>
          <h1 className="text-5xl font-black sm:text-7xl">
            PORTOFOLIO MASAKAN
          </h1>
          <p className="mt-4 text-lg font-medium text-gray-600">
            Beberapa contoh masakan, nasi box, dan sajian yang pernah kami buat.
          </p>
        </div>
        <PortfolioGallery />
      </div>
    </main>
  );
}
