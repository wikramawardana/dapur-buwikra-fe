import { format } from "date-fns";
import QRCode from "qrcode";
import { formatCurrency } from "./format";

// ── Types ──────────────────────────────────────────────────────────────
interface OrderMenuItem {
  name: string;
  qty: number;
  unit_price: number;
}

interface DayOrder {
  day: string;
  date: string;
  items: OrderMenuItem[];
  payment_status?: "paid" | "unpaid";
}

type PaymentStatus = "paid" | "unpaid" | "partial";

interface InvoiceOrder {
  id: string;
  name: string;
  email?: string;
  day_orders: DayOrder[];
  total_price: number;
  notes: string;
  drop_off_location?: string;
  payment_status: PaymentStatus;
  created_at: string;
}

interface PaymentTotals {
  paid: number;
  unpaid: number;
}

// ── Constants ──────────────────────────────────────────────────────────
// Static merchant QRIS embedded in the invoice. Must be browser-readable
// (NEXT_PUBLIC_) since this runs on the client. Keep in sync with the
// server-side QRIS_SOURCE_URL used by the /qris page.
const QRIS_SOURCE_URL =
  process.env.NEXT_PUBLIC_QRIS_SOURCE_URL ||
  "https://static.wikra.cloud/payment/qris-dapurbuwikra.png";

const W = 600; // canvas width
const PAD = 32;
const CONTENT_W = W - PAD * 2;

// Neo-brutalism colours
const BLACK = "#121212";
const WHITE = "#ffffff";
const BG = "#f0f9ff";
const BLUE = "#2563eb";
const YELLOW = "#fef08a";
const RED_BG = "#fee2e2";
const RED_BORDER = "#dc2626";
const GREEN_BG = "#dcfce7";
const GREEN_BORDER = "#16a34a";
const GREY_LIGHT = "#f3f4f6";
const GREY_MID = "#e5e5e5";
const GREY_TEXT = "#6b7280";
const GREY_DARK = "#4b5563";

// ── Helpers ────────────────────────────────────────────────────────────
const resolveDayPaymentStatus = (
  dayOrder: DayOrder,
  parentStatus: PaymentStatus = "unpaid",
): "paid" | "unpaid" =>
  dayOrder.payment_status || (parentStatus === "paid" ? "paid" : "unpaid");

const calculateTotalFromDayOrders = (dayOrders: DayOrder[]): number =>
  dayOrders.reduce(
    (total, d) => total + d.items.reduce((s, i) => s + i.qty * i.unit_price, 0),
    0,
  );

const calculatePaymentTotals = (
  dayOrders: DayOrder[],
  parentStatus: PaymentStatus = "unpaid",
): PaymentTotals =>
  dayOrders.reduce(
    (t, d) => {
      const sub = d.items.reduce((s, i) => s + i.qty * i.unit_price, 0);
      if (resolveDayPaymentStatus(d, parentStatus) === "paid") t.paid += sub;
      else t.unpaid += sub;
      return t;
    },
    { paid: 0, unpaid: 0 },
  );

// ── Canvas drawing primitives ──────────────────────────────────────────

/** Draw text with optional max-width truncation */
const drawText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: {
    font?: string;
    color?: string;
    align?: CanvasTextAlign;
    maxWidth?: number;
  } = {},
) => {
  ctx.font = opts.font || '14px "Inter", Arial, sans-serif';
  ctx.fillStyle = opts.color || BLACK;
  ctx.textAlign = opts.align || "left";
  ctx.textBaseline = "top";
  ctx.fillText(text, x, y, opts.maxWidth);
};

