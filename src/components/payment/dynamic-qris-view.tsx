"use client";

import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Copy,
  Download,
  Loader2,
  QrCode,
  RotateCcw,
  ScanLine,
  Send,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import {
  calculateOrderPayable,
  DEFAULT_STATIC_QRIS,
  generateDynamicQRIS,
  generateQRISDataUrl,
} from "@/lib/qris";
import { getOrderById, requestPaymentReview } from "@/services/orders.service";

const SESSION_DURATION_SECONDS = 30 * 60; // 30 minutes

interface DynamicQrisViewProps {
  initialOrderId?: string;
  initialAmount?: number;
  initialCustomerName?: string;
}

export function DynamicQrisView({
  initialOrderId,
  initialAmount,
  initialCustomerName,
}: DynamicQrisViewProps) {
  const searchParams = useSearchParams();

  const queryOrderId = searchParams.get("order_id") || initialOrderId || "";
  const queryName = searchParams.get("name") || initialCustomerName || "";
  const rawAmountParam = searchParams.get("amount");
  const parsedQueryAmount = rawAmountParam
    ? Number.parseInt(rawAmountParam, 10)
    : initialAmount;

  const initialPayable = React.useMemo(() => {
    if (parsedQueryAmount && parsedQueryAmount > 0) {
      return calculateOrderPayable(parsedQueryAmount, queryOrderId, false);
    }
    return { finalAmount: 0, uniqueCode: 0 };
  }, [parsedQueryAmount, queryOrderId]);

  const [customAmount, setCustomAmount] = React.useState<string>(
    parsedQueryAmount && parsedQueryAmount > 0
      ? parsedQueryAmount.toString()
      : "",
  );
  const [activeAmount, setActiveAmount] = React.useState<number | null>(
    initialPayable.finalAmount > 0 ? initialPayable.finalAmount : null,
  );
  const [activeUniqueCode, setActiveUniqueCode] = React.useState<number>(
    initialPayable.uniqueCode,
  );

  const [qrDataUrl, setQrDataUrl] = React.useState<string>("");
  const [isGeneratingQr, setIsGeneratingQr] = React.useState<boolean>(false);
  const [reviewRequested, setReviewRequested] = React.useState(false);
  const [isRequestingReview, setIsRequestingReview] = React.useState(false);
  const [orderReady, setOrderReady] = React.useState(!queryOrderId);
  const [orderError, setOrderError] = React.useState<string | null>(null);
  const [isOrderPaid, setIsOrderPaid] = React.useState(false);
  const [showStaticFallback, setShowStaticFallback] =
    React.useState<boolean>(false);

  // 30-minute session countdown timer
  const [timeLeft, setTimeLeft] = React.useState<number>(
    SESSION_DURATION_SECONDS,
  );

  const isExpired = timeLeft <= 0;

  React.useEffect(() => {
    if (!queryOrderId) return;
    let active = true;
    setOrderReady(false);
    setOrderError(null);
    setQrDataUrl("");
    getOrderById(queryOrderId)
      .then(({ data: order }) => {
        if (!active) return;
        const remaining = order.day_orders.reduce(
          (sum, day) =>
            sum +
            (day.payment_status === "paid"
              ? 0
              : day.items.reduce(
                  (itemSum, item) => itemSum + item.qty * item.unit_price,
                  0,
                )),
          0,
        );
        setIsOrderPaid(order.payment_status === "paid" || remaining <= 0);
        setReviewRequested(!!order.payment_review_requested_at);
        setActiveAmount(
          remaining > 0
            ? calculateOrderPayable(remaining, order.id, false).finalAmount
            : null,
        );
        setCustomAmount(remaining > 0 ? String(remaining) : "");
        setOrderReady(true);
      })
      .catch(() => {
        if (active)
          setOrderError(
            "Pesanan tidak dapat dimuat. Buka Pesanan Saya untuk melihat status terbaru.",
          );
      });
    return () => {
      active = false;
    };
  }, [queryOrderId]);

  // Countdown effect
  React.useEffect(() => {
    if (!orderReady || showStaticFallback || !activeAmount || isExpired) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [orderReady, showStaticFallback, activeAmount, isExpired]);

  // Generate QR code when activeAmount changes or static fallback toggles
  React.useEffect(() => {
    let isCancelled = false;

    async function loadQR() {
      if (!orderReady || isOrderPaid || orderError) return;
      setIsGeneratingQr(true);
      try {
        if (showStaticFallback || !activeAmount || activeAmount <= 0) {
          const url = await generateQRISDataUrl(DEFAULT_STATIC_QRIS, 400);
          if (!isCancelled) setQrDataUrl(url);
        } else {
          const dynamicPayload = generateDynamicQRIS(activeAmount);
          const url = await generateQRISDataUrl(dynamicPayload, 400);
          if (!isCancelled) setQrDataUrl(url);
        }
      } catch (err) {
        console.error("Failed to generate QR code:", err);
        toast.error("Gagal membuat kode QR");
      } finally {
        if (!isCancelled) setIsGeneratingQr(false);
      }
    }

    loadQR();
    return () => {
      isCancelled = true;
    };
  }, [activeAmount, showStaticFallback, orderReady, isOrderPaid, orderError]);

  const handleApplyCustomAmount = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = Number.parseInt(customAmount.replace(/[^0-9]/g, ""), 10);
    if (!cleanNum || cleanNum <= 0) {
      toast.error("Masukkan nominal yang valid");
      return;
    }
    setActiveAmount(cleanNum);
    setActiveUniqueCode(0);
    setShowStaticFallback(false);
    setTimeLeft(SESSION_DURATION_SECONDS);
    toast.success(`QRIS dinamis dibuat untuk ${formatCurrency(cleanNum)}`);
  };

  const handleRefreshSession = () => {
    setTimeLeft(SESSION_DURATION_SECONDS);
    toast.info("Sesi pembayaran dan QRIS telah diperbarui.");
  };

  const handlePaymentNotice = async () => {
    if (
      !queryOrderId ||
      !orderReady ||
      isOrderPaid ||
      isRequestingReview ||
      reviewRequested
    )
      return;
    setIsRequestingReview(true);
    try {
      await requestPaymentReview(queryOrderId);
      setReviewRequested(true);
      toast.success(
        "Konfirmasi terkirim. Admin akan memeriksa pembayaran Anda.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal mengirim konfirmasi pembayaran",
      );
    } finally {
      setIsRequestingReview(false);
    }
  };

  const handleCopyAmount = () => {
    if (!activeAmount) return;
    navigator.clipboard.writeText(activeAmount.toString());
    toast.success(`Nominal ${formatCurrency(activeAmount)} berhasil disalin!`);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qris-dapurbuwikra-${activeAmount || "statis"}.png`;
    a.click();
    toast.success("Kode QR berhasil diunduh!");
  };

  const handleWhatsAppConfirm = () => {
    const nominalText = activeAmount ? formatCurrency(activeAmount) : "pesanan";
    const orderText = queryOrderId ? ` (ID: ${queryOrderId})` : "";
    const nameText = queryName ? ` a.n ${queryName}` : "";
    const message = `Halo Dapur Bu Wikra! Saya ingin konfirmasi pembayaran QRIS untuk${nameText}${orderText} sebesar ${nominalText}. Berikut bukti transfernya:\n`;
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  if (queryOrderId && (!orderReady || isOrderPaid || orderError)) {
    return (
      <div className="mx-auto max-w-xl border-4 border-black bg-white p-8 text-center shadow-[8px_8px_0_0_#000]">
        <h1 className="text-2xl font-black">
          {orderError
            ? "Pesanan Tidak Tersedia"
            : isOrderPaid
              ? "Pesanan Sudah Lunas"
              : "Memuat Pesanan..."}
        </h1>
        <p className="mt-3 text-sm font-medium text-black/70">
          {orderError ||
            (isOrderPaid
              ? "Pembayaran pesanan ini sudah diverifikasi oleh admin."
              : "Memeriksa nominal dan status pesanan Anda.")}
        </p>
        <Link
          href="/orders"
          className="mt-6 inline-block border-2 border-black bg-yellow-300 px-5 py-3 font-bold"
        >
          Lihat Pesanan Saya
        </Link>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-xl">
      <Link
        href={queryOrderId ? "/orders" : "/"}
        className="mb-6 inline-flex items-center gap-2 border-2 border-black bg-white px-4 py-2 text-sm font-black shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000]"
      >
        <ArrowLeft className="size-4" />
        {queryOrderId ? "Kembali ke Pesanan" : "Kembali ke Beranda"}
      </Link>

      <section className="border-4 border-black bg-white shadow-[10px_10px_0_0_#000]">
        {/* Header */}
        <header
          className={`border-b-4 border-black px-6 py-6 text-center text-white transition-colors ${
            isExpired ? "bg-red-600" : "bg-brut-blue"
          }`}
        >
          <div className="mx-auto mb-3 flex size-14 items-center justify-center border-3 border-black bg-white text-black shadow-[4px_4px_0_0_#000]">
            {isExpired ? (
              <Clock className="size-8 text-red-600" />
            ) : (
              <ScanLine className="size-8 text-brut-blue" strokeWidth={2.5} />
            )}
          </div>
          <p className="text-xs font-black tracking-[0.25em] uppercase opacity-90">
            Dapur Bu Wikra
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-black uppercase tracking-tight">
            {isExpired ? "Sesi Pembayaran Berakhir" : "Pembayaran QRIS"}
          </h1>
          {queryName && (
            <p className="mt-1 text-xs sm:text-sm font-semibold opacity-90">
              Atas Nama: <span className="underline">{queryName}</span>
            </p>
          )}
        </header>

        <div className="p-5 sm:p-7 space-y-6">
          <div className="border-2 border-black bg-amber-50 p-4 text-sm font-semibold text-amber-950">
            {reviewRequested
              ? "Konfirmasi pembayaran sudah dikirim. Status akan tetap Belum Lunas sampai admin memeriksa transaksi."
              : "Setelah membayar, klik Saya Sudah Bayar. Pembayaran diperiksa manual oleh admin sebelum status berubah menjadi Lunas."}
          </div>
          {/* AMOUNT & TIMER BAR */}
          {activeAmount && !showStaticFallback ? (
            <div className="border-3 border-black bg-[#fef08a] p-4 sm:p-5 shadow-[4px_4px_0_0_#000]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-black/70 tracking-wider">
                      Nominal QRIS
                    </span>
                    {activeUniqueCode > 0 && (
                      <span className="rounded bg-black px-1.5 py-0.5 text-[10px] font-black text-yellow-300">
                        +Kode Verifikasi Rp {activeUniqueCode}
                      </span>
                    )}
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-black">
                    {formatCurrency(activeAmount)}
                  </div>
                  {queryOrderId && (
                    <p className="text-xs font-mono font-semibold text-black/60 mt-0.5">
                      ID: {queryOrderId}
                      {activeUniqueCode > 0 && parsedQueryAmount && (
                        <span className="ml-1 text-black/80 font-bold">
                          (Menu: {formatCurrency(parsedQueryAmount)} + Kode: Rp{" "}
                          {activeUniqueCode})
                        </span>
                      )}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* COUNTDOWN TIMER BADGE */}
                  <div
                    className={`inline-flex items-center gap-1.5 border-2 border-black px-3 py-1.5 text-xs font-black shadow-[2px_2px_0_0_#000] ${
                      isExpired
                        ? "bg-red-500 text-white"
                        : timeLeft < 300
                          ? "bg-amber-400 text-black animate-pulse"
                          : "bg-white text-black"
                    }`}
                    title="Batas waktu pembayaran"
                  >
                    <Clock className="size-3.5" />
                    <span>
                      {isExpired
                        ? "Kedaluwarsa"
                        : formatTimeRemaining(timeLeft)}
                    </span>
                  </div>

                  <Button
                    type="button"
                    onClick={handleCopyAmount}
                    variant="outline"
                    className="border-2 border-black bg-white text-black font-black text-xs shadow-[2px_2px_0_0_#000] hover:bg-yellow-200 rounded-none"
                  >
                    <Copy className="size-3.5 mr-1.5" />
                    Salin
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* MANUAL NOMINAL INPUT IF ACCESSED DIRECTLY */
            <form
              onSubmit={handleApplyCustomAmount}
              className="border-3 border-black bg-white p-4 shadow-[4px_4px_0_0_#000] space-y-3"
            >
              <div className="flex items-center justify-between">
                <label
                  htmlFor="custom-amount-input"
                  className="text-xs font-black uppercase text-black"
                >
                  Masukkan Nominal Tagihan
                </label>
                <button
                  type="button"
                  onClick={() => setShowStaticFallback(!showStaticFallback)}
                  className="text-xs font-bold text-brut-blue underline"
                >
                  {showStaticFallback
                    ? "Beralih ke QRIS Dinamis"
                    : "Gunakan QRIS Statis"}
                </button>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-sm font-black text-black/50">
                    Rp
                  </span>
                  <Input
                    id="custom-amount-input"
                    type="number"
                    placeholder="Contoh: 45000"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="pl-10 font-black border-2 border-black rounded-none shadow-[2px_2px_0_0_#000]"
                  />
                </div>
                <Button
                  type="submit"
                  className="border-2 border-black bg-brut-blue text-white font-black text-xs shadow-[2px_2px_0_0_#000] hover:bg-blue-700 rounded-none px-4"
                >
                  Buat QR
                </Button>
              </div>
            </form>
          )}

          {/* QR CODE CONTAINER */}
          <div className="relative mx-auto max-w-[340px] border-4 border-black bg-white p-4 shadow-[6px_6px_0_0_#2563eb] text-center">
            <div className="relative aspect-square w-full flex items-center justify-center bg-white">
              {isGeneratingQr ? (
                <div className="flex flex-col items-center justify-center gap-2 text-black/70">
                  <Loader2 className="size-10 animate-spin text-brut-blue" />
                  <p className="text-xs font-bold">Menyiapkan QRIS...</p>
                </div>
              ) : qrDataUrl ? (
                <div className="relative h-full w-full">
                  <img
                    src={qrDataUrl}
                    alt={`QRIS Dapur Bu Wikra ${
                      activeAmount ? formatCurrency(activeAmount) : "Statis"
                    }`}
                    className={`h-full w-full object-contain transition-all ${
                      isExpired ? "blur-[2px] grayscale opacity-40" : ""
                    }`}
                  />

                  {/* EXPIRED OVERLAY */}
                  {isExpired && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 p-4 text-center">
                      <AlertCircle className="size-10 text-red-600" />
                      <div>
                        <p className="font-black text-sm text-red-600 uppercase">
                          Sesi Berakhir
                        </p>
                        <p className="text-xs font-medium text-black/70 mt-0.5">
                          Batas waktu pembayaran 30 menit telah terlewati.
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={handleRefreshSession}
                        className="border-2 border-black bg-yellow-300 text-black font-black text-xs shadow-[3px_3px_0_0_#000] hover:bg-yellow-400 rounded-none"
                      >
                        <RotateCcw className="size-3.5 mr-1.5" />
                        Perbarui QRIS
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-black/60">
                  <QrCode className="size-16 opacity-30" />
                  <p className="text-xs font-semibold mt-2">
                    QR Code tidak tersedia
                  </p>
                </div>
              )}
            </div>

            {/* DYNAMIC BADGE */}
            <div className="mt-3 border-t-2 border-black pt-2 flex items-center justify-between text-[11px] font-black uppercase text-black/70">
              <span>{showStaticFallback ? "QRIS Statis" : "QRIS Dinamis"}</span>
              <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                <ShieldCheck className="size-3.5" />
                Resmi Bank Indonesia
              </span>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {queryOrderId && (
              <Button
                type="button"
                onClick={handlePaymentNotice}
                disabled={isRequestingReview || reviewRequested}
                className="h-11 border-2 border-black bg-yellow-300 text-black hover:bg-yellow-400 font-black rounded-none sm:col-span-2"
              >
                {isRequestingReview
                  ? "Mengirim..."
                  : reviewRequested
                    ? "Menunggu Verifikasi Admin"
                    : "Saya Sudah Bayar"}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadQr}
              disabled={isExpired}
              className="h-11 border-2 border-black bg-white text-black font-black text-xs shadow-[3px_3px_0_0_#000] hover:bg-black/5 rounded-none disabled:opacity-50"
            >
              <Download className="size-4 mr-2" />
              Unduh Kode QR
            </Button>
            <Button
              type="button"
              onClick={handleWhatsAppConfirm}
              className="h-11 border-2 border-black bg-[#25D366] text-black hover:bg-[#20bd5a] font-black text-xs shadow-[3px_3px_0_0_#000] rounded-none"
            >
              <Send className="size-4 mr-2" />
              Kirim Bukti via WA
            </Button>
          </div>

          {/* INSTRUCTION CARD */}
          <div className="border-2 border-black bg-gray-50 p-4 text-xs font-medium space-y-2 text-black/80">
            <p className="font-black uppercase text-black">
              Petunjuk Pembayaran:
            </p>
            <ol className="list-decimal pl-4 space-y-1 leading-relaxed">
              <li>
                Buka aplikasi m-Banking atau e-Wallet (BCA, Mandiri, ShopeePay,
                GoPay, OVO, Dana, Seabank, dll).
              </li>
              <li>
                Pilih menu <strong>Scan / Bayar QRIS</strong> lalu arahkan
                kamera ke kode QR di atas.
              </li>
              {activeAmount && !showStaticFallback ? (
                <li>
                  Nominal{" "}
                  <strong className="text-black">
                    {formatCurrency(activeAmount)}
                  </strong>{" "}
                  akan <strong>muncul otomatis</strong> tanpa perlu diketik
                  manual.
                </li>
              ) : (
                <li>
                  Masukkan nominal pesanan Anda secara manual lalu konfirmasi
                  nama merchant <strong>DapurBuWikra</strong>.
                </li>
              )}
              <li>
                Selesaikan pembayaran dengan PIN Anda, lalu klik
                <strong> Saya Sudah Bayar</strong> dan kirim bukti lewat
                WhatsApp jika diperlukan. Admin akan memeriksa transaksi sebelum
                menandai pesanan lunas.
              </li>
            </ol>
          </div>

          <div className="flex items-center justify-center gap-2 text-center text-xs font-bold text-black/60 pt-2 border-t border-black/10">
            <ShieldCheck className="size-4 text-brut-blue" />
            Halaman Pembayaran Resmi Dapur Bu Wikra
          </div>
        </div>
      </section>
    </div>
  );
}
