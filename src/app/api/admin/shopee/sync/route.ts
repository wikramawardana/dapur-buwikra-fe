import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import {
  getEffectiveShopeeToken,
  parseShopeeAmount,
  type ShopeeTxRecord,
  upsertShopeeTransactions,
} from "@/lib/shopee-db";

interface ShopeeRawTx {
  transactionId?: string;
  displayTransactionId?: string;
  amount?: string | number;
  status?: number;
  statusName?: string;
  createTime?: number;
  storeId?: string;
  terminalId?: string;
  merchantId?: string;
  serviceType?: number;
  referenceId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized access: Admin role required" },
        { status: 401 },
      );
    }

    const token = await getEffectiveShopeeToken();
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "SHOPEE_PARTNER_TOKEN belum dikonfigurasi.",
        },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const days = Math.min(90, Math.max(1, Number(body.days) || 7));

    const nowSeconds = Math.floor(Date.now() / 1000);
    const startTime = nowSeconds - days * 24 * 60 * 60;

    const listHeaders = {
      "Content-Type": "application/json",
      Origin: "https://partner.shopee.co.id",
      Referer: "https://partner.shopee.co.id/",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "X-Timestamp-Ms": Date.now().toString(),
    };

    let nextPosition = "";
    let pageCount = 0;
    const maxPages = 5;
    const allFetchedTransactions: ShopeeRawTx[] = [];

    while (pageCount < maxPages) {
      pageCount++;
      const listPayload = {
        data: {
          metadata: {
            token,
            language: "id",
            timezone: "Asia/Jakarta",
          },
          pageSize: 50,
          filter: {
            startTime,
            endTime: nowSeconds,
            serviceList: [1, 3],
          },
          sorter: {
            field: "createTime",
            order: "descend",
          },
          next_position: nextPosition,
        },
      };

      const resp = await fetch(
        "https://shopeepay.shopee.co.id/merchant/v1/partner-web/get-transaction-list",
        {
          method: "POST",
          headers: listHeaders,
          body: JSON.stringify(listPayload),
          cache: "no-store",
        },
      );

      if (!resp.ok) {
        throw new Error(`ShopeePay API error HTTP ${resp.status}`);
      }

      const resData = await resp.json();
      if (resData.code !== 0) {
        const isExpired =
          resData.code === 200020 ||
          resData.msg?.toLowerCase().includes("token");
        return NextResponse.json(
          {
            success: false,
            tokenExpired: isExpired,
            error: isExpired
              ? "Sesi ShopeePay Partner telah berakhir (token expired). Silakan perbarui session token."
              : resData.msg || `ShopeePay code ${resData.code}`,
          },
          { status: 400 },
        );
      }

      const list: ShopeeRawTx[] = resData.data?.list || [];
      allFetchedTransactions.push(...list);

      nextPosition = resData.data?.next_position || "";
      if (!nextPosition || list.length === 0) {
        break;
      }
    }

    // Map to ShopeeTxRecord
    const txRecords: ShopeeTxRecord[] = allFetchedTransactions
      .map((t) => {
        const txId = t.transactionId || t.displayTransactionId || "";
        const amt = parseShopeeAmount(t.amount);
        const timeMs = t.createTime ? t.createTime * 1000 : Date.now();
        return {
          id: txId,
          amount: amt,
          currency: "IDR",
          status: t.status ?? 3,
          status_name:
            t.statusName || (t.status === 3 ? "Berhasil" : "Menunggu"),
          merchant_id: t.merchantId || "20463602",
          store_id: t.storeId || "23091772",
          terminal_id: t.terminalId || "A01",
          reference_id: t.referenceId || "",
          service_type: t.serviceType ?? 1,
          transaction_time: timeMs,
          raw_data: t,
          sync_source: "manual_sync",
        };
      })
      .filter((r) => r.id !== "");

    // Fetch issuer details for top 10 latest if missing
    for (const record of txRecords.slice(0, 10)) {
      if (!record.issuer_name && record.id) {
        try {
          const detailResp = await fetch(
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
                  order_sn: record.id,
                },
              }),
              cache: "no-store",
            },
          );
          if (detailResp.ok) {
            const detailJson = await detailResp.json();
            if (detailJson.code === 0 && detailJson.data?.issuer) {
              record.issuer_name = detailJson.data.issuer;
            }
          }
        } catch {
          // ignore optional detail fetch error
        }
      }
    }

    const { inserted, updated } = await upsertShopeeTransactions(txRecords);

    return NextResponse.json({
      success: true,
      count: txRecords.length,
      inserted,
      updated,
      tokenExpired: false,
      message: `Berhasil menyinkronkan ${txRecords.length} transaksi (${inserted} baru, ${updated} diperbarui).`,
    });
  } catch (error) {
    console.error("Shopee sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Sync error",
      },
      { status: 500 },
    );
  }
}