/** Draw a rectangle with neo-brutalism shadow */
const drawBrutBox = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: {
    fill?: string;
    border?: string;
    borderWidth?: number;
    shadowOffset?: number;
    shadowColor?: string;
  } = {},
) => {
  const bw = opts.borderWidth || 3;
  const so = opts.shadowOffset || 5;
  const sc = opts.shadowColor || BLACK;
  const fill = opts.fill || WHITE;
  const border = opts.border || BLACK;

  // Shadow
  ctx.fillStyle = sc;
  ctx.fillRect(x + so, y + so, w, h);

  // Box
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);

  // Border
  ctx.strokeStyle = border;
  ctx.lineWidth = bw;
  ctx.strokeRect(x + bw / 2, y + bw / 2, w - bw, h - bw);
};

/** Draw a horizontal divider line */
const drawDivider = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  opts: { color?: string; width?: number } = {},
) => {
  ctx.strokeStyle = opts.color || BLACK;
  ctx.lineWidth = opts.width || 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
};

// ── Logo loader ────────────────────────────────────────────────────────
const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

// ── QR code generator ──────────────────────────────────────────────────
const generateQRDataUrl = async (text: string): Promise<string> => {
  return QRCode.toDataURL(text, {
    width: 200,
    margin: 1,
    color: { dark: BLACK, light: WHITE },
    errorCorrectionLevel: "M",
  });
};

// ── Wrap text into multiple lines if it exceeds maxWidth ───────────────
const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  font: string,
): string[] => {
  ctx.font = font;
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
};

