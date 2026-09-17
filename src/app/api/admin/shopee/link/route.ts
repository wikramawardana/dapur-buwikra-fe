import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { linkTransactionToOrder } from "@/lib/shopee-db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized access: Admin role required" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const transactionId = body.transactionId as string;
    const orderId = body.orderId as string;
    const customerName = body.customerName as string | undefined;
    const markOrderPaid = Boolean(body.markOrderPaid ?? true);

    if (!transactionId || !orderId) {
      return NextResponse.json(
        { success: false, error: "transactionId and orderId are required" },
        { status: 400 },
      );
    }

    const linked = await linkTransactionToOrder(
      transactionId,
      orderId,
      customerName,
    );

    if (!linked) {
      return NextResponse.json(
        { success: false, error: "Transaksi tidak ditemukan" },
        { status: 404 },
      );
    }

    if (markOrderPaid) {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
      const authHeader = request.headers.get("authorization");

      try {
        await fetch(`${backendUrl}/orders/${orderId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
          body: JSON.stringify({
            payment_status: "paid",
          }),
        });
      } catch (err) {
        console.warn("Manual link order update warning:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Transaksi ${transactionId} berhasil dihubungkan ke pesanan #${orderId}`,
    });
  } catch (error) {
    console.error("Link transaction error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal error",
      },
      { status: 500 },
    );
  }
}
