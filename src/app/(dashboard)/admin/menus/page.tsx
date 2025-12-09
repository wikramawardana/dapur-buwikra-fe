"use client";

import { format } from "date-fns";
import {
  CalendarIcon,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import Image from "next/image";
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { UserMenu } from "@/components/user-menu";
import { useSession } from "@/lib/auth-client";
import { formatCurrency } from "@/lib/format";
import {
  createMenu,
  deleteMenu,
  getMenus,
  updateMenu,
  uploadMenuImage,
} from "@/services/menu.service";
import type { Menu, MenuItem } from "@/types/menu.types";

export default function MenusPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();
  const [menus, setMenus] = React.useState<Menu[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [editingMenu, setEditingMenu] = React.useState<Menu | null>(null);
  const [deletingMenu, setDeletingMenu] = React.useState<Menu | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [_isUploadingImage, setIsUploadingImage] = React.useState(false);

  // Form state
  const [formTitle, setFormTitle] = React.useState("");
  const [formDescription, setFormDescription] = React.useState("");
  const [formStartDate, setFormStartDate] = React.useState<Date | undefined>();
  const [formEndDate, setFormEndDate] = React.useState<Date | undefined>();
  const [formItems, setFormItems] = React.useState<MenuItem[]>([]);
  const [formIsActive, setFormIsActive] = React.useState(true);

  const userRole = session?.user?.role;
  const canAccess = userRole === "admin" || userRole === "chef";

  // Check auth
  React.useEffect(() => {
    if (!isSessionLoading && !canAccess) {
      router.replace("/unauthorized");
    }
  }, [isSessionLoading, router, canAccess]);

  // Fetch data
  const fetchMenus = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getMenus();
      // Handle both { data: [...] } and direct array responses
      const menuData = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];
      setMenus(menuData);
    } catch (_error) {
      toast.error("Failed to load menus");
      setMenus([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (canAccess) {
      fetchMenus();
    }
  }, [canAccess, fetchMenus]);

  const openCreateDialog = () => {
    setEditingMenu(null);
    setFormTitle("");
    setFormDescription("");
    setFormStartDate(undefined);
    setFormEndDate(undefined);
    setFormItems([{ name: "", description: "", price: 0 }]);
    setFormIsActive(true);
    setIsDialogOpen(true);
  };

  const openEditDialog = (menu: Menu) => {
    setEditingMenu(menu);
    setFormTitle(menu.title);
    setFormDescription(menu.description || "");
    setFormStartDate(new Date(menu.start_date));
    setFormEndDate(new Date(menu.end_date));
    setFormItems(
      menu.items.length > 0
        ? menu.items
        : [{ name: "", description: "", price: 0 }],
    );
    setFormIsActive(menu.is_active);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (menu: Menu) => {
    setDeletingMenu(menu);
    setIsDeleteDialogOpen(true);
  };

  const addMenuItem = () => {
    setFormItems([...formItems, { name: "", description: "", price: 0 }]);
  };

  const updateMenuItem = (
    index: number,
    field: keyof MenuItem,
    value: string | number,
  ) => {
    const newItems = [...formItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormItems(newItems);
  };

  const removeMenuItem = (index: number) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!formTitle.trim() || !formStartDate || !formEndDate) {
      toast.error("Please fill required fields (title, dates)");
      return;
    }

    const validItems = formItems.filter((item) => item.name.trim());
    if (validItems.length === 0) {
      toast.error("Please add at least one menu item");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingMenu) {
        await updateMenu(editingMenu.id, {
          title: formTitle,
          description: formDescription,
          items: validItems,
          is_active: formIsActive,
        });
        toast.success("Menu updated successfully");
      } else {
        await createMenu({
          title: formTitle,
          description: formDescription,
          start_date: format(formStartDate, "yyyy-MM-dd"),
          end_date: format(formEndDate, "yyyy-MM-dd"),
          items: validItems,
          is_active: formIsActive,
        });
        toast.success("Menu created successfully");
      }
      setIsDialogOpen(false);
      fetchMenus();
    } catch (_error) {
      toast.error(
        editingMenu ? "Failed to update menu" : "Failed to create menu",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMenu) return;

    setIsSubmitting(true);
    try {
      await deleteMenu(deletingMenu.id);
      toast.success("Menu deleted successfully");
      setIsDeleteDialogOpen(false);
      fetchMenus();
    } catch (_error) {
      toast.error("Failed to delete menu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (menuId: string, file: File) => {
    setIsUploadingImage(true);
    try {
      await uploadMenuImage(menuId, file);
      toast.success("Image uploaded successfully");
      fetchMenus();
    } catch (_error) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleToggleActive = async (menu: Menu) => {
    try {
      await updateMenu(menu.id, { is_active: !menu.is_active });
      toast.success(`Menu ${menu.is_active ? "deactivated" : "activated"}`);
      fetchMenus();
    } catch (_error) {
      toast.error("Failed to update menu");
    }
  };

  if (isSessionLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!canAccess) {
    return null;
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Menus</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <UserMenu />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <Card className="neo-brutal neo-brutal-white border-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <UtensilsCrossed className="h-6 w-6" />
                Menu Management
              </CardTitle>
              <CardDescription>
                Create and manage weekly menus with images
              </CardDescription>
            </div>
            <Button
              onClick={openCreateDialog}
              className="gap-2 font-bold border-2 border-black dark:border-white bg-green-400 text-black hover:bg-green-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none"
            >
              <Plus className="h-4 w-4" />
              Create Menu
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-8 w-8" />
              </div>
            ) : menus.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No menus yet. Click "Create Menu" to add one.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {menus.map((menu) => (
                  <Card
                    key={menu.id}
                    className="border-2 border-black overflow-hidden"
                  >
                    {/* Menu Images */}
                    {menu.images && menu.images.length > 0 ? (
                      <div className="h-40 bg-gray-100 relative">
                        <Image
                          src={menu.images[0]}
                          alt={menu.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-40 bg-gray-100 flex items-center justify-center">
                        <label className="cursor-pointer flex flex-col items-center text-gray-400 hover:text-gray-600">
                          <ImagePlus className="h-8 w-8 mb-2" />
                          <span className="text-sm">Upload Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(menu.id, file);
                            }}
                          />
                        </label>
                      </div>
                    )}

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-lg">{menu.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {menu.start_date} → {menu.end_date}
                          </p>
                        </div>
                        <Switch
                          checked={menu.is_active}
                          onCheckedChange={() => handleToggleActive(menu)}
                        />
                      </div>

                      {menu.description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {menu.description}
                        </p>
                      )}

                      {/* Menu Items */}
                      <div className="space-y-1 mb-3">
                        {menu.items.slice(0, 3).map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm"
                          >
                            <span>{item.name}</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(item.price)}
                            </span>
                          </div>
                        ))}
                        {menu.items.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{menu.items.length - 3} more items
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(menu)}
                          className="flex-1 border-2 border-black rounded-none"
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteDialog(menu)}
                          className="border-2 border-black rounded-none"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingMenu ? "Edit Menu" : "Create New Menu"}
            </DialogTitle>
            <DialogDescription>
              {editingMenu
                ? "Update the menu details."
                : "Create a new weekly menu."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-bold">Title *</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g., Menu Minggu 9-13 Desember"
                className="h-12 border-2 border-black rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Description</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Menu description..."
                className="border-2 border-black rounded-none"
              />
            </div>

            {!editingMenu && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold">Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start h-12 border-2 border-black rounded-none"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formStartDate
                          ? format(formStartDate, "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formStartDate}
                        onSelect={setFormStartDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">End Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start h-12 border-2 border-black rounded-none"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formEndDate
                          ? format(formEndDate, "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formEndDate}
                        onSelect={setFormEndDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                checked={formIsActive}
                onCheckedChange={setFormIsActive}
              />
              <Label>Active</Label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-bold">Menu Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMenuItem}
                  className="border-2 border-black rounded-none"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              {formItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex gap-2 items-start p-3 border-2 border-black/20 bg-gray-50"
                >
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) =>
                        updateMenuItem(idx, "name", e.target.value)
                      }
                      className="border-2 border-black rounded-none"
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={item.description || ""}
                      onChange={(e) =>
                        updateMenuItem(idx, "description", e.target.value)
                      }
                      className="border-2 border-black rounded-none"
                    />
                  </div>
                  <Input
                    type="number"
                    placeholder="Price"
                    value={item.price || ""}
                    onChange={(e) =>
                      updateMenuItem(
                        idx,
                        "price",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="w-28 border-2 border-black rounded-none"
                  />
                  {formItems.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeMenuItem(idx)}
                      className="border-2 border-black rounded-none"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
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
              {editingMenu ? "Update" : "Create"}
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
            <AlertDialogTitle>Delete Menu</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingMenu?.title}"? This will
              also delete all associated images.
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
