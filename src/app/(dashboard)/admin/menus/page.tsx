"use client";

import { format } from "date-fns";
import {
  CalendarIcon,
  Eye,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getUploadUrl } from "@/lib/api.config";
import { useSession } from "@/lib/auth-client";
import { formatCurrency } from "@/lib/format";
import {
  createMenu,
  deleteMenu,
  deleteMenuImage,
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
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const PAGE_SIZE = 10;

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [previewMenu, setPreviewMenu] = React.useState<Menu | null>(null);
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
  const [formImage, setFormImage] = React.useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = React.useState<string | null>(
    null,
  );

  const userRole = session?.user?.role;
  const canAccess = userRole === "admin" || userRole === "chef";

  // Check auth
  React.useEffect(() => {
    if (!isSessionLoading && !canAccess) {
      router.replace("/unauthorized");
    }
  }, [isSessionLoading, router, canAccess]);

  // Fetch data
  const fetchMenus = React.useCallback(async (page = 1, append = false) => {
    if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    try {
      const response = await getMenus({ page, page_size: PAGE_SIZE });
      const { data, pagination } = response.data;

      if (append) {
        setMenus((prev) => [...prev, ...(data || [])]);
      } else {
        setMenus(data || []);
      }
      setCurrentPage(pagination.page);
      setTotalPages(pagination.total_pages);
      setTotalItems(pagination.total_items);
    } catch (_error) {
      toast.error("Failed to load menus");
      if (!append) {
        setMenus([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  const loadMore = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      fetchMenus(currentPage + 1, true);
    }
  };

  // Refresh from page 1
  const refreshMenus = React.useCallback(() => {
    setCurrentPage(1);
    fetchMenus(1, false);
  }, [fetchMenus]);

  React.useEffect(() => {
    if (canAccess) {
      fetchMenus(1, false);
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
    setFormImage(null);
    setFormImagePreview(null);
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
    setFormImage(null);
    setFormImagePreview(
      menu.image_urls?.[0] ? getUploadUrl(menu.image_urls[0]) : null,
    );
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (menu: Menu) => {
    setDeletingMenu(menu);
    setIsDeleteDialogOpen(true);
  };

  const openPreviewDialog = (menu: Menu) => {
    setPreviewMenu(menu);
    setIsPreviewOpen(true);
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearSelectedImage = () => {
    setFormImage(null);
    setFormImagePreview(
      editingMenu?.image_urls?.[0]
        ? getUploadUrl(editingMenu.image_urls[0])
        : null,
    );
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
        // Upload new image if selected
        if (formImage) {
          await uploadMenuImage(editingMenu.id, formImage);
        }
        toast.success("Menu updated successfully");
      } else {
        // Create menu first
        const response = await createMenu({
          title: formTitle,
          description: formDescription,
          start_date: format(formStartDate, "yyyy-MM-dd"),
          end_date: format(formEndDate, "yyyy-MM-dd"),
          items: validItems,
          is_active: formIsActive,
        });
        // Upload image if selected
        if (formImage && response.data?.id) {
          await uploadMenuImage(response.data.id, formImage);
        }
        toast.success("Menu created successfully");
      }
      setIsDialogOpen(false);
      refreshMenus();
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
      // Delete all images first
      if (deletingMenu.image_urls && deletingMenu.image_urls.length > 0) {
        for (const imageUrl of deletingMenu.image_urls) {
          try {
            await deleteMenuImage(deletingMenu.id, imageUrl);
          } catch {
            // Continue even if image deletion fails
            console.warn(`Failed to delete image: ${imageUrl}`);
          }
        }
      }
      // Then delete the menu
      await deleteMenu(deletingMenu.id);
      toast.success("Menu deleted successfully");
      setIsDeleteDialogOpen(false);
      refreshMenus();
    } catch (_error) {
      toast.error("Failed to delete menu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const _handleImageUpload = async (menuId: string, file: File) => {
    setIsUploadingImage(true);
    try {
      await uploadMenuImage(menuId, file);
      toast.success("Image uploaded successfully");
      refreshMenus();
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
      refreshMenus();
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
      <PageHeader breadcrumbs={[{ label: "Menus" }]} />

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
              <div className="space-y-4">
                {menus.map((menu) => (
                  <Card
                    key={menu.id}
                    className="border-2 border-black overflow-hidden hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow cursor-pointer"
                    onClick={() => openPreviewDialog(menu)}
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Menu Image */}
                      <div className="w-full md:w-48 h-32 md:h-auto bg-gray-100 flex-shrink-0">
                        {menu.image_urls && menu.image_urls.length > 0 ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={getUploadUrl(menu.image_urls[0])}
                            alt={menu.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ImagePlus className="h-8 w-8" />
                          </div>
                        )}
                      </div>

                      {/* Menu Info */}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-lg">{menu.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              📅 {menu.start_date} → {menu.end_date}
                            </p>
                          </div>
                          <div
                            className="flex items-center gap-2"
                            role="presentation"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span
                              className={`px-2 py-1 text-xs font-bold uppercase border-2 border-black ${menu.is_active ? "bg-green-200" : "bg-gray-200"}`}
                            >
                              {menu.is_active ? "Active" : "Inactive"}
                            </span>
                            <Switch
                              checked={menu.is_active}
                              onCheckedChange={() => handleToggleActive(menu)}
                            />
                          </div>
                        </div>

                        {menu.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                            {menu.description}
                          </p>
                        )}

                        {/* Menu Items Preview */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {menu.items.slice(0, 4).map((item, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 text-xs bg-amber-100 border border-amber-300 rounded"
                            >
                              {item.name}
                            </span>
                          ))}
                          {menu.items.length > 4 && (
                            <span className="px-2 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">
                              +{menu.items.length - 4} more
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div
                          className="flex gap-2"
                          role="presentation"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPreviewDialog(menu)}
                            className="border-2 border-black rounded-none"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(menu)}
                            className="border-2 border-black rounded-none"
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
                    </div>
                  </Card>
                ))}

                {/* Load More / Pagination Info */}
                {menus.length > 0 && (
                  <div className="flex flex-col items-center gap-3 pt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {menus.length} of {totalItems} menus
                    </p>
                    {currentPage < totalPages && (
                      <Button
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        variant="outline"
                        className="border-2 border-black rounded-none"
                      >
                        {isLoadingMore ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            Load More ({totalPages - currentPage} pages
                            remaining)
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white p-0">
          {previewMenu && (
            <>
              {/* Large Image */}
              {previewMenu.image_urls && previewMenu.image_urls.length > 0 ? (
                <div className="w-full h-64 md:h-80 bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getUploadUrl(previewMenu.image_urls[0])}
                    alt={previewMenu.title}
                    className="w-full h-full object-contain bg-gray-50"
                  />
                </div>
              ) : (
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                  <ImagePlus className="h-12 w-12 text-gray-400" />
                </div>
              )}

              {/* Menu Details */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{previewMenu.title}</h2>
                    <p className="text-muted-foreground">
                      📅 {previewMenu.start_date} → {previewMenu.end_date}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 text-sm font-bold uppercase border-2 border-black ${previewMenu.is_active ? "bg-green-200" : "bg-gray-200"}`}
                  >
                    {previewMenu.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                {previewMenu.description && (
                  <p className="text-gray-600 mb-6">
                    {previewMenu.description}
                  </p>
                )}

                {/* Menu Items */}
                <div className="mb-6">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <UtensilsCrossed className="h-5 w-5" />
                    Menu Items
                  </h3>
                  <div className="space-y-2">
                    {previewMenu.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 bg-gray-50 border-2 border-gray-200"
                      >
                        <div>
                          <span className="font-medium">{item.name}</span>
                          {item.description && (
                            <p className="text-sm text-gray-500">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <span className="font-bold text-green-600">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setIsPreviewOpen(false);
                      openEditDialog(previewMenu);
                    }}
                    className="flex-1 border-2 border-black bg-black text-white rounded-none"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Menu
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsPreviewOpen(false);
                      openDeleteDialog(previewMenu);
                    }}
                    className="border-2 border-black rounded-none"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="font-bold">Menu Image</Label>
              {formImagePreview ? (
                <div className="relative h-40 border-2 border-black rounded-none overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formImagePreview}
                    alt="Menu preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={clearSelectedImage}
                    className="absolute top-2 right-2 border-2 border-black rounded-none"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-black rounded-none cursor-pointer hover:bg-gray-50">
                  <ImagePlus className="h-8 w-8 mb-2 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    Click to upload image
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </label>
              )}
            </div>

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
