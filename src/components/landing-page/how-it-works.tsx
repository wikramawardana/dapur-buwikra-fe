"use client";

import { CalendarCheck, CreditCard, Sparkles, Utensils } from "lucide-react";
import Link from "next/link";

const STEPS = [
  {
    step: "01",
    title: "Pilih Menu & Hari",
    description:
      "Lihat brosur menu mingguan yang berganti setiap pekan. Anda bebas memilih hari katering tertentu (misal Selasa & Kamis) atau langsung satu minggu penuh.",
    icon: CalendarCheck,
    badgeColor: "bg-yellow-300",
  },
  {
    step: "02",
    title: "Bayar Cepat via QRIS",
    description:
      "Isi data pemesan dan lokasi drop-off kantor Anda. Selesaikan pembayaran dalam hitungan detik secara otomatis menggunakan QRIS atau transfer instan.",
    icon: CreditCard,
    badgeColor: "bg-green-300",
  },
  {
    step: "03",
    title: "Diantar Fresh ke Kantor",
    description:
      "Masakan hangat dimasak subuh dan tiba di pantry atau meja kantor Anda sebelum jam 11:30 WIB. Siap disantap saat jam makan siang!",
    icon: Utensils,
    badgeColor: "bg-blue-300",
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-[#fef3c7] border-b-4 border-black py-16 sm:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 bg-yellow-300 border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Sparkles className="h-4 w-4" />
            Mudah &amp; Tanpa Ribet
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight">
            3 Langkah Praktis Pesan
          </h2>
          <p className="text-base sm:text-lg font-medium text-black/70">
            Katering makan siang kantor kini lebih mudah. Pesan di awal minggu,
            nikmati makan siang tenang setiap hari.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {STEPS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative border-4 border-black bg-[#fdfbf7] p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span
                      className={`inline-block border-2 border-black px-3 py-1 text-sm font-black ${item.badgeColor} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
                    >
                      LANGKAH {item.step}
                    </span>
                    <div className="w-12 h-12 border-2 border-black bg-black text-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-black mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base font-medium text-black/70 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {index < 2 && (
                  <div className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 z-10 bg-black text-white w-8 h-8 rounded-full border-2 border-white flex items-center justify-center font-black text-xs">
                    →
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/order"
            className="inline-flex items-center gap-2 border-3 border-black bg-yellow-300 hover:bg-yellow-400 px-6 py-3.5 text-base font-black uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Utensils className="h-5 w-5" />
            <span>Mulai Pesan Sekarang</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
