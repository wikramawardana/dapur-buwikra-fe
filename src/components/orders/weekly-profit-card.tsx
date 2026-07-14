"use client";

import { ArrowRight, WalletCards } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import type { WeeklyExpense } from "@/types/weekly-expense.types";

interface WeeklyProfitCardProps {
  revenue: number;
  expenses: WeeklyExpense[];
  weekStart?: string;
  weekEnd?: string;
  isLoading?: boolean;
  showAmount: boolean;
}

export function WeeklyProfitCard({
  revenue,
  expenses,
  weekStart,
  weekEnd,
  isLoading,
  showAmount,
}: WeeklyProfitCardProps) {
  const router = useRouter();
  const hasExpenses = expenses.length > 0;
  const shoppingCost = expenses.reduce(
    (total, expense) => total + expense.amount,
    0,
  );
  const cleanMoney = revenue - shoppingCost;

  const openShoppingCosts = () => {
    if (!weekStart || !weekEnd) return;
    router.push(`/shopping-costs?week_start=${weekStart}`);
  };

  const displayAmount = (value: number) =>
    showAmount ? formatCurrency(value) : "Rp ••••••";

  return (
    <div className="neo-brutal border-2 border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 sm:col-span-2">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-amber-300 dark:border-white">
            <WalletCards className="h-5 w-5 text-black" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              Clean Money / Net Profit
            </p>
            <p className="text-2xl font-black text-amber-900 dark:text-amber-100 sm:text-3xl">
              {isLoading
                ? "Loading..."
                : hasExpenses
                  ? displayAmount(cleanMoney)
                  : "Add shopping costs"}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={openShoppingCosts}
          disabled={!weekStart || !weekEnd}
          className="border-2 border-black bg-white font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-amber-100 dark:border-white dark:bg-black dark:text-white dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]"
        >
          <ArrowRight className="h-4 w-4" />
          Manage shopping costs
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-2 border-t-2 border-amber-200 px-4 py-3 text-xs font-medium text-amber-800 dark:border-amber-800 dark:text-amber-200 sm:grid-cols-3">
        <span>Total revenue: {displayAmount(revenue)}</span>
        <span>
          Weekly shopping:{" "}
          {hasExpenses ? displayAmount(shoppingCost) : "Not set"}
        </span>
        <span>
          Week:{" "}
          {weekStart && weekEnd
            ? `${formatDate(weekStart)} - ${formatDate(weekEnd)}`
            : "-"}
        </span>
      </div>
    </div>
  );
}
