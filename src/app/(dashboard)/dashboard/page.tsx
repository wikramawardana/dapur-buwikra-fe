"use client";

import {
  ArrowRight,
  Banknote,
  CalendarCheck,
  ChefHat,
  CircleDollarSign,
  Eye,
  EyeOff,
  Receipt,
  ShoppingCart,
  Utensils,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";
import { CreateOrderDialog } from "@/components/orders/create-order-dialog";
import { CustomerActivity } from "@/components/orders/customer-activity";
import { WeekSelector } from "@/components/orders/week-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/auth-client";
import { formatCurrency } from "@/lib/format";
import { getDefaultWeek, getWeekValue } from "@/lib/week-utils";
import {
  getOrderCustomerActivity,
  getOrdersCount,
  getOrdersCountByDay,
  getOrdersSum,
} from "@/services/orders.service";
import { getWeeklyExpenses } from "@/services/weekly-expense.service";
import type {
  OrderCustomerActivity,
  OrderFilters,
  OrderStats,
} from "@/types/order.types";
import type { WeeklyExpense } from "@/types/weekly-expense.types";

const DAYS = [
  { name: "Monday", short: "Mon", countKey: "count_monday" as const },
  { name: "Tuesday", short: "Tue", countKey: "count_tuesday" as const },
  { name: "Wednesday", short: "Wed", countKey: "count_wednesday" as const },
  { name: "Thursday", short: "Thu", countKey: "count_thursday" as const },
  { name: "Friday", short: "Fri", countKey: "count_friday" as const },
];

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const userRole = session?.user?.role;
  const userName = session?.user?.name || session?.user?.email || "User";
  const canAccessOverview = userRole === "admin" || userRole === "chef";
  const defaultWeek = React.useMemo(() => getDefaultWeek(), []);
  const [filters, setFilters] = React.useState<OrderFilters>({
    date_from: defaultWeek.dateFrom,
    date_to: defaultWeek.dateTo,
  });
  const [stats, setStats] = React.useState<OrderStats | null>(null);
  const [expenses, setExpenses] = React.useState<WeeklyExpense[]>([]);
  const [activity, setActivity] = React.useState<OrderCustomerActivity[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showMoney, setShowMoney] = React.useState(false);
  const requestId = React.useRef(0);

  React.useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const dateFrom =
        searchParams.get("date_from") ||
        sessionStorage.getItem("selected_week_from");
      const dateTo =
        searchParams.get("date_to") ||
        sessionStorage.getItem("selected_week_to");

      if (dateFrom && dateTo) {
        setFilters((current) => ({
          ...current,
          date_from: dateFrom,
          date_to: dateTo,
        }));
      }
    } catch {}
  }, []);

  const fetchOverview = React.useCallback(async () => {
    if (!canAccessOverview || !filters.date_from) return;

    const currentRequest = ++requestId.current;
    setIsLoading(true);
    const overviewFilters = {
      date_from: filters.date_from,
      date_to: filters.date_to,
    };

    const [count, sum, byDay, weeklyExpenses, customerActivity] =
      await Promise.allSettled([
        getOrdersCount(overviewFilters),
        getOrdersSum(overviewFilters),
        getOrdersCountByDay(overviewFilters),
        getWeeklyExpenses(filters.date_from),
        getOrderCustomerActivity(),
      ]);

    if (currentRequest !== requestId.current) return;

    const hasStats =
      count.status === "fulfilled" &&
      sum.status === "fulfilled" &&
      byDay.status === "fulfilled";

    if (hasStats) {
      setStats({
        total_count: count.value.data.total_count,
        count_monday: count.value.data.monday,
        count_tuesday: count.value.data.tuesday,
        count_wednesday: count.value.data.wednesday,
        count_thursday: count.value.data.thursday,
        count_friday: count.value.data.friday,
        total_sum: sum.value.data.total_amount,
        paid_sum: sum.value.data.paid_amount,
        unpaid_sum: sum.value.data.unpaid_amount,
        count_by_day: byDay.value.data.total,
        total_nasi: byDay.value.data.total_nasi,
        total_kulit_kecil: byDay.value.data.total_kulit_kecil,
        total_kulit_besar: byDay.value.data.total_kulit_besar,
        days_breakdown: byDay.value.data.days,
      });
    } else {
      setStats(null);
    }

    setExpenses(
      weeklyExpenses.status === "fulfilled" ? weeklyExpenses.value.data : [],
    );
    setActivity(
      customerActivity.status === "fulfilled"
        ? customerActivity.value.data
        : [],
    );

    if (
      [count, sum, byDay, weeklyExpenses, customerActivity].some(
        (result) => result.status === "rejected",
      )
    ) {
      toast.error("Some dashboard data could not be loaded");
    }
    setIsLoading(false);
  }, [canAccessOverview, filters.date_from, filters.date_to]);

  React.useEffect(() => {
    if (session?.user && canAccessOverview) fetchOverview();
  }, [session?.user, canAccessOverview, fetchOverview]);

  if (isPending || !session?.user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!canAccessOverview) {
    return (
      <div className="flex-1 p-3 sm:p-6">
        <Card className="neo-brutal bg-orange-100 dark:bg-orange-950">
          <CardContent className="flex flex-col items-start gap-3 p-5 sm:p-6">
            <div className="flex h-11 w-11 items-center justify-center border-2 border-black bg-orange-400 dark:border-white">
              <CalendarCheck className="h-6 w-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-black">Access pending</h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Your account is ready. An administrator still needs to assign
                your role before the operational dashboard becomes available.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const shoppingCost = expenses.reduce(
    (total, expense) => total + expense.amount,
    0,
  );
  const hasShoppingCost = expenses.length > 0;
  const estimatedProfit = (stats?.total_sum ?? 0) - shoppingCost;
  const money = (value: number) =>
    showMoney ? formatCurrency(value) : "Rp ••••••";

  const handleWeekChange = (dateFrom: string, dateTo: string) => {
    setFilters({ date_from: dateFrom, date_to: dateTo });
    try {
      sessionStorage.setItem("selected_week_from", dateFrom);
      sessionStorage.setItem("selected_week_to", dateTo);
    } catch {}
  };

  const ordersForWeek = `/orders?date_from=${filters.date_from}&date_to=${filters.date_to}`;
  const unpaidOrdersForWeek = `${ordersForWeek}&payment_status=unpaid`;

  return (
    <div className="flex-1 space-y-4 p-3 sm:space-y-5 sm:p-6">
      <section className="flex flex-col gap-4 border-b-2 border-black/10 pb-4 dark:border-white/10 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-black bg-yellow-400 shadow-[3px_3px_0_0_#000] dark:border-white dark:shadow-[3px_3px_0_0_#fff]">
            <ChefHat className="h-6 w-6 text-black" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Weekly overview
            </p>
            <h1 className="text-xl font-black sm:text-2xl">
              Welcome back, {userName}
            </h1>
          </div>
        </div>
        <WeekSelector
          value={getWeekValue(filters.date_from || defaultWeek.dateFrom)}
          onChange={handleWeekChange}
        />
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <CreateOrderDialog onOrderCreated={fetchOverview} />
        <Button
          asChild
          variant="outline"
          className="rounded-none border-2 font-bold"
        >
          <Link href={ordersForWeek}>
            View orders <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="rounded-none border-2 font-bold"
        >
          <Link href={`/shopping-costs?week_start=${filters.date_from}`}>
            <Receipt className="h-4 w-4" /> Add shopping cost
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto font-bold"
          onClick={() => setShowMoney((visible) => !visible)}
        >
          {showMoney ? <EyeOff /> : <Eye />}
          {showMoney ? "Hide amounts" : "Show amounts"}
        </Button>
      </div>

      {isLoading && !stats ? (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-28 rounded-none" />
          ))}
        </div>
      ) : (
        <section
          className={`grid grid-cols-2 gap-3 transition-opacity xl:grid-cols-4 ${isLoading ? "opacity-60" : ""}`}
          aria-busy={isLoading}
        >
          <Metric
            label="Total orders"
            value={`${stats?.total_count ?? 0}`}
            detail={`${stats?.total_nasi ?? 0} nasi`}
            icon={ShoppingCart}
            color="blue"
            href={ordersForWeek}
          />
          <Metric
            label="Total revenue"
            value={money(stats?.total_sum ?? 0)}
            detail={`${money(stats?.paid_sum ?? 0)} paid`}
            icon={Banknote}
            color="green"
            href={ordersForWeek}
          />
          <Metric
            label="Estimated net profit"
            value={hasShoppingCost ? money(estimatedProfit) : "Add costs"}
            detail={
              hasShoppingCost
                ? `${money(shoppingCost)} shopping cost`
                : "Shopping cost is not set"
            }
            icon={WalletCards}
            color="amber"
            href={`/shopping-costs?week_start=${filters.date_from}`}
          />
          <Metric
            label="Unpaid amount"
            value={money(stats?.unpaid_sum ?? 0)}
            detail="Needs collection"
            icon={CircleDollarSign}
            color="red"
            href={unpaidOrdersForWeek}
          />
        </section>
      )}

      <section className="neo-brutal neo-brutal-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-black">Orders by day</h2>
            <p className="text-xs text-muted-foreground">
              Customers and meal portions for the selected week
            </p>
          </div>
          <Utensils className="h-5 w-5 text-blue-600" />
        </div>
        <div className="grid grid-cols-5 gap-2">
          {DAYS.map(({ name, short, countKey }) => {
            const orderCount = stats?.[countKey] ?? 0;
            const nasiCount =
              stats?.days_breakdown?.find((day) => day.day === name)
                ?.nasi_count ?? 0;
            return (
              <div
                key={name}
                className={`border-2 p-2 sm:p-3 ${
                  orderCount > 0
                    ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
                    : "border-black/10 bg-muted/40 opacity-60 dark:border-white/10"
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-wide sm:text-xs">
                  {short}
                </p>
                <p className="mt-1 text-xl font-black sm:text-2xl">
                  {orderCount}
                </p>
                <p className="text-[10px] text-muted-foreground sm:text-xs">
                  {nasiCount} nasi
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <CustomerActivity activities={activity} isLoading={isLoading} />
        <Card className="neo-brutal neo-brutal-white">
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                At a glance
              </p>
              <h2 className="mt-1 text-lg font-black">Payment health</h2>
            </div>
            <div className="space-y-3 text-sm">
              <SummaryRow
                label="Paid"
                value={money(stats?.paid_sum ?? 0)}
                className="text-green-700 dark:text-green-300"
              />
              <SummaryRow
                label="Unpaid"
                value={money(stats?.unpaid_sum ?? 0)}
                className="text-red-700 dark:text-red-300"
              />
              <SummaryRow
                label="Shopping cost"
                value={hasShoppingCost ? money(shoppingCost) : "Not set"}
                className="text-amber-700 dark:text-amber-300"
              />
            </div>
            <Button asChild className="w-full rounded-none font-bold">
              <Link href={ordersForWeek}>Review orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type MetricColor = "blue" | "green" | "amber" | "red";

const metricColors: Record<MetricColor, string> = {
  blue: "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
  green: "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950",
  amber: "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950",
  red: "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950",
};

function Metric({
  label,
  value,
  detail,
  icon: Icon,
  color,
  href,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  color: MetricColor;
  href: string;
}) {
  return (
    <Link href={href} className="block min-w-0">
      <Card
        className={`neo-brutal h-full transition-transform hover:-translate-y-0.5 ${metricColors[color]}`}
      >
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:text-xs">
              {label}
            </p>
            <Icon className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
          </div>
          <p
            className="mt-2 truncate text-xl font-black sm:text-2xl"
            title={value}
          >
            {value}
          </p>
          <p className="mt-1 truncate text-[10px] text-muted-foreground sm:text-xs">
            {detail}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function SummaryRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-black/10 pb-2 last:border-0 dark:border-white/10">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-black ${className}`}>{value}</span>
    </div>
  );
}
