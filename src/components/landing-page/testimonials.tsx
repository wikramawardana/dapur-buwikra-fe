import { Quote } from "lucide-react";
import type React from "react";
import type { Testimonial } from "@/types/landing-page";

export const Testimonials: React.FC = () => {
  const reviews: Testimonial[] = [
    {
      id: 1,
      name: "Sari Handayani",
      role: "HR Manager",
      company: "PT Teknologi Maju",
      text: "Sejak langganan Dapur Bu Wikra, karyawan jadi jarang telat balik istirahat siang. Makanannya enak, bersih, dan variatif banget menunya.",
      avatar: "https://picsum.photos/100/100?random=5",
    },
    {
      id: 2,
      name: "Budi Santoso",
      role: "Senior Developer",
      company: "Startup Kita",
      text: "Ayam bakarnya juara! Harganya juga masuk akal banget buat budget anak kost yang kerja di SCBD. Fitur AI Plannernya membantu banget pas lagi bosen.",
      avatar: "https://picsum.photos/100/100?random=6",
    },
    {
      id: 3,
      name: "Linda Kusuma",
      role: "Admin Staff",
      company: "Bank Nasional",
      text: "Pengiriman selalu tepat waktu. Kemasannya rapi dan higienis. Rasanya beneran kayak masakan ibu di rumah. Sangat recommended!",
      avatar: "https://picsum.photos/100/100?random=7",
    },
  ];

  return (
    <section
      id="testimonials"
      className="py-20 bg-orange-900 text-white relative overflow-hidden"
    >
      {/* Abstract Shapes */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-orange-800 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/3 translate-y-1/3"></div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4">
            Kata Mereka
          </h2>
          <p className="text-orange-200">
            Bergabunglah dengan ratusan karyawan kantor yang sudah menikmati
            lezatnya Dapur Bu Wikra.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:bg-white/15 transition-colors"
            >
              <Quote className="text-orange-400 mb-6" size={32} />
              <p className="text-lg leading-relaxed mb-6 italic">
                "{review.text}"
              </p>
              <div className="flex items-center gap-4">
                <img
                  src={review.avatar}
                  alt={review.name}
                  className="w-12 h-12 rounded-full border-2 border-orange-400 object-cover"
                />
                <div>
                  <h4 className="font-bold text-white">{review.name}</h4>
                  <p className="text-sm text-orange-200">
                    {review.role}, {review.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
