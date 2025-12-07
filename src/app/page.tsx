"use client";

import { useEffect, useState } from "react";

export default function ComingSoonPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-sky-100">
      {/* Neo-brutalism background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large blue circle */}
        <div
          className={`absolute -top-20 -right-20 w-64 h-64 bg-blue-400 border-4 border-black rounded-full transition-all duration-700 ${
            mounted ? "opacity-100 scale-100" : "opacity-0 scale-50"
          }`}
        />
        {/* Yellow square */}
        <div
          className={`absolute top-1/4 -left-10 w-32 h-32 bg-yellow-300 border-4 border-black rotate-12 transition-all duration-700 delay-100 ${
            mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-20"
          }`}
        />
        {/* Pink circle */}
        <div
          className={`absolute bottom-20 left-1/4 w-24 h-24 bg-pink-400 border-4 border-black rounded-full transition-all duration-700 delay-200 ${
            mounted ? "opacity-100 scale-100" : "opacity-0 scale-50"
          }`}
        />
        {/* Green square */}
        <div
          className={`absolute bottom-40 right-10 w-20 h-20 bg-emerald-400 border-4 border-black -rotate-6 transition-all duration-700 delay-300 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
          }`}
        />
        {/* Small blue square */}
        <div
          className={`absolute top-1/2 right-1/4 w-16 h-16 bg-blue-500 border-4 border-black rotate-45 transition-all duration-700 delay-400 ${
            mounted ? "opacity-100 scale-100" : "opacity-0 scale-50"
          }`}
        />
      </div>

      {/* Floating food icons with neo-brutalism style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <span
          className={`absolute top-24 left-[12%] text-4xl transition-all duration-500 ${
            mounted ? "opacity-100 rotate-0" : "opacity-0 -rotate-45"
          }`}
          style={{ transitionDelay: "0.3s" }}
        >
          �
        </span>
        <span
          className={`absolute top-40 right-[18%] text-3xl transition-all duration-500 ${
            mounted ? "opacity-100 rotate-0" : "opacity-0 rotate-45"
          }`}
          style={{ transitionDelay: "0.5s" }}
        >
          �
        </span>
        <span
          className={`absolute bottom-48 left-[15%] text-4xl transition-all duration-500 ${
            mounted ? "opacity-100 rotate-0" : "opacity-0 -rotate-45"
          }`}
          style={{ transitionDelay: "0.7s" }}
        >
          �
        </span>
        <span
          className={`absolute bottom-36 right-[20%] text-3xl transition-all duration-500 ${
            mounted ? "opacity-100 rotate-0" : "opacity-0 rotate-45"
          }`}
          style={{ transitionDelay: "0.9s" }}
        >
          �
        </span>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        {/* Logo card - Neo-brutalism style */}
        <div
          className={`mb-6 transition-all duration-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"
          }`}
        >
          <div
            className="inline-flex items-center justify-center w-28 h-28 bg-blue-500 border-4 border-black rounded-2xl"
            style={{ boxShadow: "8px 8px 0px 0px #000000" }}
          >
            <span className="text-6xl">👩‍🍳</span>
          </div>
        </div>

        {/* Title - Bold Neo-brutalism style */}
        <h1
          className={`mb-3 text-5xl md:text-7xl font-black text-black uppercase tracking-tight transition-all duration-500 delay-100 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
          style={{ textShadow: "4px 4px 0px #3B82F6" }}
        >
          Dapur Buwikra
        </h1>

        {/* Subtitle */}
        <p
          className={`mb-8 text-xl md:text-2xl font-bold text-black transition-all duration-500 delay-200 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          Homemade Food with Love ❤️
        </p>

        {/* Coming Soon Badge - Neo-brutalism */}
        <div
          className={`mb-8 transition-all duration-500 delay-300 ${
            mounted ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
        >
          <span
            className="inline-flex items-center gap-3 px-8 py-4 text-xl font-black text-black uppercase bg-yellow-300 border-4 border-black"
            style={{ boxShadow: "6px 6px 0px 0px #000000" }}
          >
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-black"></span>
            </span>
            Coming Soon
          </span>
        </div>

        {/* Description card */}
        <div
          className={`mb-10 transition-all duration-500 delay-400 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div
            className="max-w-md p-6 bg-white border-4 border-black"
            style={{ boxShadow: "6px 6px 0px 0px #000000" }}
          >
            <p className="text-lg font-medium text-black leading-relaxed">
              Kami sedang menyiapkan sesuatu yang spesial untuk Anda.
              <br />
              <span className="font-bold">
                Platform pemesanan makanan rumahan terbaik akan segera hadir!
              </span>
            </p>
          </div>
        </div>

        {/* WhatsApp Button - Neo-brutalism */}
        <div
          className={`transition-all duration-500 delay-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <a
            href="https://wa.me/6285782015780"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 font-black text-lg text-black uppercase bg-emerald-400 border-4 border-black transition-all duration-150 hover:translate-x-1 hover:translate-y-1"
            style={{ boxShadow: "6px 6px 0px 0px #000000" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "2px 2px 0px 0px #000000";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "6px 6px 0px 0px #000000";
            }}
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Hubungi via WhatsApp
          </a>
        </div>

        {/* Footer */}
        <p
          className={`absolute bottom-6 text-sm font-bold text-black transition-all duration-500 delay-700 ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
        >
          © 2024 Dapur Buwikra. All rights reserved.
        </p>
      </div>
    </main>
  );
}
