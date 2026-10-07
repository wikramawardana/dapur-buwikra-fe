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
import { cmsErrorMessage } from "@/lib/cms-messages";
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
      toast.error("Gagal memuat biaya belanja");
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
      toast.error("Masukkan biaya belanja yang valid");
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
        toast.success("Biaya belanja berhasil diperbarui");
      } else {
        await createWeeklyExpense(payload);
        toast.success("Biaya belanja berhasil ditambahkan");
      }
      setIsDialogOpen(false);
      await fetchExpenses();
    } catch (error) {
      toast.error(cmsErrorMessage(error, "Gagal menyimpan biaya belanja"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingExpense) return;
    setIsSubmitting(true);
    try {
      await deleteWeeklyExpense(deletingExpense.id);
      toast.success("Biaya belanja berhasil dihapus");
      setIsDeleteDialogOpen(false);
      setDeletingExpense(null);
      await fetchExpenses();
    } catch (error) {
      toast.error(cmsErrorMessage(error, "Gagal menghapus biaya belanja"));
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
              Biaya belanja
            </CardTitle>
            <CardDescription>
              Catat setiap transaksi belanja secara terpisah. Totalnya dikurangi
              dari pendapatan mingguan.
            </CardDescription>
          </div>
          <Button
            onClick={openCreateDialog}
            className="gap-2 rounded-none border-2 border-black bg-green-400 font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-green-500 dark:border-white"
          >
            <Plus className="h-4 w-4" />
            Tambah biaya belanja
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
                Total mingguan
              </p>
              <p className="text-2xl font-black">{formatCurrency(total)}</p>
            </div>
          </div>

          <div className="overflow-x-auto border-2 border-black dark:border-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Catatan / barang</TableHead>
                  <TableHead>Minggu</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead className="w-[120px] text-right">
                    Tindakan
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
                      Belum ada biaya belanja pada minggu ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {expense.note || "Belanja"}
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
                            aria-label="Ubah biaya belanja"
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
                            aria-label="Hapus biaya belanja"
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
              {editingExpense ? "Ubah biaya belanja" : "Tambah biaya belanja"}
            </DialogTitle>
            <DialogDescription>
              Catat satu transaksi belanja untuk {formatDate(week.dateFrom)} -{" "}
              {formatDate(week.dateTo)}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shopping-cost-amount">Nominal (Rp)</Label>
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
              <Label htmlFor="shopping-cost-note">
                Catatan / barang (opsional)
              </Label>
              <Input
                id="shopping-cost-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Bahan makanan, kemasan, dan lainnya"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Simpan biaya"}
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
            <AlertDialogTitle>Hapus biaya belanja?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini menghapus{" "}
              {deletingExpense
                ? formatCurrency(deletingExpense.amount)
                : "biaya ini"}{" "}
              dari total mingguan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
