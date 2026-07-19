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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getUploadUrl } from "@/lib/api.config";
import { useSession } from "@/lib/auth-client";
import {
  formatPortfolioDate,
  generateWeeklyMenuTitle,
  getPortfolioDateValue,
  getPortfolioSortTime,
} from "@/lib/menu-utils";
import {
  createMenu,
  deleteAllMenuImages,
  deleteMenu,
  deleteMenuImage,
  getMenus,
  updateMenu,
  uploadMenuImage,
} from "@/services/menu.service";
import type { Menu, MenuContentType } from "@/types/menu.types";

export default function MenusPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();
  const [menus, setMenus] = React.useState<Menu[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeType, setActiveType] =
    React.useState<MenuContentType>("portfolio");
  const [portfolioSort, setPortfolioSort] = React.useState<"newest" | "oldest">(
    "newest",
  );
  const PAGE_SIZE = 100;

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [previewMenu, setPreviewMenu] = React.useState<Menu | null>(null);
  const [editingMenu, setEditingMenu] = React.useState<Menu | null>(null);
  const [deletingMenu, setDeletingMenu] = React.useState<Menu | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [updatingMenuIds, setUpdatingMenuIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [_isUploadingImage, setIsUploadingImage] = React.useState(false);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  // Form state
  const [formDescription, setFormDescription] = React.useState("");
  const [formContentType, setFormContentType] =
    React.useState<MenuContentType>("portfolio");
  const [formStartDate, setFormStartDate] = React.useState<Date | undefined>();
  const [formEndDate, setFormEndDate] = React.useState<Date | undefined>();
  const [formPortfolioDate, setFormPortfolioDate] = React.useState<
    Date | undefined
  >();
  const [formIsActive, setFormIsActive] = React.useState(true);
  const [formIsFeatured, setFormIsFeatured] = React.useState(false);
  const [formImages, setFormImages] = React.useState<File[]>([]);
  const [formImagePreviews, setFormImagePreviews] = React.useState<string[]>(
    [],
  );
  const [removeExistingImages, setRemoveExistingImages] = React.useState(false);

  const userRole = session?.user?.role;
  const canAccess = userRole === "admin" || userRole === "chef";
  const generatedWeeklyTitle = React.useMemo(
    () => generateWeeklyMenuTitle(formStartDate, formEndDate),
    [formStartDate, formEndDate],
  );

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
      const firstPage = await getMenus({ page: 1, page_size: PAGE_SIZE });
      const remainingPages = Array.from(
        { length: Math.max(0, firstPage.data.pagination.total_pages - 1) },
        (_, index) => index + 2,
      );
      const remainingResponses = await Promise.all(
        remainingPages.map((page) => getMenus({ page, page_size: PAGE_SIZE })),
      );
      setMenus([
        ...(firstPage.data.data || []),
        ...remainingResponses.flatMap((response) => response.data.data || []),
      ]);
    } catch (_error) {
      toast.error("Failed to load menus");
      setMenus([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh from page 1
  const refreshMenus = React.useCallback(() => {
    fetchMenus();
  }, [fetchMenus]);

  React.useEffect(() => {
    if (canAccess) {
      fetchMenus();
    }
  }, [canAccess, fetchMenus]);

  const openCreateDialog = () => {
    setEditingMenu(null);
    setFormContentType(activeType);
    setFormDescription("");
    setFormStartDate(undefined);
    setFormEndDate(undefined);
    setFormPortfolioDate(undefined);
    setFormIsActive(true);
    setFormIsFeatured(false);
    setFormImages([]);
    setFormImagePreviews([]);
    setRemoveExistingImages(false);
    setIsDialogOpen(true);
  };

  const openEditDialog = (menu: Menu) => {
    setEditingMenu(menu);
    setFormContentType(menu.content_type || "weekly_menu");
    setFormDescription(menu.description || "");
    setFormStartDate(
      menu.start_date ? new Date(`${menu.start_date}T00:00:00`) : undefined,
    );
    setFormEndDate(
      menu.end_date ? new Date(`${menu.end_date}T00:00:00`) : undefined,
    );
    setFormPortfolioDate(
      menu.content_type === "portfolio"
        ? getPortfolioDateValue(menu.portfolio_date)
        : undefined,
    );
    setFormIsActive(menu.is_active);
    setFormIsFeatured(menu.is_featured);
    setFormImages([]);
    setFormImagePreviews(
      (menu.image_urls || []).map((imageUrl) => getUploadUrl(imageUrl)),
    );
    setRemoveExistingImages(false);
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      if (files.some((file) => file.type && !file.type.startsWith("image/"))) {
        toast.error("Please select an image file");
        return;
      }

      setFormImages(files);
      setRemoveExistingImages(Boolean(editingMenu?.image_urls?.length));
      setFormImagePreviews(files.map((file) => URL.createObjectURL(file)));
    }
  };

  const clearSelectedImage = () => {
    setFormImages([]);
    setFormImagePreviews([]);
    setRemoveExistingImages(Boolean(editingMenu?.image_urls?.length));
  };

  const openImagePicker = () => {
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
      imageInputRef.current.click();
    }
  };

  const handleSubmit = async () => {
    if (formContentType === "weekly_menu" && (!formStartDate || !formEndDate)) {
      toast.error("Please select the weekly menu dates");
      return;
    }

    if (
      formContentType === "weekly_menu" &&
      formStartDate &&
      formEndDate &&
      formEndDate < formStartDate
    ) {
      toast.error("End date must be on or after start date");
      return;
    }

    if (formContentType === "weekly_menu" && !generatedWeeklyTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (formContentType === "portfolio" && !formPortfolioDate) {
      toast.error("Please select the food date");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingMenu) {
        await updateMenu(editingMenu.id, {
          content_type: formContentType,
          start_date:
            formContentType === "weekly_menu" && formStartDate
              ? format(formStartDate, "yyyy-MM-dd")
              : undefined,
          end_date:
            formContentType === "weekly_menu" && formEndDate
              ? format(formEndDate, "yyyy-MM-dd")
              : undefined,
          portfolio_date:
            formContentType === "portfolio" && formPortfolioDate
              ? format(formPortfolioDate, "yyyy-MM-dd")
              : undefined,
          description: formDescription,
          is_active: formIsActive,
          is_featured: formIsFeatured,
        });

        if (removeExistingImages && editingMenu.image_urls?.length) {
          await deleteAllMenuImages(editingMenu.id);
        }

        for (const image of formImages) {
          await uploadMenuImage(editingMenu.id, image);
        }
        toast.success("Menu updated successfully");
      } else {
        // Create menu first
        const response = await createMenu({
          content_type: formContentType,
          description: formDescription,
          start_date:
            formContentType === "weekly_menu" && formStartDate
              ? format(formStartDate, "yyyy-MM-dd")
              : undefined,
          end_date:
            formContentType === "weekly_menu" && formEndDate
              ? format(formEndDate, "yyyy-MM-dd")
              : undefined,
          portfolio_date:
            formContentType === "portfolio" && formPortfolioDate
              ? format(formPortfolioDate, "yyyy-MM-dd")
              : undefined,
          is_active: formIsActive,
          is_featured: formIsFeatured,
        });
        // Upload image if selected
        if (response.data?.id) {
          for (const image of formImages) {
            await uploadMenuImage(response.data.id, image);
          }
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
    if (updatingMenuIds.has(menu.id)) return;

    const nextIsActive = !menu.is_active;
    setUpdatingMenuIds((current) => new Set(current).add(menu.id));
    setMenus((current) =>
      current.map((item) =>
        item.id === menu.id ? { ...item, is_active: nextIsActive } : item,
      ),
    );

    try {
      await updateMenu(menu.id, { is_active: nextIsActive });
      toast.success(`Menu ${nextIsActive ? "activated" : "deactivated"}`);
    } catch (_error) {
      setMenus((current) =>
        current.map((item) =>
          item.id === menu.id ? { ...item, is_active: menu.is_active } : item,
        ),
      );
      toast.error("Failed to update menu");
    } finally {
      setUpdatingMenuIds((current) => {
        const next = new Set(current);
        next.delete(menu.id);
        return next;
      });
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

  const visibleMenus = menus
    .filter((menu) => (menu.content_type || "weekly_menu") === activeType)
    .sort((a, b) => {
      if (activeType === "weekly_menu") {
        return (b.start_date ?? "").localeCompare(a.start_date ?? "");
      }
      const aTime = getPortfolioSortTime(a.portfolio_date);
      const bTime = getPortfolioSortTime(b.portfolio_date);
      if (aTime === null) return 1;
      if (bTime === null) return -1;
      const difference = bTime - aTime;
      return portfolioSort === "newest" ? difference : -difference;
    });
  const portfolioCount = menus.filter(
    (menu) => menu.content_type === "portfolio",
  ).length;
  const weeklyCount = menus.length - portfolioCount;

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Card className="neo-brutal neo-brutal-white border-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <UtensilsCrossed className="h-6 w-6" />
                Food Content
              </CardTitle>
              <CardDescription>
                Publish Jejak Rasa and announce upcoming weekly menus
              </CardDescription>
            </div>
            <Button
              onClick={openCreateDialog}
              className="gap-2 font-bold border-2 border-black dark:border-white bg-green-400 text-black hover:bg-green-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none"
            >
              <Plus className="h-4 w-4" />
              Create Content
            </Button>
          </CardHeader>
          <CardContent className="space-y-5">
            <Tabs
              value={activeType}
              onValueChange={(value) => setActiveType(value as MenuContentType)}
            >
              <TabsList className="h-auto w-full justify-start rounded-none border-2 border-black bg-white p-1 dark:border-white dark:bg-black sm:w-auto">
                <TabsTrigger
                  value="portfolio"
                  className="rounded-none px-4 py-2 font-bold data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
                >
                  Jejak Rasa ({portfolioCount})
                </TabsTrigger>
                <TabsTrigger
                  value="weekly_menu"
                  className="rounded-none px-4 py-2 font-bold data-[state=active]:bg-blue-400 data-[state=active]:text-black"
                >
                  Weekly Menu ({weeklyCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {activeType === "portfolio" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Order:
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant={portfolioSort === "newest" ? "default" : "outline"}
                  onClick={() => setPortfolioSort("newest")}
                  className="rounded-none border-2"
                >
                  Newest
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={portfolioSort === "oldest" ? "default" : "outline"}
                  onClick={() => setPortfolioSort("oldest")}
                  className="rounded-none border-2"
                >
                  Oldest
                </Button>
              </div>
            )}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-8 w-8" />
              </div>
            ) : visibleMenus.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No {activeType === "portfolio" ? "Jejak Rasa" : "weekly menus"}{" "}
                yet. Click &quot;Create Content&quot; to add one.
              </div>
            ) : (
              <div className="space-y-4">
                {visibleMenus.map((menu) => (
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
                            {menu.content_type === "portfolio" ? (
                              <>
                                <p className="text-xs font-black uppercase tracking-wide text-amber-700">
                                  {formatPortfolioDate(menu.portfolio_date)}
                                </p>
                                <h3 className="mt-1 text-lg font-bold">
                                  {menu.description || "Jejak Rasa entry"}
                                </h3>
                              </>
                            ) : (
                              <h3 className="font-bold text-lg">
                                {menu.title}
                              </h3>
                            )}
                            {menu.content_type === "weekly_menu" &&
                              menu.start_date &&
                              menu.end_date && (
                                <p className="text-sm text-muted-foreground">
                                  📅 {menu.start_date} → {menu.end_date}
                                </p>
                              )}
                          </div>
                          <div
                            className="flex items-center gap-2 flex-wrap justify-end"
                            role="presentation"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {menu.is_featured && (
                              <span className="px-2 py-1 text-xs font-bold uppercase border-2 border-black bg-yellow-300">
                                ⭐ Homepage
                              </span>
                            )}
                            <span
                              className={`px-2 py-1 text-xs font-bold uppercase border-2 border-black ${menu.is_active ? "bg-green-200" : "bg-gray-200"}`}
                            >
                              {menu.is_active ? "Active" : "Inactive"}
                            </span>
                            <Switch
                              checked={menu.is_active}
                              disabled={updatingMenuIds.has(menu.id)}
                              onCheckedChange={() => handleToggleActive(menu)}
                              aria-label={`${menu.is_active ? "Deactivate" : "Activate"} ${menu.title}`}
                            />
                          </div>
                        </div>

                        {menu.content_type !== "portfolio" &&
                          menu.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                              {menu.description}
                            </p>
                          )}

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
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white p-0">
          {previewMenu && (
            <>
              {/* Large Image */}
              {previewMenu.image_urls && previewMenu.image_urls.length > 0 ? (
                <div className="w-full bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getUploadUrl(previewMenu.image_urls[0])}
                    alt={previewMenu.title}
                    className="w-full h-auto object-contain bg-gray-50"
                  />
                </div>
              ) : (
                <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                  <ImagePlus className="h-16 w-16 text-gray-400" />
                </div>
              )}

              {/* Menu Details */}
              <div className="p-4 border-t-2 border-black">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    {previewMenu.content_type === "portfolio" ? (
                      <p className="text-sm font-black uppercase tracking-wide text-amber-700">
                        {formatPortfolioDate(previewMenu.portfolio_date)}
                      </p>
                    ) : (
                      <h2 className="text-xl font-bold">{previewMenu.title}</h2>
                    )}
                    {previewMenu.content_type === "weekly_menu" &&
                      previewMenu.start_date &&
                      previewMenu.end_date && (
                        <p className="text-sm text-muted-foreground">
                          📅 {previewMenu.start_date} → {previewMenu.end_date}
                        </p>
                      )}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-bold uppercase border-2 border-black ${previewMenu.is_active ? "bg-green-200" : "bg-gray-200"}`}
                  >
                    {previewMenu.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                {previewMenu.description && (
                  <p className="text-sm text-gray-600 mb-3">
                    {previewMenu.description}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setIsPreviewOpen(false);
                      openEditDialog(previewMenu);
                    }}
                    className="flex-1 border-2 border-black bg-black text-white rounded-none"
                    size="sm"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Content
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsPreviewOpen(false);
                      openDeleteDialog(previewMenu);
                    }}
                    className="border-2 border-black rounded-none"
                    size="sm"
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
              {editingMenu ? "Edit Content" : "Create Content"}
            </DialogTitle>
            <DialogDescription>
              {editingMenu
                ? "Update the public content details."
                : "Share Jejak Rasa or announce a weekly menu."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-bold">Content Type *</Label>
              <Tabs
                value={formContentType}
                onValueChange={(value) => {
                  const nextType = value as MenuContentType;
                  setFormContentType(nextType);
                  if (nextType === "portfolio") {
                    setFormStartDate(undefined);
                    setFormEndDate(undefined);
                  } else {
                    setFormPortfolioDate(undefined);
                  }
                }}
              >
                <TabsList className="grid h-auto w-full grid-cols-2 rounded-none border-2 border-black bg-white p-1">
                  <TabsTrigger
                    value="portfolio"
                    className="rounded-none py-2 font-bold data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
                  >
                    Jejak Rasa
                  </TabsTrigger>
                  <TabsTrigger
                    value="weekly_menu"
                    className="rounded-none py-2 font-bold data-[state=active]:bg-blue-400 data-[state=active]:text-black"
                  >
                    Weekly Menu
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-xs text-muted-foreground">
                {formContentType === "portfolio"
                  ? "A permanent collection of dishes and cooking stories."
                  : "A dated announcement for an upcoming week."}
              </p>
            </div>

            {formContentType === "weekly_menu" && (
              <div className="space-y-2">
                <Label className="font-bold">Generated Title</Label>
                <Input
                  value={generatedWeeklyTitle}
                  readOnly
                  placeholder="Select the start and end dates below"
                  className="h-12 border-2 border-black rounded-none bg-blue-50 font-bold text-blue-900"
                />
                <p className="text-xs text-muted-foreground">
                  This title is generated automatically from the selected date
                  range.
                </p>
              </div>
            )}

            {formContentType === "portfolio" && (
              <div className="space-y-2">
                <Label className="font-bold">Tanggal Sajian *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start h-12 border-2 border-black rounded-none"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formPortfolioDate
                        ? format(formPortfolioDate, "PPP")
                        : "Pilih tanggal sajian"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formPortfolioDate}
                      onSelect={setFormPortfolioDate}
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Gunakan tanggal sajian, bukan tanggal konten diunggah.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="font-bold">Description</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={
                  formContentType === "weekly_menu"
                    ? "Add details or promotional wording here, e.g. 🔥 NEW!"
                    : "Tell customers about this food or catering work..."
                }
                className="border-2 border-black rounded-none"
              />
            </div>

            {formContentType === "weekly_menu" && (
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
              <Label className="font-bold">Photo</Label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                className="sr-only"
                onChange={handleImageSelect}
              />
              {formImagePreviews.length > 0 ? (
                <div className="relative border-2 border-black p-2">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {formImagePreviews.map((preview, index) => (
                      <img
                        key={preview}
                        src={preview}
                        alt={`Content preview ${index + 1}`}
                        className="aspect-square w-full border border-black object-cover"
                      />
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={clearSelectedImage}
                    className="absolute right-4 top-4 border-2 border-black rounded-none"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={openImagePicker}
                    className="mt-2 gap-2 border-2 border-black rounded-none bg-white text-black"
                  >
                    <ImagePlus className="h-4 w-4" />
                    Replace photos
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openImagePicker}
                  className="flex h-40 w-full flex-col items-center justify-center border-2 border-dashed border-black rounded-none cursor-pointer hover:bg-gray-50"
                >
                  <ImagePlus className="h-8 w-8 mb-2 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    Tap to upload one or more photos
                  </span>
                </button>
              )}
              {removeExistingImages && formImages.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Current photo will be removed when you save.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formIsActive}
                onCheckedChange={setFormIsActive}
              />
              <Label>Published</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formIsFeatured}
                onCheckedChange={setFormIsFeatured}
              />
              <Label>Show on homepage</Label>
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
