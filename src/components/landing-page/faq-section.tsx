"use client";

import { HelpCircle, MessageSquareQuote } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    question: "Apakah harus pesan 1 minggu penuh atau bisa harian?",
    answer:
      "Sangat fleksibel! Anda bebas memilih hari katering yang diinginkan saat mengisi formulir — bisa hanya 1 hari (misal hari Rabu saja), beberapa hari pilihan, atau langsung satu minggu penuh.",
  },
  {
    question: "Kapan batas waktu pemesanan katering mingguan (cut-off)?",
    answer:
      "Formulir pemesanan dibuka setiap akhir pekan hingga H-1 sebelum hari pengantaran. Hal ini penting agar tim dapur dapat berbelanja bahan-bahan segar pilihan di pasar pada dini hari.",
  },
  {
    question: "Bagaimana cara melakukan pembayaran?",
    answer:
      "Setelah mengisi menu pesanan di formulir, Anda dapat langsung melakukan pembayaran praktis via QRIS otomatis atau transfer bank yang tertera.",
  },
  {
    question: "Apakah masakan benar-benar 100% bebas micin / MSG?",
    answer:
      "Ya, 100% tanpa MSG sintetis dan tanpa bahan pengawet. Kami mengandalkan kaldu murni buatan sendiri, tumisan bawang segar, rempah-rempah nusantara, dan garam berkualitas untuk rasa gurih alami yang mantap dan sehat.",
  },
  {
    question: "Bagaimana jika saya memiliki alergi atau pantangan makanan?",
    answer:
      "Anda dapat menuliskan rincian alergi atau pantangan (misal: tanpa seafood, kurangi pedas, dll) di kolom 'Catatan Khusus' saat mengisi formulir pemesanan.",
  },
  {
    question:
      "Bagaimana jika gedung/kantor saya belum ada di daftar titik antar?",
    answer:
      "Anda dapat menghubungi kami melalui WhatsApp untuk mendaftarkan kantor atau gedung Anda. Jika ada minimal pemesanan grup, kurir kami siap membuka rute harian baru ke gedung Anda!",
  },
];

export function FaqSection() {
  return (
    <section className="bg-[#fff8eb] border-b-4 border-black py-16 sm:py-24">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Section Header */}
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 bg-yellow-300 border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <HelpCircle className="h-4 w-4" />
            Tanya Jawab
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-base sm:text-lg font-medium text-black/70">
            Punya pertanyaan seputar katering Dapur Bu Wikra? Temukan jawabannya
            di bawah ini.
          </p>
        </div>

        {/* Accordion Container */}
        <div className="border-4 border-black bg-white p-4 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <Accordion type="single" collapsible className="w-full space-y-3">
            {FAQS.map((faq, index) => (
              <AccordionItem
                key={faq.question}
                value={`faq-${index}`}
                className="border-2 border-black bg-[#faf9f5] px-4 py-1 data-[state=open]:bg-yellow-50 transition-colors"
              >
                <AccordionTrigger className="text-left font-black text-base sm:text-lg text-black hover:no-underline py-3">
                  <span>{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base font-medium text-black/80 leading-relaxed pt-1 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Still Have Questions Box */}
        <div className="mt-8 p-5 border-3 border-black bg-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-3">
            <MessageSquareQuote className="h-8 w-8 text-black shrink-0" />
            <div>
              <p className="font-black text-sm sm:text-base text-black">
                Masih ada pertanyaan lain?
              </p>
              <p className="text-xs sm:text-sm font-medium text-black/70">
                Tim admin kami siap membantu Anda setiap hari.
              </p>
            </div>
          </div>
          <a
            href="https://api.whatsapp.com/send?text=Halo%20Dapur%20Bu%20Wikra,%20saya%20ingin%20tanya%20seputar%20katering"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 border-2 border-black bg-green-400 hover:bg-green-500 text-black px-4 py-2 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all shrink-0"
          >
            Tanya via WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
