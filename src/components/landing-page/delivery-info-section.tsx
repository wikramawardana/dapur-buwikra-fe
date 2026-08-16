"use client";

import { Clock, MapPin, MessageCircle, ShieldCheck, Truck } from "lucide-react";

export function DeliveryInfoSection() {
  const handleRequestOfficeWhatsApp = () => {
    const text =
      "Halo Dapur Bu Wikra! 🍱 Saya mau tanya untuk pembukaan rute katering baru ke kantor saya. Lokasi kantor: ";
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  return (
    <section
      id="area-section"
      className="scroll-mt-16 bg-[#faf9f5] border-b-4 border-black py-16 sm:py-24"
    >
      <div className="container mx-auto max-w-6xl px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 bg-blue-300 border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <MapPin className="h-4 w-4" />
            Cakupan Wilayah
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight">
            Area Layanan &amp; Ketentuan Antar
          </h2>
          <p className="text-base sm:text-lg font-medium text-black/70">
            Demi menjaga suhu dan kesegaran masakan, pengiriman saat ini kami
            fokuskan di lingkungan area kantor tertentu.
          </p>
        </div>

        {/* Main Grid: Coverage Details & Open Route Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: 3 Delivery Highlights */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-4">
            <div className="border-4 border-black bg-white p-6 sm:p-7 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 border-3 border-black bg-yellow-300 text-black flex items-center justify-center shrink-0 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-black mb-1">
                    Lingkungan Kantor &amp; Gedung Terdaftar
                  </h3>
                  <p className="text-sm sm:text-base font-medium text-black/70 leading-relaxed">
                    Pengantaran katering dilayani khusus untuk area kantor yang
                    telah ditentukan agar kurir kami tiba serempak dan tepat
                    waktu.
                  </p>
                </div>
              </div>

              <div className="border-t-2 border-black/10 pt-4 flex items-start gap-4">
                <div className="w-12 h-12 border-3 border-black bg-green-300 text-black flex items-center justify-center shrink-0 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-black mb-1">
                    Jadwal Antar: 11:00 – 11:45 WIB
                  </h3>
                  <p className="text-sm sm:text-base font-medium text-black/70 leading-relaxed">
                    Makanan tiba dalam keadaan fresh dan hangat sebelum jam
                    istirahat makan siang dimulai.
                  </p>
                </div>
              </div>

              <div className="border-t-2 border-black/10 pt-4 flex items-start gap-4">
                <div className="w-12 h-12 border-3 border-black bg-blue-300 text-black flex items-center justify-center shrink-0 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-black mb-1">
                    Drop Point Fleksibel
                  </h3>
                  <p className="text-sm sm:text-base font-medium text-black/70 leading-relaxed">
                    Pesanan dapat diantar langsung ke pantry lantai Anda, lobi
                    resepsionis, atau meja kerja sesuai catatan saat pemesanan.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Request New Office Route Card */}
          <div className="lg:col-span-5 border-4 border-black bg-black text-white p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-block bg-yellow-300 text-black px-3 py-1 text-xs font-black uppercase border-2 border-white">
                💡 Belum Terdaftar?
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                Mau Buka Rute Baru untuk Kantor Kamu?
              </h3>
              <p className="text-sm sm:text-base font-medium text-white/80 leading-relaxed">
                Punya grup kantor atau tim kerja yang ingin makan siang bareng
                bebas micin? Hubungi kami untuk mendaftarkan gedung/kantor Anda
                ke rute kurir harian Dapur Bu Wikra.
              </p>

              <div className="bg-white/10 border-2 border-white/30 p-3.5 space-y-1 text-xs font-bold text-white/90">
                <p>✓ Minimal pesanan fleksibel untuk grup</p>
                <p>✓ Bebas ongkir untuk gedung rute aktif</p>
                <p>✓ Jadwal pengantaran terkoordinasi</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRequestOfficeWhatsApp}
              className="w-full flex items-center justify-center gap-2 border-3 border-white bg-green-400 hover:bg-green-500 text-black py-3.5 px-4 font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Daftarkan Kantor via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
