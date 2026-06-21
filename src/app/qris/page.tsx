import { ArrowLeft, ScanLine, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

const QRIS_SOURCE_URL =
  process.env.QRIS_SOURCE_URL ||
  "https://static.wikra.cloud/payment/qris-dapurbuwikra.png";

export const metadata: Metadata = {
  title: "Pembayaran QRIS | Dapur Bu Wikra",
  description: "Halaman pembayaran QRIS resmi Dapur Bu Wikra.",
};

export default function QrisPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-brut-bg px-4 py-8 text-brut-black sm:py-12">
      <div className="pointer-events-none absolute top-12 left-8 hidden h-16 w-16 rotate-12 border-4 border-black bg-brut-blue md:block" />
      <div className="pointer-events-none absolute top-28 right-12 hidden h-10 w-10 rotate-45 bg-black md:block" />
      <div className="pointer-events-none absolute bottom-20 left-16 hidden h-5 w-24 bg-black md:block" />

      <div className="relative z-10 mx-auto w-full max-w-lg">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 border-2 border-black bg-white px-4 py-2 text-sm font-bold shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000]"
        >
          <ArrowLeft className="size-4" />
          Kembali
        </Link>

        <section className="border-4 border-black bg-white shadow-[10px_10px_0_0_#000]">
          <header className="border-b-4 border-black bg-brut-blue px-6 py-7 text-center text-white">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center border-3 border-black bg-white text-black shadow-[4px_4px_0_0_#000]">
              <ScanLine className="size-8" strokeWidth={2.5} />
            </div>
            <p className="text-xs font-black tracking-[0.3em] uppercase">
              Dapur Bu Wikra
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase">
              Pembayaran QRIS
            </h1>
          </header>

          <div className="p-5 sm:p-8">
            <div className="border-3 border-black bg-white p-3 shadow-[5px_5px_0_0_#2563eb]">
              {/* The source stays in R2 while this public page provides a stable app URL. */}
              <img
                src={QRIS_SOURCE_URL}
                alt="QRIS Dapur Bu Wikra"
                className="mx-auto block h-auto w-full"
              />
            </div>

            <div className="mt-7 border-2 border-black bg-[#fef08a] p-4 text-center">
              <p className="font-black uppercase">Cara Pembayaran</p>
              <p className="mt-1 text-sm font-medium leading-relaxed">
                Buka aplikasi pembayaran, pilih menu scan QRIS, lalu arahkan
                kamera ke kode di atas.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-center text-xs font-bold text-black/60">
              <ShieldCheck className="size-4 text-brut-blue" />
              Halaman pembayaran resmi Dapur Bu Wikra
            </div>
          </div>
        </section>

        <p className="mt-6 text-center text-xs font-semibold text-black/50">
          Pastikan nama merchant dan nominal pembayaran sudah sesuai sebelum
          menyelesaikan transaksi.
        </p>
      </div>
    </main>
  );
}
