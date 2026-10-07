"use client";

import { DollarSign, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatCurrency } from "@/lib/format";
import { getPackageDisplayName } from "@/lib/office-pricing";
import {
  createPriceListItem,
  deletePriceListItem,
  getPriceList,
  updatePriceListItem,
} from "@/services/pricelist.service";
import type { PriceListCategory, PriceListItem } from "@/types/pricelist.types";

export default function PriceListPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();
  const [items, setItems] = React.useState<PriceListItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<PriceListItem | null>(
    null,
  );
  const [deletingItem, setDeletingItem] = React.useState<PriceListItem | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [priceGroup, setPriceGroup] = React.useState("all");
  const visibleItems = items.filter(
    (item) =>
      priceGroup === "all" ||
      (priceGroup === "hermina"
        ? getPackageDisplayName(item.name) !== item.name.trim()
        : getPackageDisplayName(item.name) === item.name.trim()),
  );

  // Form state
  const [formName, setFormName] = React.useState("");
  const [formOffice, setFormOffice] = React.useState("regular");
  const [formPrice, setFormPrice] = React.useState("");
  const [formCategory, setFormCategory] =
    React.useState<PriceListCategory>("main");

  // Check auth
  React.useEffect(() => {
    if (
      !isSessionLoading &&
      (!session?.user || session.user.role !== "admin")
    ) {
      router.replace("/unauthorized");
    }
  }, [session, isSessionLoading, router]);

  // Fetch data
  const fetchItems = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getPriceList();
      setItems(response.data.data);
    } catch (_error) {
      toast.error("Gagal memuat daftar harga");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (session?.user?.role === "admin") {
      fetchItems();
    }
  }, [session?.user?.role, fetchItems]);

  const openCreateDialog = () => {
    setEditingItem(null);
    setFormName("");
    setFormOffice("regular");
    setFormPrice("");
    setFormCategory("main");
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: PriceListItem) => {
    setEditingItem(item);
    setFormName(getPackageDisplayName(item.name));
    setFormOffice(
      getPackageDisplayName(item.name) !== item.name.trim()
        ? "hermina"
        : "regular",
    );
    setFormPrice(item.price.toString());
    setFormCategory(item.category);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (item: PriceListItem) => {
    setDeletingItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (
      !getPackageDisplayName(formName) ||
      !formPrice ||
      !Number.isFinite(Number(formPrice)) ||
      Number(formPrice) <= 0
    ) {
      toast.error("Isi nama paket dan harga yang lebih besar dari nol");
      return;
    }

    const catalogName = `${getPackageDisplayName(formName)}${formOffice === "hermina" ? " - Hermina" : ""}`;
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updatePriceListItem(editingItem.id, {
          name: catalogName,
          price: parseFloat(formPrice),
          category: formCategory,
        });
        toast.success("Paket berhasil diperbarui");
      } else {
        await createPriceListItem({
          name: catalogName,
          price: parseFloat(formPrice),
          category: formCategory,
        });
        toast.success("Paket berhasil ditambahkan");
      }
      setIsDialogOpen(false);
      fetchItems();
    } catch (_error) {
      toast.error(
        editingItem ? "Gagal memperbarui paket" : "Gagal menambahkan paket",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    setIsSubmitting(true);
    try {
      await deletePriceListItem(deletingItem.id);
      toast.success("Paket berhasil dihapus");
      setIsDeleteDialogOpen(false);
      fetchItems();
    } catch (_error) {
      toast.error("Gagal menghapus paket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (item: PriceListItem) => {
    try {
      await updatePriceListItem(item.id, { is_active: !item.is_active });
      toast.success(`Paket ${item.is_active ? "dinonaktifkan" : "diaktifkan"}`);
      fetchItems();
    } catch (_error) {
      toast.error("Gagal memperbarui paket");
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <DollarSign className="h-6 w-6" />
                Paket & harga
              </CardTitle>
              <CardDescription>
                Kelola harga paket dan tambahan untuk setiap lokasi.
              </CardDescription>
            </div>
            <Button
              onClick={openCreateDialog}
              className="gap-2 font-bold border-2 border-black dark:border-white bg-green-400 text-black hover:bg-green-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none"
            >
              <Plus className="h-4 w-4" />
              Tambah paket
            </Button>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="price-group">Kelompok harga</Label>
              <Select value={priceGroup} onValueChange={setPriceGroup}>
                <SelectTrigger id="price-group" className="w-full sm:w-72">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua harga</SelectItem>
                  <SelectItem value="regular">Trinity & Gama Tower</SelectItem>
                  <SelectItem value="hermina">Khusus Hermina</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Harga tanpa penanda Hermina berlaku untuk Trinity dan Gama
                Tower. Paket Hermina menggantikan paket umum dengan nama yang
                sama; tambahan umum tetap tersedia.
              </p>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-8 w-8" />
              </div>
            ) : visibleItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada paket dalam kelompok ini. Pilih kelompok lain atau
                tambah paket.
              </div>
            ) : (
              <div className="neo-brutal neo-brutal-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Nama</TableHead>
                      <TableHead className="font-bold">Lokasi harga</TableHead>
                      <TableHead className="font-bold">Harga</TableHead>
                      <TableHead className="font-bold">Kategori</TableHead>
                      <TableHead className="font-bold">Aktif</TableHead>
                      <TableHead className="font-bold text-center">
                        Tindakan
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {getPackageDisplayName(item.name)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {getPackageDisplayName(item.name) !== item.name.trim()
                            ? "Hermina"
                            : "Trinity & Gama Tower"}
                        </TableCell>
                        <TableCell className="font-bold tabular-nums">
                          {formatCurrency(item.price)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`cms-category px-2 py-1 text-xs font-bold uppercase border-2 border-black ${
                              item.category === "main"
                                ? "bg-blue-200"
                                : "bg-amber-200"
                            }`}
                          >
                            {item.category === "main" ? "Paket" : "Tambahan"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Switch
                            aria-label={`Aktifkan ${item.name}`}
                            checked={item.is_active}
                            onCheckedChange={() => handleToggleActive(item)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              aria-label={`Ubah ${item.name}`}
                              onClick={() => openEditDialog(item)}
                              className="h-8 w-8 border-2 border-black rounded-none"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              aria-label={`Hapus ${item.name}`}
                              onClick={() => openDeleteDialog(item)}
                              className="h-8 w-8 border-2 border-black rounded-none"
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingItem ? "Ubah paket" : "Tambah paket"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Ubah rincian paket dan kelompok harganya."
                : "Tambahkan paket atau tambahan baru."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="package-office">Kelompok harga</Label>
              <Select value={formOffice} onValueChange={setFormOffice}>
                <SelectTrigger id="package-office">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">
                    Trinity & Gama Tower / umum
                  </SelectItem>
                  <SelectItem value="hermina">Khusus Hermina</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Pilih lokasi harga; cukup isi nama paket tanpa tambahan nama
                kantor.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="package-name" className="font-bold">
                Nama paket
              </Label>
              <Input
                id="package-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Contoh: Porsi Mantap"
                className="h-12 border-2 border-black rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="package-price" className="font-bold">
                Harga (Rp)
              </Label>
              <Input
                id="package-price"
                min="1"
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="Contoh: 17500"
                className="h-12 border-2 border-black rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="package-category" className="font-bold">
                Kategori
              </Label>
              <Select
                value={formCategory}
                onValueChange={(v) => setFormCategory(v as PriceListCategory)}
              >
                <SelectTrigger
                  id="package-category"
                  className="h-12 border-2 border-black rounded-none"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Paket harian</SelectItem>
                  <SelectItem value="addon">Tambahan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-2 border-black rounded-none"
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="border-2 border-black bg-black text-white rounded-none"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingItem ? "Simpan perubahan" : "Tambah paket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="border-2 border-black rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus paket</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus "{deletingItem?.name}"? Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2 border-black rounded-none">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-500 border-2 border-black rounded-none"
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
