import { format } from "date-fns";
import type { ParsedMenuData } from "@/types/menu-generator.types";

const DEFAULT_DASHSCOPE_URL =
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";

export async function parseMenuTextWithAI(
  rawText: string,
): Promise<ParsedMenuData> {
  const apiKey = process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY;

  const todayStr = format(new Date(), "yyyy-MM-dd");

  if (!apiKey) {
    return parseFallback(rawText, todayStr);
  }

  const baseUrl = (
    process.env.DASHSCOPE_BASE_URL || DEFAULT_DASHSCOPE_URL
  ).replace(/\/+$/, "");

  const systemPrompt = `Anda adalah asisten AI khusus katering "Dapur Bu Wikra".
Tugas Anda adalah mengekstrak dan menstrukturkan teks menu makanan dari pengguna menjadi format JSON yang rapi untuk dicetak pada flyer bento katering.

Kategori yang harus dipisahkan:
- main: Lauk utama (misal: "Ayam Goreng Lengkuas", "Tongseng Daging", "Rendang Daging", "Cumi Balado").
- carbs: Nasi/karbohidrat (misal: "Nasi Putih Bawang Goreng", "Nasi Uduk Gurih", "Nasi Daun Jeruk"). Jika tidak disebutkan, default "Nasi Putih Bawang Goreng".
- side: Lauk pendamping/sayur (misal: "Tahu Goreng Bandung", "Bakwan Jagung", "Tempe Orek", "Capcay").
- condiment: Sambal, kerupuk, atau lalapan (misal: "Sambal Rawit", "Sambal Terasi", "Sambal Bajak").
- price: Angka harga jika ada (misal 25000). Jika tidak ada harga, kosongkan.
- price_label: String harga ringkas seperti "25K" atau "CUMA 25K".
- date: Tanggal menu dalam format YYYY-MM-DD (hari ini adalah ${todayStr}).
- title: Judul menu singkat seperti "Menu Hari Ini" atau "Menu Senin".
- tagline: Slogan ringkas, default "Nikmat, Sehat, Hemat".
- description: Kalimat deskripsi menggugah selera khas masakan rumahan ibu yang merangkum menu hari ini (1-2 kalimat).

Kembalikan HANYA format JSON valid tanpa markdown backticks tambahan. Format:
{
  "title": "Menu Hari Ini",
  "date": "YYYY-MM-DD",
  "price": 25000,
  "price_label": "25K",
  "content_type": "portfolio",
  "dishes": {
    "main": "...",
    "carbs": "...",
    "side": "...",
    "condiment": "..."
  },
  "description": "...",
  "tagline": "Nikmat, Sehat, Hemat"
}`;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen3.8-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Tolong ekstrak menu berikut:\n${rawText}`,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("DashScope API call failed:", response.status, errText);
      return parseFallback(rawText, todayStr);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "";

    const parsed = JSON.parse(content);
    return {
      title: parsed.title || "Menu Hari Ini",
      date: parsed.date || todayStr,
      price: typeof parsed.price === "number" ? parsed.price : undefined,
      price_label:
        parsed.price_label ||
        (parsed.price ? `${Math.round(parsed.price / 1000)}K` : undefined),
      content_type: parsed.content_type || "portfolio",
      dishes: {
        main: parsed.dishes?.main || "Lauk Utama",
        carbs: parsed.dishes?.carbs || "Nasi Putih Bawang Goreng",
        side: parsed.dishes?.side || "Lauk Pendamping",
        condiment: parsed.dishes?.condiment || "Sambal Khas",
      },
      description:
        parsed.description ||
        "Menghadirkan kehangatan masakan rumahan dengan bumbu rahasia untuk kalian yang rindu masakan ibu.",
      tagline: parsed.tagline || "Nikmat, Sehat, Hemat",
    };
  } catch (err) {
    console.error("Error parsing menu with DashScope:", err);
    return parseFallback(rawText, todayStr);
  }
}

function parseFallback(rawText: string, defaultDate: string): ParsedMenuData {
  const lines = rawText
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  let main = lines[0] || "Ayam Goreng Lengkuas";
  let carbs = "Nasi Putih Bawang Goreng";
  let side = lines[1] || "Tahu Goreng Bandung";
  let condiment = lines[2] || "Sambal Rawit";

  // Check for rice in lines
  for (const item of lines) {
    const lower = item.toLowerCase();
    if (lower.includes("nasi") || lower.includes("karbo")) {
      carbs = item;
    } else if (
      lower.includes("sambal") ||
      lower.includes("saus") ||
      lower.includes("lalap")
    ) {
      condiment = item;
    } else if (
      lower.includes("tahu") ||
      lower.includes("tempe") ||
      lower.includes("sayur") ||
      lower.includes("bakwan") ||
      lower.includes("capcay")
    ) {
      side = item;
    } else if (
      lower.includes("ayam") ||
      lower.includes("daging") ||
      lower.includes("sapi") ||
      lower.includes("ikan") ||
      lower.includes("cumi") ||
      lower.includes("telur")
    ) {
      main = item;
    }
  }

  // Detect price like "25k" or "25.000"
  const priceMatch =
    rawText.match(/(\d{1,3})[.\s]?000/i) || rawText.match(/(\d{2,3})\s*k/i);
  let price: number | undefined;
  let price_label: string | undefined;
  if (priceMatch) {
    const num = parseInt(priceMatch[1], 10);
    price = num < 1000 ? num * 1000 : num;
    price_label = `${Math.round(price / 1000)}K`;
  }

  return {
    title: "Menu Hari Ini",
    date: defaultDate,
    price,
    price_label,
    content_type: "portfolio",
    dishes: {
      main,
      carbs,
      side,
      condiment,
    },
    description: `Menghadirkan sajian ${main} istimewa dengan ${carbs}, ${side}, dan ${condiment} buatan Dapur Bu Wikra.`,
    tagline: "Nikmat, Sehat, Hemat",
  };
}
