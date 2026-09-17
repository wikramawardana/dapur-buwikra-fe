import { type NextRequest, NextResponse } from "next/server";
import {
  getEffectiveShopeeToken,
  linkTransactionToOrder,
  parseShopeeAmount,
  upsertShopeeTransactions,
} from "@/lib/shopee-db";

// Keep track of claimed transactions in-memory to prevent double-claiming (cleaned every 24 hours)
const claimedTransactions = new Map<string, number>();

function cleanExpiredClaims() {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [txId, timestamp] of claimedTransactions.entries()) {
    if (timestamp < cutoff) {
      claimedTransactions.delete(txId);
    }
  }
}

interface ShopeeTransactionItem {
  transactionId?: string;
  displayTransactionId?: string;
  amount?: string | number;
  status?: number; // 3 = Success
  createTime?: number; // unix timestamp in seconds
  storeName?: string;
}

interface ShopeeListResponse {
  code: number;
  msg?: string;
  data?: {
    list?: ShopeeTransactionItem[];
    total_amount?: string;
  };
}

interface ShopeeDetailResponse {
  code: number;
  data?: {
    issuer?: string;
    amount_display?: string;
    transaction_sn?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    cleanExpiredClaims();

    const token = await getEffectiveShopeeToken();
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error:
            "SHOPEE_PARTNER_TOKEN is not configured in server environment or database",
        },
        { status: 500 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const amount = Number(body.amount);
    const orderId = body.orderId as string | undefined;
    const customerName = body.customerName as string | undefined;
    const clientStartTime = Number(body.startTime);

    if (!amount || amount <= 0 || Number.isNaN(amount)) {
      return NextResponse.json(
        { success: false, error: "Valid positive amount is required" },
        { status: 400 },
      );
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    // Search window: provided startTime or past 30 minutes
    const startTime =
      clientStartTime && !Number.isNaN(clientStartTime) && clientStartTime > 0
        ? Math.max(clientStartTime - 60, nowSeconds - 3600) // 60s buffer for clock drift
        : nowSeconds - 30 * 60;

    const listPayload = {
      data: {
        metadata: {
          token,
          language: "id",
          timezone: "Asia/Jakarta",
        },
        pageSize: 25,
        filter: {
          startTime,
          endTime: nowSeconds,
          serviceList: [1, 3],
        },
        sorter: {
          field: "createTime",
          order: "descend",
        },
        next_position: "",
      },
    };

    const listHeaders = {
      "Content-Type": "application/json",
      Origin: "https://partner.shopee.co.id",
      Referer: "https://partner.shopee.co.id/",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "X-Timestamp-Ms": Date.now().toString(),
    };

    const shopeeResponse = await fetch(
      "https://shopeepay.shopee.co.id/merchant/v1/partner-web/get-transaction-list",
      {
        method: "POST",
        headers: listHeaders,
        body: JSON.stringify(listPayload),
        cache: "no-store",
      },
    );

    if (!shopeeResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `ShopeePay API HTTP error ${shopeeResponse.status}`,
        },
        { status: 502 },
      );
    }

    const shopeeData = (await shopeeResponse.json()) as ShopeeListResponse;

    if (shopeeData.code !== 0) {
      const isTokenExpired =
        shopeeData.code === 200020 ||
        shopeeData.msg?.toLowerCase().includes("token");

      if (isTokenExpired) {
        console.error(
          "⚠️ [ShopeePay] SHOPEE_PARTNER_TOKEN expired or invalid (code 200020). Please update token from partner.shopee.co.id.",
        );
      }

      return NextResponse.json(
        {
          success: false,
          tokenExpired: isTokenExpired,
          error: isTokenExpired
            ? "Verifikasi otomatis sedang dalam pembaruan sesi."
            : shopeeData.msg || `ShopeePay API code ${shopeeData.code}`,
        },
        { status: isTokenExpired ? 200 : 400 },
      );
    }

    const transactions = shopeeData.data?.list || [];
    const targetAmount = Math.round(amount);

    // Persist all retrieved transactions to local PostgreSQL database
    try {
      const recordsToUpsert = transactions
        .map((t) => {
          const txId = t.transactionId || t.displayTransactionId || "";
          const parsedAmount = parseShopeeAmount(t.amount);
          const createTimeMs = t.createTime ? t.createTime * 1000 : Date.now();
          return {
            id: txId,
            amount: parsedAmount,
            currency: "IDR",
            status: t.status ?? 3,
            status_name: t.status === 3 ? "Berhasil" : "Menunggu",
            merchant_id: "20463602",
            store_id: "23091772",
            transaction_time: createTimeMs,
            raw_data: t,
            sync_source: "payment_check",
          };
        })
        .filter((r) => r.id !== "");

      if (recordsToUpsert.length > 0) {
        await upsertShopeeTransactions(recordsToUpsert);
      }
    } catch (dbErr) {
      console.warn("Error persisting ShopeePay transactions to DB:", dbErr);
    }

    // Look for matching un-claimed transaction
    const matchedTx = transactions.find((tx) => {
      if (tx.status !== 3) return false;

      // Amount in Shopee response can be "45.000" or raw number
      const txAmount = Math.round(parseShopeeAmount(tx.amount));
      const txId = tx.transactionId || tx.displayTransactionId;

      if (!txId) return false;
      if (claimedTransactions.has(txId)) return false;

      return txAmount === targetAmount;
    });

    if (!matchedTx) {
      return NextResponse.json({
        success: true,
        paid: false,
      });
    }

    const matchedId = matchedTx.transactionId || matchedTx.displayTransactionId;
    if (matchedId) {
      claimedTransactions.set(matchedId, Date.now());
    }

    // Try to resolve payment issuer (e.g. Seabank, BCA, GoPay, OVO, Dana)
    let issuer = "QRIS / ShopeePay";
    if (matchedTx.transactionId) {
      try {
        const detailResponse = await fetch(
          "https://shopeepay.shopee.co.id/merchant/v1/partner-web/get-transaction-detail",
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
                order_sn: matchedTx.transactionId,
              },
            }),
            cache: "no-store",
          },
        );

        if (detailResponse.ok) {
          const detailData =
            (await detailResponse.json()) as ShopeeDetailResponse;
          if (detailData.code === 0 && detailData.data?.issuer) {
            issuer = detailData.data.issuer;
          }
        }
      } catch {
        // detail lookup is optional
      }
    }

    // Link transaction to order in local database
    if (matchedId) {
      try {
        await linkTransactionToOrder(matchedId, orderId || "", customerName);
      } catch (linkErr) {
        console.warn("Error linking transaction in DB:", linkErr);
      }
    }

    // If orderId was provided and request has Authorization, update order in backend
    const authHeader = request.headers.get("authorization");
    const backendUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

    if (orderId && authHeader) {
      try {
        await fetch(`${backendUrl}/orders/${orderId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            payment_status: "paid",
          }),
        });
      } catch (err) {
        console.warn("Auto-update order payment status warning:", err);
      }
    }

    return NextResponse.json({
      success: true,
      paid: true,
      transaction: {
        transactionId: matchedId,
        amount: targetAmount,
        createTime: matchedTx.createTime,
        issuer,
      },
    });
  } catch (error) {
    console.error("Check payment error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal error",
      },
      { status: 500 },
    );
  }
}
