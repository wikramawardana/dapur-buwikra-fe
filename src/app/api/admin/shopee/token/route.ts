import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import {
  getEffectiveShopeeToken,
  setEffectiveShopeeToken,
} from "@/lib/shopee-db";

async function verifyTokenWithShopee(
  token: string,
): Promise<{ valid: boolean; code?: number; error?: string }> {
  try {
    const listHeaders = {
      "Content-Type": "application/json",
      Origin: "https://partner.shopee.co.id",
      Referer: "https://partner.shopee.co.id/",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "X-Timestamp-Ms": Date.now().toString(),
    };

    const nowSeconds = Math.floor(Date.now() / 1000);
    const resp = await fetch(
      "https://shopeepay.shopee.co.id/merchant/v1/partner-web/get-transaction-list",
      {
        method: "POST",
        headers: listHeaders,
        body: JSON.stringify({
          data: {
            metadata: {
              token,
              language: "id",
              timezone: "Asia/Jakarta",
            },
            pageSize: 1,
            filter: {
              startTime: nowSeconds - 3600,
              endTime: nowSeconds,
              serviceList: [1, 3],
            },
          },
        }),
        cache: "no-store",
      },
    );

    if (!resp.ok) {
      return { valid: false, error: `Shopee HTTP status ${resp.status}` };
    }

    const data = await resp.json();
    if (data.code === 0) {
      return { valid: true };
    }

    return {
      valid: false,
      code: data.code,
      error: data.msg || `Shopee code ${data.code}`,
    };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const token = await getEffectiveShopeeToken();
    const isConfigured = Boolean(token && token.trim().length > 0);

    let masked = "";
    if (isConfigured) {
      masked = `${token.slice(0, 8)}••••••••${token.slice(-6)}`;
    }

    const verification = isConfigured
      ? await verifyTokenWithShopee(token)
      : { valid: false, error: "Token belum diisi" };

    return NextResponse.json({
      success: true,
      configured: isConfigured,
      maskedToken: masked,
      isValid: verification.valid,
      error: verification.error,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const newToken = String(body.token || "").trim();

    if (!newToken) {
      return NextResponse.json(
        { success: false, error: "Token cannot be empty" },
        { status: 400 },
      );
    }

    // Verify token with Shopee before saving
    const testResult = await verifyTokenWithShopee(newToken);
    if (!testResult.valid) {
      return NextResponse.json(
        {
          success: false,
          error: `Token tidak valid atau ditolak oleh ShopeePay: ${testResult.error || `Kode ${testResult.code}`}`,
        },
        { status: 400 },
      );
    }

    // Save to PostgreSQL system_settings
    await setEffectiveShopeeToken(newToken);

    return NextResponse.json({
      success: true,
      message:
        "Token ShopeePay Partner berhasil diverifikasi dan disimpan ke database!",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal error",
      },
      { status: 500 },
    );
  }
}