// ── Main generator ─────────────────────────────────────────────────────
export async function generateInvoiceImage(order: InvoiceOrder): Promise<Blob> {
  const dayOrders = order.day_orders || [];
  const totalPrice = calculateTotalFromDayOrders(dayOrders);
  const paymentTotals = calculatePaymentTotals(dayOrders, order.payment_status);
  const invoiceNumber = `INV-${order.id.slice(0, 8).toUpperCase()}`;
  const invoiceDate = format(new Date(order.created_at), "dd MMMM yyyy");
  const isPaid = paymentTotals.unpaid === 0;
  const hasUnpaid = paymentTotals.unpaid > 0;

  // ── Pre-calculate height ───────────────────────────────────────────
  // We do a dry-run to figure out total canvas height, then draw.
  let estimatedHeight = 0;
  estimatedHeight += 32; // top padding
  estimatedHeight += 140; // header (logo area + title)
  estimatedHeight += 24; // gap
  estimatedHeight += 100; // invoice info box
  estimatedHeight += 20; // gap
  estimatedHeight += 80; // customer info box
  if (order.email) estimatedHeight += 20;
  if (order.drop_off_location) estimatedHeight += 20;
  estimatedHeight += 20; // gap
  estimatedHeight += 50; // table header

  for (const dayOrder of dayOrders) {
    estimatedHeight += 40; // day header
    estimatedHeight += dayOrder.items.length * 50; // items
    estimatedHeight += 40; // subtotal row
  }

  estimatedHeight += 20; // gap
  if (order.notes) estimatedHeight += 80; // notes box
  estimatedHeight += 20; // gap
  estimatedHeight += 100; // total box
  estimatedHeight += 20; // gap
  estimatedHeight += 60; // payment status badge
  estimatedHeight += 20; // gap

  // Payment summary section
  estimatedHeight += 110; // paid / unpaid / status rows

  if (hasUnpaid) {
    estimatedHeight += 20; // gap before QR
    estimatedHeight += 320; // QR section
  }

  estimatedHeight += 20; // gap
  estimatedHeight += 60; // footer
  estimatedHeight += 32; // bottom padding
  estimatedHeight += 200; // generous buffer (trimmed at end)

  const H = estimatedHeight;

  // ── Create canvas ──────────────────────────────────────────────────
  const canvas = document.createElement("canvas");
  canvas.width = W * 2; // 2x for retina
  canvas.height = H * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(2, 2);

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Main card background
  drawBrutBox(ctx, PAD - 8, 20, CONTENT_W + 16, H - 40, {
    fill: WHITE,
    borderWidth: 4,
    shadowOffset: 8,
  });

  let y = 44; // start y within the card
  const cardPad = PAD + 8;
  const cardW = CONTENT_W - 16;

  // ── Decorative elements (neo-brutalism) ─────────────────────────────
  // Small decorative shapes
  ctx.fillStyle = BLUE;
  ctx.fillRect(cardPad + cardW - 40, y - 2, 16, 16);

  ctx.fillStyle = YELLOW;
  ctx.save();
  ctx.translate(cardPad + 12, y + 4);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(0, 0, 10, 10);
  ctx.restore();

  // ── Header ─────────────────────────────────────────────────────────
  // Try to load logo
  let logo: HTMLImageElement | null = null;
  try {
    logo = await loadImage("/image/dapur-buwikra-logo.png");
  } catch {
    // Logo not available, that's OK
  }

  if (logo) {
    const logoSize = 80;
    const logoX = cardPad + (cardW - logoSize) / 2;
    ctx.drawImage(logo, logoX, y, logoSize, logoSize);
    y += logoSize + 8;
  }

  // Title
  drawText(ctx, "DAPUR BUWIKRA", cardPad + cardW / 2, y, {
    font: 'bold 28px "Inter", Arial, sans-serif',
    color: BLACK,
    align: "center",
  });
  y += 34;

  drawText(ctx, "CATERING & HOMEMADE FOOD", cardPad + cardW / 2, y, {
    font: '600 12px "Inter", Arial, sans-serif',
    color: GREY_DARK,
    align: "center",
  });
  y += 20;

  // Thick divider
  drawDivider(ctx, cardPad, y, cardW, { width: 4 });
  y += 12;

  // "INVOICE" subtitle
  drawText(ctx, "INVOICE", cardPad + cardW / 2, y, {
    font: 'bold 16px "Inter", Arial, sans-serif',
    color: BLUE,
    align: "center",
  });
  y += 28;

  // ── Invoice Info Box ───────────────────────────────────────────────
  drawBrutBox(ctx, cardPad, y, cardW, 70, {
    fill: GREY_LIGHT,
    shadowOffset: 4,
    borderWidth: 2,
  });

  // Left side - Invoice number
  drawText(ctx, "No. Invoice", cardPad + 16, y + 12, {
    font: 'bold 11px "Inter", Arial, sans-serif',
    color: GREY_DARK,
  });
  drawText(ctx, invoiceNumber, cardPad + 16, y + 28, {
    font: 'bold 16px "Inter", Arial, sans-serif',
    color: BLACK,
  });

  // Right side - Date
  drawText(ctx, "Tanggal", cardPad + cardW - 16, y + 12, {
    font: 'bold 11px "Inter", Arial, sans-serif',
    color: GREY_DARK,
    align: "right",
  });
  drawText(ctx, invoiceDate, cardPad + cardW - 16, y + 28, {
    font: 'bold 14px "Inter", Arial, sans-serif',
    color: BLACK,
    align: "right",
  });

  // Status label in the center-bottom of the box
  const statusLabel = isPaid
    ? "✓ LUNAS"
    : paymentTotals.paid > 0
      ? "⚠ SEBAGIAN"
      : "✕ BELUM LUNAS";
  const statusColor = isPaid ? GREEN_BORDER : RED_BORDER;
  drawText(ctx, statusLabel, cardPad + cardW / 2, y + 50, {
    font: 'bold 11px "Inter", Arial, sans-serif',
    color: statusColor,
    align: "center",
  });

  y += 86;

  // ── Customer Info Box ──────────────────────────────────────────────
  let customerBoxH = 60;
  if (order.email) customerBoxH += 20;
  if (order.drop_off_location) customerBoxH += 20;

  drawBrutBox(ctx, cardPad, y, cardW, customerBoxH, {
    fill: WHITE,
    shadowOffset: 4,
    borderWidth: 2,
  });

  drawText(ctx, "PELANGGAN", cardPad + 16, y + 12, {
    font: 'bold 10px "Inter", Arial, sans-serif',
    color: GREY_DARK,
  });

  drawText(ctx, order.name.toUpperCase(), cardPad + 16, y + 28, {
    font: 'bold 18px "Inter", Arial, sans-serif',
    color: BLACK,
    maxWidth: cardW - 32,
  });

  let customerY = y + 50;
  if (order.email) {
    drawText(ctx, order.email, cardPad + 16, customerY, {
      font: '13px "Inter", Arial, sans-serif',
      color: GREY_TEXT,
    });
    customerY += 20;
  }
  if (order.drop_off_location) {
    drawText(ctx, `📍 ${order.drop_off_location}`, cardPad + 16, customerY, {
      font: '13px "Inter", Arial, sans-serif',
      color: GREY_DARK,
      maxWidth: cardW - 32,
    });
    customerY += 20;
  }

  y += customerBoxH + 16;

  // ── Order Items Table ──────────────────────────────────────────────
  // Table header
  ctx.fillStyle = BLACK;
  ctx.fillRect(cardPad, y, cardW, 36);

  drawText(ctx, "ITEM", cardPad + 12, y + 10, {
    font: 'bold 12px "Inter", Arial, sans-serif',
    color: WHITE,
  });
  drawText(ctx, "QTY", cardPad + cardW - 140, y + 10, {
    font: 'bold 12px "Inter", Arial, sans-serif',
    color: WHITE,
    align: "center",
  });
  drawText(ctx, "SUBTOTAL", cardPad + cardW - 12, y + 10, {
    font: 'bold 12px "Inter", Arial, sans-serif',
    color: WHITE,
    align: "right",
  });
  y += 36;

  // Border around table body
  const tableBodyStartY = y;

  for (const dayOrder of dayOrders) {
    const dayPayStatus = resolveDayPaymentStatus(
      dayOrder,
      order.payment_status,
    );

    // Day header
    ctx.fillStyle = GREY_MID;
    ctx.fillRect(cardPad, y, cardW, 34);

    // Left border accent
    ctx.fillStyle = BLUE;
    ctx.fillRect(cardPad, y, 5, 34);

    drawText(
      ctx,
      `${dayOrder.day.toUpperCase()} — ${format(new Date(dayOrder.date), "dd MMM yyyy")}`,
      cardPad + 16,
      y + 9,
      {
        font: 'bold 13px "Inter", Arial, sans-serif',
        color: BLACK,
      },
    );

    // Day payment badge
    const badgeText = dayPayStatus === "paid" ? "PAID" : "UNPAID";
    const badgeColor = dayPayStatus === "paid" ? GREEN_BORDER : RED_BORDER;
    const badgeBg = dayPayStatus === "paid" ? GREEN_BG : RED_BG;

    const badgeW = ctx.measureText(badgeText).width + 16;
    const badgeX = cardPad + cardW - badgeW - 12;
    ctx.fillStyle = badgeBg;
    ctx.fillRect(badgeX, y + 6, badgeW, 22);
    ctx.strokeStyle = badgeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(badgeX, y + 6, badgeW, 22);
    drawText(ctx, badgeText, badgeX + badgeW / 2, y + 10, {
      font: 'bold 11px "Inter", Arial, sans-serif',
      color: badgeColor,
      align: "center",
    });

    y += 34;

    // Items
    for (const item of dayOrder.items) {
      // Alternating row background
      ctx.fillStyle = WHITE;
      ctx.fillRect(cardPad, y, cardW, 44);

      // Thin separator
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cardPad, y);
      ctx.lineTo(cardPad + cardW, y);
      ctx.stroke();

      drawText(ctx, item.name, cardPad + 16, y + 8, {
        font: '500 14px "Inter", Arial, sans-serif',
        color: BLACK,
        maxWidth: cardW - 200,
      });
      drawText(
        ctx,
        `@ ${formatCurrency(item.unit_price)}`,
        cardPad + 16,
        y + 26,
        {
          font: '12px "Inter", Arial, sans-serif',
          color: GREY_TEXT,
        },
      );
      drawText(ctx, `${item.qty}`, cardPad + cardW - 140, y + 14, {
        font: 'bold 14px "Inter", Arial, sans-serif',
        color: BLACK,
        align: "center",
      });
      drawText(
        ctx,
        formatCurrency(item.qty * item.unit_price),
        cardPad + cardW - 12,
        y + 14,
        {
          font: 'bold 14px "Inter", Arial, sans-serif',
          color: BLACK,
          align: "right",
        },
      );
      y += 44;
    }

    // Day subtotal
    const dayTotal = dayOrder.items.reduce(
      (sum, item) => sum + item.qty * item.unit_price,
      0,
    );
    ctx.fillStyle = GREY_LIGHT;
    ctx.fillRect(cardPad, y, cardW, 34);
    drawText(ctx, `Subtotal ${dayOrder.day}`, cardPad + 16, y + 9, {
      font: 'bold 13px "Inter", Arial, sans-serif',
      color: GREY_DARK,
    });
    drawText(ctx, formatCurrency(dayTotal), cardPad + cardW - 12, y + 9, {
      font: 'bold 14px "Inter", Arial, sans-serif',
      color: BLACK,
      align: "right",
    });
    y += 34;
  }

  // Table border
  ctx.strokeStyle = BLACK;
  ctx.lineWidth = 2;
  ctx.strokeRect(cardPad + 1, tableBodyStartY, cardW - 2, y - tableBodyStartY);

  y += 16;

  // ── Notes ──────────────────────────────────────────────────────────
  if (order.notes) {
    const noteFont = '13px "Inter", Arial, sans-serif';
    const noteLines = wrapText(ctx, order.notes, cardW - 48, noteFont);
    const notesBoxH = 36 + noteLines.length * 18;

    drawBrutBox(ctx, cardPad, y, cardW, notesBoxH, {
      fill: YELLOW,
      shadowOffset: 4,
      borderWidth: 2,
    });

    drawText(ctx, "CATATAN", cardPad + 16, y + 10, {
      font: 'bold 10px "Inter", Arial, sans-serif',
      color: GREY_DARK,
    });

    let noteY = y + 28;
    for (const line of noteLines) {
      drawText(ctx, line, cardPad + 16, noteY, {
        font: noteFont,
        color: BLACK,
      });
      noteY += 18;
    }
    y += notesBoxH + 16;
  }

  // ── Payment Summary ────────────────────────────────────────────────
  drawBrutBox(ctx, cardPad, y, cardW, 96, {
    fill: WHITE,
    shadowOffset: 4,
    borderWidth: 2,
  });

  // Paid
  drawText(ctx, "SUDAH DIBAYAR", cardPad + 16, y + 12, {
    font: 'bold 12px "Inter", Arial, sans-serif',
    color: GREY_DARK,
  });
  drawText(
    ctx,
    formatCurrency(paymentTotals.paid),
    cardPad + cardW - 16,
    y + 12,
    {
      font: 'bold 14px "Inter", Arial, sans-serif',
      color: GREEN_BORDER,
      align: "right",
    },
  );

  // Divider
  drawDivider(ctx, cardPad + 16, y + 34, cardW - 32, {
    color: "#e5e7eb",
    width: 1,
  });

  // Unpaid
  drawText(ctx, "SISA TAGIHAN", cardPad + 16, y + 42, {
    font: 'bold 12px "Inter", Arial, sans-serif',
    color: GREY_DARK,
  });
  drawText(
    ctx,
    formatCurrency(paymentTotals.unpaid),
    cardPad + cardW - 16,
    y + 42,
    {
      font: 'bold 14px "Inter", Arial, sans-serif',
      color: hasUnpaid ? RED_BORDER : GREEN_BORDER,
      align: "right",
    },
  );

  // Divider
  drawDivider(ctx, cardPad + 16, y + 64, cardW - 32, {
    color: "#e5e7eb",
    width: 1,
  });

  // Status text
  const paymentStatusText = isPaid
    ? "LUNAS"
    : paymentTotals.paid > 0
      ? "SEBAGIAN DIBAYAR"
      : "BELUM LUNAS";
  drawText(ctx, "STATUS", cardPad + 16, y + 72, {
    font: 'bold 12px "Inter", Arial, sans-serif',
    color: GREY_DARK,
  });
  drawText(ctx, paymentStatusText, cardPad + cardW - 16, y + 72, {
    font: 'bold 14px "Inter", Arial, sans-serif',
    color: isPaid ? GREEN_BORDER : RED_BORDER,
    align: "right",
  });

  y += 112;

  // ── Grand Total Box ────────────────────────────────────────────────
  ctx.fillStyle = BLACK;
  ctx.fillRect(cardPad, y, cardW, 60);
  // Shadow
  ctx.fillStyle = BLUE;
  ctx.fillRect(cardPad + 5, y + 5, cardW, 60);
  // Box again on top
  ctx.fillStyle = BLACK;
  ctx.fillRect(cardPad, y, cardW, 60);

  drawText(ctx, "TOTAL", cardPad + 20, y + 20, {
    font: 'bold 16px "Inter", Arial, sans-serif',
    color: WHITE,
  });
  drawText(ctx, formatCurrency(totalPrice), cardPad + cardW - 20, y + 14, {
    font: 'bold 26px "Inter", Arial, sans-serif',
    color: WHITE,
    align: "right",
  });

  y += 76;

  // ── Payment Status Badge ───────────────────────────────────────────
  const badgeFill = isPaid ? GREEN_BG : RED_BG;
  const badgeBorder = isPaid ? GREEN_BORDER : RED_BORDER;
  const badgeLabel = isPaid ? "✓  LUNAS" : "✕  BELUM LUNAS";
  const badgeFont = 'bold 16px "Inter", Arial, sans-serif';
  ctx.font = badgeFont;
  const badgeTxtW = ctx.measureText(badgeLabel).width;
  const badgeBoxW = badgeTxtW + 48;
  const badgeBoxX = cardPad + (cardW - badgeBoxW) / 2;

  drawBrutBox(ctx, badgeBoxX, y, badgeBoxW, 44, {
    fill: badgeFill,
    border: badgeBorder,
    borderWidth: 4,
    shadowOffset: 4,
    shadowColor: badgeBorder,
  });

  drawText(ctx, badgeLabel, cardPad + cardW / 2, y + 12, {
    font: badgeFont,
    color: badgeBorder,
    align: "center",
  });

  y += 64;

  // ── QR Code for Payment (only if unpaid) ───────────────────────────
  if (hasUnpaid) {
    drawDivider(ctx, cardPad + 40, y, cardW - 80, { color: BLACK, width: 2 });
    y += 16;

    drawText(ctx, "PEMBAYARAN QRIS", cardPad + cardW / 2, y, {
      font: 'bold 16px "Inter", Arial, sans-serif',
      color: BLACK,
      align: "center",
    });
    y += 24;

    drawText(
      ctx,
      "Scan kode QR di bawah untuk melakukan pembayaran",
      cardPad + cardW / 2,
      y,
      {
        font: '12px "Inter", Arial, sans-serif',
        color: GREY_TEXT,
        align: "center",
      },
    );
    y += 24;

    // QR Code box
    const qrBoxSize = 200;
    const qrBoxX = cardPad + (cardW - qrBoxSize - 16) / 2;

    // Fallback page URL (used only if the static QRIS image fails to load)
    const paymentUrl = `${window.location.origin}/payment/qris`;

    try {
      // Embed the real static QRIS image directly so customers scan once and
      // pay. The QRIS is static and never expires. Requires the source to
      // return CORS headers (loadImage sets crossOrigin="anonymous"), else
      // the canvas is tainted and toBlob() throws.
      //
      // The `cors=1` query param sidesteps any CDN object that was cached
      // WITHOUT the Access-Control-Allow-Origin header (before CORS was
      // enabled on the bucket). It maps to a distinct cache key that fills
      // from a fresh origin request, which does return the CORS header.
      const qrSrc = QRIS_SOURCE_URL.includes("?")
        ? `${QRIS_SOURCE_URL}&cors=1`
        : `${QRIS_SOURCE_URL}?cors=1`;
      const qrImage = await loadImage(qrSrc);

      drawBrutBox(ctx, qrBoxX, y, qrBoxSize + 16, qrBoxSize + 16, {
        fill: WHITE,
        shadowOffset: 5,
        shadowColor: BLUE,
        borderWidth: 3,
      });

      ctx.drawImage(qrImage, qrBoxX + 8, y + 8, qrBoxSize, qrBoxSize);
    } catch {
      // Fallback: encode the payment page URL as a QR so the invoice still
      // leads somewhere payable if the static QRIS image can't be embedded.
      try {
        const qrDataUrl = await generateQRDataUrl(paymentUrl);
        const qrImage = await loadImage(qrDataUrl);

        drawBrutBox(ctx, qrBoxX, y, qrBoxSize + 16, qrBoxSize + 16, {
          fill: WHITE,
          shadowOffset: 5,
          shadowColor: BLUE,
          borderWidth: 3,
        });

        ctx.drawImage(qrImage, qrBoxX + 8, y + 8, qrBoxSize, qrBoxSize);
      } catch {
        drawBrutBox(ctx, cardPad + 40, y, cardW - 80, 60, {
          fill: YELLOW,
          shadowOffset: 4,
          borderWidth: 2,
        });
        drawText(ctx, paymentUrl, cardPad + cardW / 2, y + 22, {
          font: 'bold 13px "Inter", Arial, sans-serif',
          color: BLACK,
          align: "center",
        });
      }
    }

    y += qrBoxSize + 32;

    // Payment instruction box
    drawBrutBox(ctx, cardPad + 20, y, cardW - 40, 46, {
      fill: YELLOW,
      shadowOffset: 3,
      borderWidth: 2,
    });
    drawText(
      ctx,
      "Buka aplikasi pembayaran → Scan QRIS → Bayar",
      cardPad + cardW / 2,
      y + 15,
      {
        font: 'bold 12px "Inter", Arial, sans-serif',
        color: BLACK,
        align: "center",
        maxWidth: cardW - 80,
      },
    );

    y += 62;
  }

  // ── Footer ─────────────────────────────────────────────────────────
  drawDivider(ctx, cardPad + 40, y, cardW - 80, { color: "#d1d5db", width: 1 });
  y += 12;

  drawText(ctx, "Terima kasih atas pesanan Anda! 🙏", cardPad + cardW / 2, y, {
    font: '13px "Inter", Arial, sans-serif',
    color: GREY_TEXT,
    align: "center",
  });
  y += 18;

  drawText(
    ctx,
    "Dapur Buwikra — Catering & Homemade Food",
    cardPad + cardW / 2,
    y,
    {
      font: '12px "Inter", Arial, sans-serif',
      color: "#9ca3af",
      align: "center",
    },
  );

  // ── Export to blob ─────────────────────────────────────────────────
  // Trim canvas to actual content height
  const finalHeight = Math.min(y + 40, H);
  const trimmedCanvas = document.createElement("canvas");
  trimmedCanvas.width = W * 2;
  trimmedCanvas.height = finalHeight * 2;
  const trimCtx = trimmedCanvas.getContext("2d")!;
  trimCtx.drawImage(
    canvas,
    0,
    0,
    W * 2,
    finalHeight * 2,
    0,
    0,
    W * 2,
    finalHeight * 2,
  );

  return new Promise<Blob>((resolve, reject) => {
    trimmedCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create image blob"));
      },
      "image/png",
      1.0,
    );
  });
}
