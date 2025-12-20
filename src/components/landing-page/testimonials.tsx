import { Quote } from "lucide-react";
import type React from "react";
import { NeoCard } from "./neocard";

export const Testimonials: React.FC = () => {
  return (
    <section className="container mx-auto px-4 py-20 max-w-5xl">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-black bg-black text-white inline-block px-4 py-2 transform -rotate-1 shadow-neo">
          KATA TEMEN-TEMEN
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <NeoCard className="bg-brut-blue text-white">
          <Quote size={48} className="mb-4 opacity-50" />
          <p className="text-xl font-bold mb-6 italic">
            "Awalnya iseng nyobain, eh sekarang malah nungguin menu hari ini
            apa. Rasanya rumahan banget, ga micin doang."
          </p>
          <div className="flex items-center gap-4 border-t-2 border-white/30 pt-4">
            <div className="w-12 h-12 bg-white border-2 border-black rounded-full overflow-hidden">
              <img src="https://picsum.photos/100/100?random=5" alt="Avatar" />
            </div>
            <div>
              <div className="font-black">Mas Dimas</div>
              <div className="text-sm opacity-80">Divisi IT</div>
            </div>
          </div>
        </NeoCard>

        <NeoCard className="bg-white">
          <Quote size={48} className="mb-4 text-brut-blue" />
          <p className="text-xl font-bold mb-6 italic">
            "Alhamdulillah cocok. Pedesnya pas, bumbunya ngeresep. Buat makan
            siang di pantry jadi rebutan."
          </p>
          <div className="flex items-center gap-4 border-t-2 border-gray-200 pt-4">
            <div className="w-12 h-12 bg-black border-2 border-black rounded-full overflow-hidden">
              <img src="https://picsum.photos/100/100?random=6" alt="Avatar" />
            </div>
            <div>
              <div className="font-black">Mba Rini</div>
              <div className="text-sm text-gray-600">HRD</div>
            </div>
          </div>
        </NeoCard>
      </div>
    </section>
  );
};
