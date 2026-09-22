import type { Order } from "@/types/order.types";
import { formatCurrency, formatDate } from "./format";
import { calculateOrderPayable } from "./qris";
import { formatDayDisplay } from "./week-utils";

export interface FormattedOrderMessage {
  text: string;
  url: string;
  finalAmount: number;
  uniqueCode: number;
  waUrl: string;
}

/**
 * Generates a polished, friendly WhatsApp message for billing an order
 * including day-by-day menu breakdown, unique payable amount, and direct Dynamic QRIS link.
 */
export function generateOrderWhatsAppMessage(
  order: Order,
  baseUrl?: string,
): FormattedOrderMessage {
  const origin =
    baseUrl ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "https://dapurbuwikra.biz.id");

  // Calculate unpaid total
  const unpaidTotal =
    order.day_orders?.reduce((sum, day) => {
      if (day.payment_status === "paid") return sum;
      return (
        sum +
        (day.items?.reduce((s, item) => s + item.qty * item.unit_price, 0) || 0)
      );
    }, 0) || order.total_price;

  const { finalAmount, uniqueCode } = calculateOrderPayable(
    unpaidTotal,
    order.id,
    false,
  );

  const qrisUrl = `${origin}/payment/qris?order_id=${encodeURIComponent(
    order.id,
  )}&amount=${finalAmount}&name=${encodeURIComponent(order.name)}`;

  // Group items by day
  const dayBlocks: string[] = [];

  for (const day of order.day_orders || []) {
    // Only include unpaid days if partially paid, or all days if completely unpaid
    const dayLabel = formatDayDisplay(day.day, "id");
    let dateStr = "";
    if (day.date) {
      try {
        dateStr = `, ${formatDate(day.date, "dd MMM")}`;
      } catch {
        dateStr = "";
      }
    }

    const header = `📅 *${dayLabel}${dateStr}*`;
    const itemsList = (day.items || [])
      .map((item) => {
        const itemSubtotal = item.qty * item.unit_price;
        return `  • ${item.qty}x ${item.name} (${formatCurrency(itemSubtotal)})`;
      })
      .join("\n");

    if (itemsList) {
      dayBlocks.push(`${header}\n${itemsList}`);
    }
  }

  const itemsContent =
    dayBlocks.length > 0
      ? dayBlocks.join("\n\n")
      : `• Tagihan Pesanan: ${formatCurrency(unpaidTotal)}`;

  let dropOffContent = "";
  if (order.drop_off_location?.trim()) {
    dropOffContent = `\n📍 *Titik Pengantaran:* ${order.drop_off_location.trim()}`;
  }

  let notesContent = "";
  if (order.notes?.trim()) {
    notesContent = `\n📝 *Catatan:* ${order.notes.trim()}`;
  }

  const text = `Halo Kak *${order.name}*! Terima kasih sudah memesan di Dapur Bu Wikra 🍱✨

Berikut rincian pesanan Anda:
───────────────────────
${itemsContent}${dropOffContent}${notesContent}
───────────────────────
💰 *Total Tagihan:* *${formatCurrency(finalAmount)}*

📲 *Link Pembayaran QRIS Dinamis:*
${qrisUrl}

💡 *Petunjuk Pembayaran:*
1. Klik link di atas & scan QRIS menggunakan BCA / Mandiri / SeaBank / GoPay / ShopeePay / Bank apa saja.
2. Nominal akan langsung terisi otomatis sebesar *${formatCurrency(finalAmount)}* (tanpa perlu ketik manual).
3. Setelah transfer berhasil, silakan kirim bukti transfer atau konfirmasi ke WhatsApp ini agar pesanan segera diproses.

Terima kasih banyak & selamat menikmati makanannya! 🙏😊`;

  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

  return {
    text,
    url: qrisUrl,
    finalAmount,
    uniqueCode,
    waUrl,
  };
}
