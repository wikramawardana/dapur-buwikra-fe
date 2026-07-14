"use client";

import { Pencil, WalletCards } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/format";
import { saveWeeklyExpense } from "@/services/weekly-expense.service";
import type { WeeklyExpense } from "@/types/weekly-expense.types";

interface WeeklyProfitCardProps {
  revenue: number;
  expense: WeeklyExpense | null;
  weekStart?: string;
  weekEnd?: string;
  isLoading?: boolean;
  showAmount: boolean;
  onExpenseSaved: (expense: WeeklyExpense) => void;
}

export function WeeklyProfitCard({
  revenue,
  expense,
  weekStart,
  weekEnd,
  isLoading,
  showAmount,
  onExpenseSaved,
}: WeeklyProfitCardProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [note, setNote] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  const hasExpense = expense !== null;
  const shoppingCost = expense?.amount ?? 0;
  const cleanMoney = revenue - shoppingCost;

  React.useEffect(() => {
    if (!isDialogOpen) return;
    setAmount(expense ? String(expense.amount) : "");
    setNote(expense?.note ?? "");
  }, [isDialogOpen, expense]);

  const openDialog = () => {
    if (!weekStart || !weekEnd) {
      toast.error("Select a complete week before entering shopping cost");
      return;
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!weekStart || !weekEnd) return;

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      toast.error("Enter a valid shopping cost");
      return;
    }

    setIsSaving(true);
    try {
      const response = await saveWeeklyExpense({
        week_start: weekStart,
        week_end: weekEnd,
        amount: parsedAmount,
        note: note.trim() || undefined,
      });
      onExpenseSaved(response.data);
      setIsDialogOpen(false);
      toast.success("Weekly shopping cost saved");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save weekly shopping cost",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const displayAmount = (value: number) =>
    showAmount ? formatCurrency(value) : "Rp ••••••";

  return (
    <>
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
                  : hasExpense
                    ? displayAmount(cleanMoney)
                    : "Set shopping cost"}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={openDialog}
            className="border-2 border-black bg-white font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-amber-100 dark:border-white dark:bg-black dark:text-white dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]"
          >
            <Pencil className="h-4 w-4" />
            {hasExpense ? "Edit shopping cost" : "Add shopping cost"}
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-2 border-t-2 border-amber-200 px-4 py-3 text-xs font-medium text-amber-800 dark:border-amber-800 dark:text-amber-200 sm:grid-cols-3">
          <span>Total revenue: {displayAmount(revenue)}</span>
          <span>
            Weekly shopping:{" "}
            {hasExpense ? displayAmount(shoppingCost) : "Not set"}
          </span>
          <span>
            Week:{" "}
            {weekStart && weekEnd
              ? `${formatDate(weekStart)} - ${formatDate(weekEnd)}`
              : "-"}
          </span>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-none border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
          <DialogHeader>
            <DialogTitle>Weekly Shopping Cost</DialogTitle>
            <DialogDescription>
              Enter the total amount spent shopping for this week. It will be
              deducted from total revenue.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Week</Label>
              <p className="text-sm font-bold">
                {weekStart && weekEnd
                  ? `${formatDate(weekStart)} - ${formatDate(weekEnd)}`
                  : "-"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekly-shopping-cost">Shopping cost (Rp)</Label>
              <Input
                id="weekly-shopping-cost"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="2000000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekly-shopping-note">Note (optional)</Label>
              <Input
                id="weekly-shopping-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Ingredients and packaging"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save cost"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
