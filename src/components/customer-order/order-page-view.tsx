"use client";

import {
  ArrowLeft,
  ChefHat,
  Copy,
  History,
  Images,
  LogOut,
  Share2,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { CustomerLoginGate } from "@/components/customer-order/customer-login-gate";
import { CustomerOrderForm } from "@/components/customer-order/customer-order-form";
import { WeeklyMenuPreview } from "@/components/customer-order/weekly-menu-preview";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient, useSession } from "@/lib/auth-client";
import {
  generateWeekOptions,
  getDefaultWeek,
  getWeekRange,
} from "@/lib/week-utils";

interface OrderPageViewProps {
  initialWeek?: string;
}

export function OrderPageView({ initialWeek }: OrderPageViewProps) {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();

  const defaultWeek = React.useMemo(() => getDefaultWeek(), []);
  const weekOptions = React.useMemo(() => generateWeekOptions(), []);

  // Determine current active week dateFrom and dateTo
  const { dateFrom: currentWeekStart, dateTo: currentWeekEnd } =
    React.useMemo(() => {
      if (!initialWeek) {
        return defaultWeek;
      }
      try {
        const parsedDate = new Date(`${initialWeek}T00:00:00`);
        if (Number.isNaN(parsedDate.getTime())) {
          return defaultWeek;
        }
        return getWeekRange(parsedDate);
      } catch {
        return defaultWeek;
      }
    }, [initialWeek, defaultWeek]);

  // Handle changing week from dropdown
  const handleWeekChange = (selectedWeekStart: string) => {
    router.push(`/order/${selectedWeekStart}`);
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      window.location.reload();
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  const handleCopyLink = () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/order/${currentWeekStart}`
        : `https://dapurbuwikra.biz.id/order/${currentWeekStart}`;
    navigator.clipboard.writeText(url);
    toast.success("Link formulir pesanan minggu ini berhasil disalin!");
  };

  const handleShareWhatsApp = () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/order/${currentWeekStart}`
        : `https://dapurbuwikra.biz.id/order/${currentWeekStart}`;
    const text = `Halo! Menu katering Dapur Bu Wikra periode ${currentWeekStart} s/d ${currentWeekEnd} sudah dibuka ya 🍱✨\n\nYuk cek menu dan isi pesanan Anda lewat link ini:\n${url}\n\nTerima kasih! 🙏`;
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  const currentCallbackUrl = `/order/${currentWeekStart}`;

  return (
    <div className="min-h-screen bg-[#f7f5f0] font-sans text-black selection:bg-brut-blue selection:text-white pb-20">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 border-b-4 border-black bg-white">
        <div className="container mx-auto flex h-16 sm:h-20 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 font-black text-lg sm:text-2xl tracking-tight text-black hover:text-brut-blue transition-colors"
            >
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center border-2 border-black bg-yellow-300">
                <ChefHat className="h-5 w-5 sm:h-6 sm:w-6 text-black" />
              </div>
              <span className="hidden sm:inline">Dapur Bu Wikra</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/portfolio"
              className="flex items-center gap-1.5 border-2 border-black bg-white px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-100 hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              <Images className="h-4 w-4" />
              <span className="hidden sm:inline">Jejak Rasa</span>
            </Link>

            {session?.user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/orders"
                  className="flex items-center gap-1.5 border-2 border-black bg-blue-300 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-400 hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                >
                  <History className="h-4 w-4" />
                  <span>Pesanan Saya</span>
                </Link>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="h-8 sm:h-9 px-2 sm:px-3 text-xs font-bold border-2 border-black rounded-none bg-white hover:bg-red-50 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  title="Keluar"
                >
                  <LogOut className="h-3.5 w-3.5 sm:mr-1" />
                  <span className="hidden sm:inline">Keluar</span>
                </Button>
              </div>
            ) : (
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(currentCallbackUrl)}`}
                className="flex items-center gap-1.5 border-2 border-black bg-yellow-300 px-3 py-1.5 text-xs sm:text-sm font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-400 transition-all"
              >
                <UserIcon className="h-4 w-4" />
                <span>Masuk</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="container mx-auto max-w-5xl px-4 py-8 sm:py-12 space-y-8">
        {/* Breadcrumb & Share Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black uppercase tracking-wider text-black/70 hover:text-black hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="h-8 px-2.5 sm:px-3 text-xs font-black border-2 border-black rounded-none bg-white hover:bg-yellow-200 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              title="Salin Link Form"
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Salin Link
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShareWhatsApp}
              className="h-8 px-2.5 sm:px-3 text-xs font-black border-2 border-black rounded-none bg-green-300 hover:bg-green-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              title="Bagikan ke WhatsApp"
            >
              <Share2 className="h-3.5 w-3.5 mr-1.5" />
              Bagikan
            </Button>
          </div>
        </div>

        {/* Page Hero Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-yellow-300 border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-wide shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Sparkles className="h-3.5 w-3.5" />
            Formulir Pesanan Pelanggan
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-black tracking-tight leading-tight">
            Pesan Katering Harian &amp; Mingguan
          </h1>
          <p className="text-base sm:text-lg font-medium text-black/70 max-w-2xl">
            Pilih hari pengantaran dan menu favorit Anda. Menu berganti setiap
            minggu dan dimasak fresh setiap pagi!
          </p>
        </div>

        {/* 1. Weekly Menu Preview Banner */}
        <WeeklyMenuPreview
          currentWeekStart={currentWeekStart}
          currentWeekEnd={currentWeekEnd}
          weekOptions={weekOptions}
          onWeekChange={handleWeekChange}
        />

        {/* 2. Login Gate or Order Form based on Session */}
        {isSessionLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <Spinner className="h-8 w-8 text-black" />
            <p className="text-sm font-bold text-black/70">
              Memeriksa sesi login...
            </p>
          </div>
        ) : !session?.user ? (
          <CustomerLoginGate callbackUrl={currentCallbackUrl} />
        ) : (
          <CustomerOrderForm
            user={{
              name: session.user.name,
              email: session.user.email,
            }}
            weekStartDate={currentWeekStart}
            weekEndDate={currentWeekEnd}
          />
        )}
      </main>
    </div>
  );
}
