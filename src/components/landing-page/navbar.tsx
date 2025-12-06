import { Menu, Phone, X } from "lucide-react";
import type React from "react";
import { useState } from "react";

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "BERANDA", href: "#home" },
    { name: "LAYANAN", href: "#features" },
    { name: "MENU KANTOR", href: "#menu" },
  ];

  return (
    <nav className="fixed w-full z-50 bg-white border-b-4 border-black">
      <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 border-2 border-black flex items-center justify-center text-white font-black text-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            W
          </div>
          <span className="text-xl font-black tracking-tighter text-black uppercase">
            Dapur Bu Wikra
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="font-bold text-black hover:bg-blue-200 px-2 py-1 transition-colors border-2 border-transparent hover:border-black"
            >
              {link.name}
            </a>
          ))}
          <a
            href="https://wa.me/6281234567890"
            className="px-5 py-2 font-bold bg-blue-600 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
          >
            <Phone size={18} strokeWidth={3} />
            PESAN SEKARANG
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          className="md:hidden text-black p-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X size={24} strokeWidth={3} />
          ) : (
            <Menu size={24} strokeWidth={3} />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b-4 border-black py-4 px-4 flex flex-col gap-4 md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-black font-bold text-lg hover:underline decoration-4 decoration-blue-500 underline-offset-4"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </a>
          ))}
          <a
            href="https://wa.me/6281234567890"
            className="w-full bg-blue-600 text-white border-2 border-black py-3 text-center font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            HUBUNGI WHATSAPP
          </a>
        </div>
      )}
    </nav>
  );
};
