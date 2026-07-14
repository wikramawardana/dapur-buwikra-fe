"use client";

import { Pencil, Plus, Receipt, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { WeekSelector } from "@/components/orders/week-selector";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "@/lib/auth-client";
import { formatCurrency, formatDate } from "@/lib/format";
import { getDefaultWeek, getWeekRange } from "@/lib/week-utils";
import {
  createWeeklyExpense,
  deleteWeeklyExpense,
  getWeeklyExpenses,
  updateWeeklyExpense,
} from "@/services/weekly-expense.service";
import type { WeeklyExpense } from "@/types/weekly-expense.types";

export default function ShoppingCostsPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();
  const [week, setWeek] = React.useState(getDefaultWeek);
  const [expenses, setExpenses] = React.useState<WeeklyExpense[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] =
    React.useState<WeeklyExpense | null>(null);
  const [deletingExpense, setDeletingExpense] =
    React.useState<WeeklyExpense | null>(null);
  const [amount, setAmount] = React.useState("");
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    const queryWeekStart = new URLSearchParams(window.location.search).get(
      "week_start",
    );
    if (!queryWeekStart) return;
    setWeek(getWeekRange(new Date(`${queryWeekStart}T12:00:00`)));
  }, []);

  React.useEffect(() => {
    if (
      !isSessionLoading &&
      (!session?.user || !["admin", "chef"].includes(session.user.role ?? ""))
    ) {
      router.replace("/unauthorized");
    }
  }, [session, isSessionLoading, router]);

  const fetchExpenses = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getWeeklyExpenses(week.dateFrom);
      setExpenses(response.data);
    } catch {
      toast.error("Failed to load shopping costs");
      setExpenses([]);
    } finally {
      setIsLoading(false);
    }
  }, [week.dateFrom]);

  React.useEffect(() => {
    if (["admin", "chef"].includes(session?.user?.role ?? "")) {
      fetchExpenses();
    }
  }, [session?.user?.role, fetchExpenses]);

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const openCreateDialog = () => {
    setEditingExpense(null);
    setAmount("");
    setNote("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (expense: WeeklyExpense) => {
    setEditingExpense(expense);
    setAmount(String(expense.amount));
    setNote(expense.note ?? "");
    setIsDialogOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      toast.error("Enter a valid shopping cost");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      week_start: week.dateFrom,
      week_end: week.dateTo,
      amount: parsedAmount,
      note: note.trim() || undefined,
    };

    try {
      if (editingExpense) {
        await updateWeeklyExpense(editingExpense.id, payload);
        toast.success("Shopping cost updated");
      } else {
        await createWeeklyExpense(payload);
        toast.success("Shopping cost added");
      }
      setIsDialogOpen(false);
      await fetchExpenses();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save shopping cost",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingExpense) return;
    setIsSubmitting(true);
    try {
      await deleteWeeklyExpense(deletingExpense.id);
      toast.success("Shopping cost deleted");
      setIsDeleteDialogOpen(false);
      setDeletingExpense(null);
      await fetchExpenses();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete shopping cost",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSessionLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!session?.user || !["admin", "chef"].includes(session.user.role ?? "")) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Card className="neo-brutal neo-brutal-white border-2">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl font-bold">
              <Receipt className="h-6 w-6" />
              Shopping Costs
            </CardTitle>
            <CardDescription>
              Add each shopping trip separately. The total is deducted from
              weekly revenue.
            </CardDescription>
          </div>
          <Button
            onClick={openCreateDialog}
            className="gap-2 rounded-none border-2 border-black bg-green-400 font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-green-500 dark:border-white"
          >
            <Plus className="h-4 w-4" />
            Add shopping cost
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 border-2 border-black bg-yellow-50 p-3 dark:border-white dark:bg-yellow-950 sm:flex-row sm:items-center sm:justify-between">
            <WeekSelector
              value={week.dateFrom}
              onChange={(dateFrom, dateTo) => setWeek({ dateFrom, dateTo })}
            />
            <div className="text-left sm:text-right">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Weekly total
              </p>
              <p className="text-2xl font-black">{formatCurrency(total)}</p>
            </div>
          </div>

          <div className="overflow-x-auto border-2 border-black dark:border-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Note / item</TableHead>
                  <TableHead>Week</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[120px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center">
                      <Spinner className="mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : expenses.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No shopping costs recorded for this week.
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {expense.note || "Shopping"}
                      </TableCell>
                      <TableCell>{`${formatDate(expense.week_start)} - ${formatDate(expense.week_end)}`}</TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(expense)}
                            aria-label="Edit shopping cost"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setDeletingExpense(expense);
                              setIsDeleteDialogOpen(true);
                            }}
                            aria-label="Delete shopping cost"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-none border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Edit shopping cost" : "Add shopping cost"}
            </DialogTitle>
            <DialogDescription>
              Record one shopping trip or purchase for{" "}
              {formatDate(week.dateFrom)} - {formatDate(week.dateTo)}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shopping-cost-amount">Amount (Rp)</Label>
              <Input
                id="shopping-cost-amount"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="500000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shopping-cost-note">Note / item (optional)</Label>
              <Input
                id="shopping-cost-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Ingredients, packaging, etc."
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save cost"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete shopping cost?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove{" "}
              {deletingExpense
                ? formatCurrency(deletingExpense.amount)
                : "this expense"}{" "}
              from the weekly total.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
