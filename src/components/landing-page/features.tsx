import { ChefHat, DollarSign, Heart, Truck } from "lucide-react";
import type React from "react";

export const Features: React.FC = () => {
  const features = [
    {
      icon: <ChefHat size={32} strokeWidth={2.5} />,
      title: "MASAKAN RUMAHAN",
      description:
        "Resep asli turun temurun. Rasa otentik seperti masakan ibu di rumah.",
      bgColor: "bg-red-200",
    },
    {
      icon: <Heart size={32} strokeWidth={2.5} />,
      title: "SEHAT & HIGIENIS",
      description:
        "Tanpa MSG berlebih. Bahan segar setiap hari. Dimasak di dapur bersih.",
      bgColor: "bg-blue-200",
    },
    {
      icon: <DollarSign size={32} strokeWidth={2.5} />,
      title: "HARGA KARYAWAN",
      description:
        "Makan enak tidak perlu mahal. Paket hemat mulai Rp 15.000 saja.",
      bgColor: "bg-green-200",
    },
    {
      icon: <Truck size={32} strokeWidth={2.5} />,
      title: "ANTAR TEPAT WAKTU",
      description:
        "Makan siang sampai sebelum jam istirahat. Gratis ongkir area perkantoran.",
      bgColor: "bg-yellow-200",
    },
  ];

  return (
    <section id="features" className="py-24 bg-white border-b-4 border-black">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-3xl mb-16">
          <h2 className="text-4xl md:text-6xl font-black text-black uppercase leading-none mb-6">
            Kenapa Harus <br />{" "}
            <span className="text-blue-600 underline decoration-4 underline-offset-4">
              Dapur Bu Wikra?
            </span>
          </h2>
          <p className="text-xl font-medium text-black border-l-4 border-blue-600 pl-4">
            Kami paham, makan siang kantor itu ribet. Kami membuatnya simpel,
            enak, dan murah.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-white flex flex-col h-full"
            >
              <div
                className={`w-16 h-16 ${feature.bgColor} border-2 border-black flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black`}
              >
                {feature.icon}
              </div>
              <h3 className="text-2xl font-black text-black mb-4 uppercase">
                {feature.title}
              </h3>
              <p className="text-black font-medium leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
