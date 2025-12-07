import { ArrowRight, Utensils } from "lucide-react";
import Image from "next/image";
import type React from "react";
import { Button } from "./button";

export const Hero: React.FC = () => {
  return (
    <section
      id="home"
      className="relative min-h-[90vh] flex items-center pt-24 bg-blue-50"
    >
      {/* Decorative Grid Background */}
      <div
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      ></div>

      <div className="container mx-auto px-4 md:px-8 relative z-10 py-12 md:py-0">
        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Left Content */}
          <div className="w-full md:w-1/2">
            <div className="inline-flex items-center gap-2 bg-white border-2 border-black px-4 py-2 font-bold text-sm mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Utensils size={16} strokeWidth={3} />
              <span className="uppercase">Solusi Makan Siang Kantor</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-black leading-none mb-6 tracking-tight">
              DAPUR <br />
              <span className="bg-blue-600 text-white px-2">BU WIKRA.</span>
            </h1>

            <p className="text-xl md:text-2xl text-black font-medium mb-8 leading-relaxed border-l-4 border-black pl-6">
              Catering harian masakan rumahan. <br />
              <b>Murah. Enak. Diantar ke meja Anda.</b>
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() =>
                  document
                    .getElementById("menu")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                LIHAT MENU HARI INI{" "}
                <ArrowRight size={20} strokeWidth={3} className="ml-2" />
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  window.open("https://wa.me/6281234567890", "_blank")
                }
              >
                TANYA HARGA
              </Button>
            </div>
          </div>

          {/* Right Image */}
          <div className="w-full md:w-1/2 relative">
            <div className="relative z-10 border-4 border-black bg-white p-2 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <Image
                src="https://picsum.photos/800/600"
                alt="Masakan Rumahan"
                fill
                className="object-cover border-2 border-black filter grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
            {/* Background Shape */}
            <div className="absolute -top-4 -right-4 w-full h-full bg-blue-600 border-4 border-black z-0"></div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="mt-20 border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 flex flex-wrap justify-between gap-8">
          <div className="text-center flex-1 min-w-[150px]">
            <p className="text-4xl font-black text-blue-600">Rp 15rb</p>
            <p className="font-bold text-black uppercase">Mulai Dari</p>
          </div>
          <div className="w-1 h-16 bg-black hidden md:block"></div>
          <div className="text-center flex-1 min-w-[150px]">
            <p className="text-4xl font-black text-blue-600">500+</p>
            <p className="font-bold text-black uppercase">Porsi/Hari</p>
          </div>
          <div className="w-1 h-16 bg-black hidden md:block"></div>
          <div className="text-center flex-1 min-w-[150px]">
            <p className="text-4xl font-black text-blue-600">GRATIS</p>
            <p className="font-bold text-black uppercase">Ongkir Kantor</p>
          </div>
        </div>
      </div>
    </section>
  );
};
