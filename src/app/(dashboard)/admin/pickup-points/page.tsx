"use client";

import { Loader2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "@/lib/auth-client";
import {
  createPickupPoint,
  deletePickupPoint,
  getPickupPoints,
  updatePickupPoint,
} from "@/services/pickup-point.service";
import type { PickupPoint } from "@/types/pickup-point.types";

export default function PickupPointsPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();
  const [points, setPoints] = React.useState<PickupPoint[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [updatingPointIds, setUpdatingPointIds] = React.useState<Set<string>>(
    new Set(),
  );
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [editingPoint, setEditingPoint] = React.useState<PickupPoint | null>(
    null,
  );
  const [deletingPoint, setDeletingPoint] = React.useState<PickupPoint | null>(
    null,
  );
  const [formName, setFormName] = React.useState("");

  React.useEffect(() => {
    if (
      !isSessionLoading &&
      (!session?.user || session.user.role !== "admin")
    ) {
      router.replace("/unauthorized");
    }
  }, [session, isSessionLoading, router]);

  const fetchPoints = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getPickupPoints();
      setPoints(response.data.data);
    } catch {
      toast.error("Gagal memuat lokasi pengantaran");
      setPoints([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (session?.user?.role === "admin") {
      fetchPoints();
    }
  }, [session?.user?.role, fetchPoints]);

  const openCreateDialog = () => {
    setEditingPoint(null);
    setFormName("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (point: PickupPoint) => {
    setEditingPoint(point);
    setFormName(point.name);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const name = formName.trim();
    if (!name) {
      toast.error("Nama lokasi pengantaran wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPoint) {
        await updatePickupPoint(editingPoint.id, { name });
        toast.success("Lokasi pengantaran berhasil diperbarui");
      } else {
        await createPickupPoint({ name });
        toast.success("Lokasi pengantaran berhasil ditambahkan");
      }
      setIsDialogOpen(false);
      await fetchPoints();
    } catch {
      toast.error(
        editingPoint
          ? "Gagal memperbarui lokasi pengantaran"
          : "Gagal menambahkan lokasi pengantaran",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (point: PickupPoint) => {
    const nextIsActive = !point.is_active;
    setUpdatingPointIds((current) => new Set(current).add(point.id));
    setPoints((current) =>
      current.map((item) =>
        item.id === point.id ? { ...item, is_active: nextIsActive } : item,
      ),
    );

    try {
      await updatePickupPoint(point.id, { is_active: nextIsActive });
      toast.success(
        `Lokasi pengantaran ${point.is_active ? "dinonaktifkan" : "diaktifkan"}`,
      );
    } catch {
      setPoints((current) =>
        current.map((item) =>
          item.id === point.id ? { ...item, is_active: point.is_active } : item,
        ),
      );
      toast.error("Gagal memperbarui lokasi pengantaran");
    } finally {
      setUpdatingPointIds((current) => {
        const next = new Set(current);
        next.delete(point.id);
        return next;
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingPoint) return;

    setIsSubmitting(true);
    try {
      await deletePickupPoint(deletingPoint.id);
      toast.success("Lokasi pengantaran berhasil dihapus");
      setIsDeleteDialogOpen(false);
      setDeletingPoint(null);
      await fetchPoints();
    } catch {
      toast.error("Gagal menghapus lokasi pengantaran");
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

  if (session?.user?.role !== "admin") {
    return null;
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Card className="neo-brutal neo-brutal-white border-2">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                <MapPin className="h-6 w-6" />
                Lokasi pengantaran
              </CardTitle>
              <CardDescription>
                Kelola lokasi yang dapat dipilih pelanggan saat memesan.
              </CardDescription>
            </div>
            <Button
              onClick={openCreateDialog}
              className="gap-2 rounded-none border-2 border-black bg-green-400 font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-green-500 dark:border-white"
            >
              <Plus className="h-4 w-4" />
              Tambah lokasi
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-8 w-8" />
              </div>
            ) : points.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Belum ada lokasi pengantaran. Klik "Tambah lokasi" untuk
                menambahkan.
              </div>
            ) : (
              <div className="neo-brutal neo-brutal-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Nama</TableHead>
                      <TableHead className="font-bold">Aktif</TableHead>
                      <TableHead className="text-center font-bold">
                        Tindakan
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {points.map((point) => (
                      <TableRow key={point.id}>
                        <TableCell className="font-medium">
                          {point.name}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={point.is_active}
                            onCheckedChange={() => handleToggleActive(point)}
                            disabled={updatingPointIds.has(point.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openEditDialog(point)}
                              className="h-8 w-8 rounded-none border-2 border-black"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => {
                                setDeletingPoint(point);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="h-8 w-8 rounded-none border-2 border-black"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-none border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>
              {editingPoint
                ? "Ubah lokasi pengantaran"
                : "Tambah lokasi pengantaran"}
            </DialogTitle>
            <DialogDescription>
              {editingPoint
                ? "Ubah nama lokasi pengantaran."
                : "Tambahkan lokasi yang dapat dipilih saat memesan."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="pickup-point-name" className="font-bold">
              Nama
            </Label>
            <Input
              id="pickup-point-name"
              value={formName}
              onChange={(event) => setFormName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSubmit();
              }}
              placeholder="Contoh: Trinity Tower - Lobi"
              className="h-12 rounded-none border-2 border-black dark:border-white"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="rounded-none border-2 border-black"
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-none border-2 border-black bg-black text-white"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingPoint ? "Simpan perubahan" : "Tambahkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="rounded-none border-2 border-black">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus lokasi pengantaran</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus "{deletingPoint?.name}"? Lokasi pada pesanan
              yang sudah dibuat tetap tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none border-2 border-black">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="rounded-none border-2 border-black bg-red-500"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
