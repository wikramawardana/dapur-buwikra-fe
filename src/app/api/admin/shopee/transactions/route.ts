import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import {
  getShopeeSummaryStats,
  getShopeeTransactionsList,
} from "@/lib/shopee-db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized access: Admin role required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const search = searchParams.get("search") || undefined;
    const statusFilter =
      (searchParams.get("status") as "all" | "claimed" | "unclaimed") || "all";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const [listResult, summary] = await Promise.all([
      getShopeeTransactionsList({
        page,
        limit,
        search,
        statusFilter,
        startDate,
        endDate,
      }),
      getShopeeSummaryStats(startDate, endDate),
    ]);

    return NextResponse.json({
      success: true,
      data: listResult.data,
      pagination: {
        total: listResult.total,
        page: listResult.page,
        limit: listResult.limit,
        totalPages: listResult.totalPages,
      },
      summary,
    });
  } catch (error) {
    console.error("Admin get Shopee transactions error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
