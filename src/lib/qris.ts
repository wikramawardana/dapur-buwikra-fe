import QRCode from "qrcode";

export const DEFAULT_STATIC_QRIS =
  process.env.NEXT_PUBLIC_QRIS_STATIC ||
  "00020101021126610016ID.CO.SHOPEE.WWW01189360091800230917720208230917720303UMI51440014ID.CO.QRIS.WWW0215ID10265230843600303UMI5204581153033605802ID5912DapurBuWikra6006BEKASI61051711662070703A01630488BB";

export interface TLV {
  tag: string;
  name: string;
  length: number;
  value: string;
  children?: TLV[];
}

/**
 * Calculate CRC16-CCITT checksum for QRIS/EMVCo QR codes.
 * Polynomial: 0x1021, Initial: 0xFFFF
 */
export function calculateCRC16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Rebuild a raw TLV string from an array of TLV elements.
 */
export function buildTLVString(elements: TLV[]): string {
  return elements
    .map((el) => {
      const value = el.children ? buildTLVString(el.children) : el.value;
      const length = value.length.toString().padStart(2, "0");
      return `${el.tag}${length}${value}`;
    })
    .join("");
}

function makeTLV(tag: string, value: string, name = ""): TLV {
  return { tag, name, length: value.length, value };
}

/**
 * Parse a raw QRIS TLV string into element objects.
 */
export function parseTLV(data: string): TLV[] {
  const elements: TLV[] = [];
  let pos = 0;

  while (pos < data.length) {
    if (pos + 4 > data.length) break;

    const tag = data.substring(pos, pos + 2);
    const length = Number.parseInt(data.substring(pos + 2, pos + 4), 10);

    if (Number.isNaN(length) || pos + 4 + length > data.length) break;

    const value = data.substring(pos + 4, pos + 4 + length);
    elements.push({ tag, name: tag, length, value });
    pos += 4 + length;
  }

  return elements;
}

export interface DynamicQRISOptions {
  staticQRIS?: string;
  fee?: {
    type: "fixed" | "percentage";
    value: number;
  };
}

/**
 * Convert a static QRIS payload to a dynamic QRIS string with an embedded amount.
 * Follows the EMVCo / QRIS standard (Point of Initiation Method: 11 -> 12, inject tag 54).
 */
export function generateDynamicQRIS(
  amount: number,
  options?: DynamicQRISOptions,
): string {
  const staticPayload = options?.staticQRIS || DEFAULT_STATIC_QRIS;
  const elements = parseTLV(staticPayload);

  const result: TLV[] = [];
  let amountInserted = false;

  // Tags we manage and re-insert
  const managedTags = new Set(["54", "55", "56", "57", "63"]);

  for (const el of elements) {
    if (managedTags.has(el.tag)) continue;

    // Convert method from Static (11) to Dynamic (12)
    if (el.tag === "01") {
      result.push(makeTLV("01", "12", "Point of Initiation Method"));
      continue;
    }

    // Insert Transaction Amount (Tag 54) immediately before Country Code (Tag 58)
    if (el.tag === "58" && !amountInserted) {
      const amountStr = Math.round(amount).toString();
      result.push(makeTLV("54", amountStr, "Transaction Amount"));

      if (options?.fee) {
        if (options.fee.type === "fixed") {
          result.push(makeTLV("55", "02", "Tip Indicator"));
          result.push(
            makeTLV("56", options.fee.value.toString(), "Convenience Fee"),
          );
        } else {
          result.push(makeTLV("55", "03", "Tip Indicator"));
          result.push(
            makeTLV("57", options.fee.value.toString(), "Convenience Fee %"),
          );
        }
      }

      amountInserted = true;
    }

    result.push(el);
  }

  // Fallback if tag 58 was not found
  if (!amountInserted) {
    const amountStr = Math.round(amount).toString();
    result.push(makeTLV("54", amountStr, "Transaction Amount"));
  }

  const withoutCRC = buildTLVString(result);
  const crcInput = `${withoutCRC}6304`;
  const crc = calculateCRC16(crcInput);

  return crcInput + crc;
}

/**
 * Generate a high-resolution base64 data URL from a QRIS payload.
 */
export async function generateQRISDataUrl(
  qrisPayload: string,
  width = 360,
): Promise<string> {
  return QRCode.toDataURL(qrisPayload, {
    width,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Calculate a deterministic 2-digit unique verification code (10..99)
 * from an order ID to guarantee no two concurrent orders have identical amounts.
 */
export function getUniqueOrderCode(orderId?: string): number {
  if (!orderId) return 0;
  let hash = 0;
  for (let i = 0; i < orderId.length; i++) {
    hash = (hash * 31 + orderId.charCodeAt(i)) % 999;
  }
  return (Math.abs(hash) % 90) + 10; // 10 to 99
}

/**
 * Calculate the payable amount with optional unique code for payment collision avoidance.
 */
export function calculateOrderPayable(
  baseAmount: number,
  orderId?: string,
  useUniqueCode = true,
): { finalAmount: number; uniqueCode: number } {
  if (!useUniqueCode || !orderId || baseAmount <= 0) {
    return { finalAmount: baseAmount, uniqueCode: 0 };
  }
  const uniqueCode = getUniqueOrderCode(orderId);
  return { finalAmount: baseAmount + uniqueCode, uniqueCode };
}
