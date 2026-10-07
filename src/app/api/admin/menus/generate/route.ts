import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { parseMenuTextWithAI } from "@/lib/dashscope-parser";
import { generateMenuFlyerImage } from "@/lib/flyer-template-engine";
import { authorizeMenuGenerator } from "@/lib/menu-generator-auth";
import type {
  FlyerTemplateStyle,
  ParsedMenuData,
} from "@/types/menu-generator.types";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    const auth = authorizeMenuGenerator(
      session,
      req.headers.get("authorization"),
      process.env.DAPUR_BOT_TOKEN,
    );

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Akses ditolak. Gunakan akun admin, koki, atau token bot yang valid.",
        },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawText: string = body.text || "";
    let parsedData: ParsedMenuData = body.parsed_data;
    const style: FlyerTemplateStyle = body.style || "bento_yellow";
    const photoSrc: string | undefined = body.photo_src || body.image_url;
    const autoPublish: boolean = Boolean(body.auto_publish);

    // 1. Parse text with AliCloud DashScope if not already structured
    if (!parsedData) {
      if (!rawText.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: "Masukkan teks menu atau data menu terstruktur.",
          },
          { status: 400 },
        );
      }
      parsedData = await parseMenuTextWithAI(rawText);
    }

    // 2. Render Flyer Image via ImageResponse
    const flyerResponse = await generateMenuFlyerImage(
      parsedData,
      style,
      photoSrc,
    );
    const arrayBuffer = await flyerResponse.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const previewDataUrl = `data:image/png;base64,${imageBuffer.toString("base64")}`;

    // 3. Auto-publish if requested
    let publishedMenuId: string | undefined;
    let publishedImageUrl: string | undefined;

    if (autoPublish) {
      const token = auth.token;
      if (!token) {
        return NextResponse.json(
          {
            success: false,
            error: "Token autentikasi diperlukan untuk menampilkan menu.",
            parsed_data: parsedData,
            preview_image: previewDataUrl,
          },
          { status: 400 },
        );
      }

      // Create menu in backend
      const createMenuPayload = {
        content_type: parsedData.content_type || "portfolio",
        portfolio_date: parsedData.date,
        description: parsedData.description,
        is_active: true,
        is_featured: false,
        items: [
          {
            name: parsedData.dishes.main,
            description: `${parsedData.dishes.carbs}, ${parsedData.dishes.side}, ${parsedData.dishes.condiment}`,
            price: parsedData.price || 0,
          },
        ],
      };

      const createRes = await fetch(`${BACKEND_API_URL}/menus`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": "dapur-menu-generator/1.0",
        },
        body: JSON.stringify(createMenuPayload),
      });

      if (!createRes.ok) {
        const errJson = await createRes.json().catch(() => ({}));
        throw new Error(
          errJson.message ||
            `Failed to create menu in backend: ${createRes.status}`,
        );
      }

      const createData = await createRes.json();
      publishedMenuId = createData.data?.id;

      if (publishedMenuId) {
        // Upload generated PNG image to R2 via backend
        const formData = new FormData();
        const blob = new Blob([imageBuffer], { type: "image/png" });
        formData.append("image", blob, `menu-flyer-${parsedData.date}.png`);

        const uploadRes = await fetch(
          `${BACKEND_API_URL}/menus/${publishedMenuId}/images`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "User-Agent": "dapur-menu-generator/1.0",
            },
            body: formData,
          },
        );

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          publishedImageUrl = uploadData.data?.image_urls?.[0];
        }
      }
    }

    return NextResponse.json({
      success: true,
      parsed_data: parsedData,
      preview_image: previewDataUrl,
      menu_id: publishedMenuId,
      published_image_url: publishedImageUrl,
    });
  } catch (error: any) {
    console.error("Error in menu flyer generation API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Gagal memproses permintaan.",
      },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint: allows previewing or downloading the image directly as image/png
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    const auth = authorizeMenuGenerator(
      session,
      req.headers.get("authorization"),
      process.env.DAPUR_BOT_TOKEN,
    );
    if (!auth.authorized)
      return NextResponse.json(
        {
          error:
            "Akses ditolak. Gunakan akun admin, koki, atau token bot yang valid.",
        },
        { status: 401 },
      );
    const { searchParams } = new URL(req.url);
    const text =
      searchParams.get("text") ||
      "Menu Hari Ini: Ayam Goreng Lengkuas, Nasi Uduk Gurih, Tempe Orek, Sambal Terasi, 25k";
    const style =
      (searchParams.get("style") as FlyerTemplateStyle) || "bento_yellow";
    const photoSrc = searchParams.get("photo_url") || undefined;

    const parsedData = await parseMenuTextWithAI(text);
    const flyer = await generateMenuFlyerImage(parsedData, style, photoSrc);

    return flyer;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
