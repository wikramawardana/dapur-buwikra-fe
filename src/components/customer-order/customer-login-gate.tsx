"use client";

import { ChefHat, Clock, FileText, Lock, Sparkles, Zap } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

interface CustomerLoginGateProps {
  callbackUrl?: string;
}

export function CustomerLoginGate({ callbackUrl }: CustomerLoginGateProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await authClient.signIn.oauth2({
        providerId: "auth",
        callbackURL: callbackUrl || window.location.href,
      });
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false);
    }
  };

  const reasons = [
    {
      icon: Clock,
      title: "Pantau Status Pesanan Real-Time",
      description:
        "Lacak pesanan katering harian Anda mulai dari konfirmasi, persiapan dapur, hingga siap dikirim.",
      color: "bg-blue-100",
    },
    {
      icon: FileText,
      title: "Akses Rekap Tagihan & Invoice",
      description:
        "Riwayat pesanan tersimpan rapi untuk memudahkan pembayaran QRIS dan verifikasi pengantaran.",
      color: "bg-yellow-100",
    },
    {
      icon: Zap,
      title: "Pemesanan Praktis & Cepat",
      description:
        "Data nama dan email Anda otomatis terhubung sehingga Anda tidak perlu mengetik ulang setiap minggu.",
      color: "bg-green-100",
    },
    {
      icon: Lock,
      title: "Aman & Kuota Terjamin",
      description:
        "Menghindari kesalahan pemesanan dan memastikan kuota porsi harian Anda tercatat secara resmi di dapur.",
      color: "bg-purple-100",
    },
  ];

  return (
    <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-10 my-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header Badge & Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-1.5 font-black text-sm uppercase tracking-wide">
            <ChefHat className="h-4 w-4 text-yellow-300" />
            Langkah Cepat Sebelum Memesan
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-black tracking-tight">
            Masuk dengan Akun Google Anda
          </h2>
          <p className="text-base sm:text-lg text-black/70 font-medium max-w-xl mx-auto">
            Hanya butuh satu klik! Masuk untuk melanjutkan pengisian formulir
            pemesanan katering mingguan.
          </p>
        </div>

        {/* Informative Grid: Why Login? */}
        <div className="border-3 border-black bg-[#fdfbf7] p-5 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-black">
            <Sparkles className="h-5 w-5 text-brut-blue" />
            <h3 className="font-black text-base sm:text-lg uppercase tracking-wide text-black">
              Mengapa Anda Perlu Masuk Terlebih Dahulu?
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reasons.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 border-2 border-black bg-white"
                >
                  <div
                    className={`p-2 border-2 border-black ${item.color} shrink-0`}
                  >
                    <Icon className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-black">
                      {item.title}
                    </h4>
                    <p className="text-xs text-black/70 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Big Action Button */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <Button
            type="button"
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full sm:w-auto min-w-[280px] h-14 text-base sm:text-lg font-black bg-yellow-300 hover:bg-yellow-400 text-black border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all rounded-none"
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin" />
                <span>Menghubungkan ke Google...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <GoogleIcon className="w-6 h-6" />
                <span>Lanjut Masuk dengan Google</span>
              </div>
            )}
          </Button>
          <p className="text-xs text-black/50 text-center font-medium">
            Proses masuk aman & instan. Akun Google Anda hanya digunakan untuk
            identitas pesanan.
          </p>
        </div>
      </div>
    </div>
  );
}
