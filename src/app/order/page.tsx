import { redirect } from "next/navigation";
import { getDefaultWeek } from "@/lib/week-utils";

export default async function OrderRootPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; location?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const week = resolvedSearchParams.week || getDefaultWeek().dateFrom;
  const query = resolvedSearchParams.location
    ? `?${new URLSearchParams({ location: resolvedSearchParams.location }).toString()}`
    : "";
  redirect(`/order/${week}${query}`);
}
