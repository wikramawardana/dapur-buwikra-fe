"use client";

import {
  CheckCircle2,
  Flame,
  HeartHandshake,
  Leaf,
  Shield,
  Sparkles,
} from "lucide-react";

const VALUES = [
  {
    icon: Flame,
    title: "Dimasak Jam 2 Pagi",
    description:
      "Bukan makanan beku yang dipanaskan ulang. Seluruh hidangan dimasak fresh setiap subuh hari pengantaran demi cita rasa maksimal.",
    tag: "Fresh Daily",
    accent: "bg-red-400",
  },
  {
    icon: Leaf,
    title: "100% Bebas Micin",
    description:
      "Diracik murni dengan kaldu asli, bawang, rempah-rempah nusantara, dan bumbu dapur alami. Tanpa MSG, tanpa pengawet sintesis.",
    tag: "Sehat Alami",
    accent: "bg-green-400",
  },
  {
    icon: HeartHandshake,
    title: "Rasa Otentik Rumahan",
    description:
      "Mengobati rasa rindu masakan ibu. Kombinasi rasa gurih, sedap, dan manis yang pas dan nyaman di perut untuk produktivitas kerja seharian.",
    tag: "Comfort Food",
    accent: "bg-yellow-400",
  },
  {
    icon: Shield,
    title: "Pasti Tepat Waktu",
    description:
      "Sistem pengantaran terjadwal memastikan pesanan tiba sebelum jam istirahat kantor agar Anda dapat menikmati makan siang tanpa cemas.",
    tag: "Tepat Waktu",
    accent: "bg-blue-400",
  },
];

export function ValuePropsSection() {
  return (
    <section className="bg-white border-b-4 border-black py-16 sm:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 bg-yellow-300 border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Sparkles className="h-4 w-4" />
            Standar Kualitas Dapur
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight">
            Kenapa Pilih Dapur Bu Wikra?
          </h2>
          <p className="text-base sm:text-lg font-medium text-black/70">
            Komitmen kami untuk memberikan makan siang kantor yang higienis,
            lezat, dan menyehatkan tanpa kompromi.
          </p>
        </div>

        {/* 4 Bento Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {VALUES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="border-4 border-black bg-[#faf9f5] p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 border-3 border-black ${item.accent} text-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="border-2 border-black bg-white px-2.5 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-black mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base font-medium text-black/70 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t-2 border-black/10 flex items-center gap-1.5 text-xs font-black text-black/80">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Kualitas &amp; Kesegaran Terjamin</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
