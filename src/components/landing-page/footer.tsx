import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import type React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white pt-16 pb-8 border-t-8 border-blue-600">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-6">
            <h2 className="text-3xl font-black uppercase text-blue-500">
              Dapur Bu Wikra
            </h2>
            <p className="text-gray-300 font-medium leading-relaxed max-w-xs">
              Katering rumahan premium untuk makan siang kantor. Tanpa ribet,
              pasti kenyang.
            </p>
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 border-2 border-white flex items-center justify-center hover:bg-white hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(37,99,235,1)]"
              >
                <Instagram size={24} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 border-2 border-white flex items-center justify-center hover:bg-white hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(37,99,235,1)]"
              >
                <Facebook size={24} />
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-black text-xl mb-6 uppercase text-blue-500">
              Kontak
            </h4>
            <ul className="space-y-4 font-bold">
              <li className="flex items-start gap-3">
                <MapPin
                  size={24}
                  className="text-blue-500 mt-1 flex-shrink-0"
                />
                <span>
                  Jl. Masakan Enak No. 12,
                  <br />
                  Jakarta Selatan
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={24} className="text-blue-500 flex-shrink-0" />
                <span>+62 812-3456-7890</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={24} className="text-blue-500 flex-shrink-0" />
                <span>pesan@dapurbuwikra.com</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-2 bg-blue-900 border-2 border-blue-500 p-8 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]">
            <h4 className="font-black text-2xl mb-4 uppercase text-white">
              Dapat Diskon Karyawan?
            </h4>
            <p className="mb-6 font-medium text-blue-200">
              Masukkan email kantor Anda untuk mendapatkan penawaran khusus
              langganan corporate.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="email@kantor.com"
                className="bg-white text-black border-4 border-black px-4 py-3 w-full font-bold outline-none focus:translate-x-[2px] focus:translate-y-[2px] transition-transform"
              />
              <button
                type="button"
                className="bg-blue-500 text-black px-6 py-3 font-black border-4 border-black hover:bg-white transition-colors uppercase whitespace-nowrap shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                Gabung
              </button>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-mono text-gray-500">
          <p>&copy; {new Date().getFullYear()} Dapur Bu Wikra. EST. 2024.</p>
          <p>DESIGNED WITH NEO-BRUTALISM.</p>
        </div>
      </div>
    </footer>
  );
};
