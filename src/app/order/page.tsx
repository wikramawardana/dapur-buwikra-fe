import { redirect } from "next/navigation";
import { getDefaultWeek } from "@/lib/week-utils";

export default async function OrderRootPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const week = resolvedSearchParams.week || getDefaultWeek().dateFrom;
  redirect(`/order/${week}`);
}
