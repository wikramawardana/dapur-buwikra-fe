import { Suspense } from "react";
import { OrderPageView } from "@/components/customer-order/order-page-view";
import { Spinner } from "@/components/ui/spinner";

export default async function OrderWeekPage({
  params,
}: {
  params: Promise<{ week: string }>;
}) {
  const { week } = await params;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f7f5f0]">
          <Spinner className="h-10 w-10 text-black" />
        </div>
      }
    >
      <OrderPageView initialWeek={week} />
    </Suspense>
  );
}
