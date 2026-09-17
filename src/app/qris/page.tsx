import type { Metadata } from "next";
import { Suspense } from "react";
import { DynamicQrisView } from "@/components/payment/dynamic-qris-view";
import { Spinner } from "@/components/ui/spinner";

export const metadata: Metadata = {
  title: "Pembayaran QRIS | Dapur Bu Wikra",
  description: "Halaman pembayaran QRIS resmi Dapur Bu Wikra.",
};

export default function QrisPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-brut-bg px-4 py-8 text-brut-black sm:py-12">
      <div className="pointer-events-none absolute top-12 left-8 hidden h-16 w-16 rotate-12 border-4 border-black bg-brut-blue md:block" />
      <div className="pointer-events-none absolute top-28 right-12 hidden h-10 w-10 rotate-45 bg-black md:block" />
      <div className="pointer-events-none absolute bottom-20 left-16 hidden h-5 w-24 bg-black md:block" />

      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center">
            <Spinner className="h-10 w-10 text-black" />
          </div>
        }
      >
        <DynamicQrisView />
      </Suspense>
    </main>
  );
}
