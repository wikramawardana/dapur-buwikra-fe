"use client";

import { DollarSign, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
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

  // Form state
  const [formName, setFormName] = React.useState("");
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
      toast.error("Failed to load price list");
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
    setFormPrice("");
    setFormCategory("main");
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: PriceListItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormPrice(item.price.toString());
    setFormCategory(item.category);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (item: PriceListItem) => {
    setDeletingItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formPrice) {
      toast.error("Please fill all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updatePriceListItem(editingItem.id, {
          name: formName,
          price: parseFloat(formPrice),
          category: formCategory,
        });
        toast.success("Item updated successfully");
      } else {
        await createPriceListItem({
          name: formName,
          price: parseFloat(formPrice),
          category: formCategory,
        });
        toast.success("Item created successfully");
      }
      setIsDialogOpen(false);
      fetchItems();
    } catch (_error) {
      toast.error(
        editingItem ? "Failed to update item" : "Failed to create item",
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
      toast.success("Item deleted successfully");
      setIsDeleteDialogOpen(false);
      fetchItems();
    } catch (_error) {
      toast.error("Failed to delete item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (item: PriceListItem) => {
    try {
      await updatePriceListItem(item.id, { is_active: !item.is_active });
      toast.success(`Item ${item.is_active ? "deactivated" : "activated"}`);
      fetchItems();
    } catch (_error) {
      toast.error("Failed to update item");
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
      <PageHeader breadcrumbs={[{ label: "Price List" }]} />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <Card className="neo-brutal neo-brutal-white border-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <DollarSign className="h-6 w-6" />
                Price List Management
              </CardTitle>
              <CardDescription>
                Manage menu items and add-ons with their prices
              </CardDescription>
            </div>
            <Button
              onClick={openCreateDialog}
              className="gap-2 font-bold border-2 border-black dark:border-white bg-green-400 text-black hover:bg-green-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-8 w-8" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No items yet. Click "Add Item" to create one.
              </div>
            ) : (
              <div className="neo-brutal neo-brutal-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Name</TableHead>
                      <TableHead className="font-bold">Price</TableHead>
                      <TableHead className="font-bold">Category</TableHead>
                      <TableHead className="font-bold">Active</TableHead>
                      <TableHead className="font-bold text-center">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.name}
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          {formatCurrency(item.price)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 text-xs font-bold uppercase border-2 border-black ${
                              item.category === "main"
                                ? "bg-blue-200"
                                : "bg-amber-200"
                            }`}
                          >
                            {item.category}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={item.is_active}
                            onCheckedChange={() => handleToggleActive(item)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openEditDialog(item)}
                              className="h-8 w-8 border-2 border-black rounded-none"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
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
              {editingItem ? "Edit Item" : "Add New Item"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update the item details."
                : "Create a new price list item."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-bold">Name</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Nasi Goreng"
                className="h-12 border-2 border-black rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Price (IDR)</Label>
              <Input
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="e.g., 17500"
                className="h-12 border-2 border-black rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Category</Label>
              <Select
                value={formCategory}
                onValueChange={(v) => setFormCategory(v as PriceListCategory)}
              >
                <SelectTrigger className="h-12 border-2 border-black rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main (Per Day Item)</SelectItem>
                  <SelectItem value="addon">Add-on</SelectItem>
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
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="border-2 border-black bg-black text-white rounded-none"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingItem ? "Update" : "Create"}
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
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingItem?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2 border-black rounded-none">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-500 border-2 border-black rounded-none"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
