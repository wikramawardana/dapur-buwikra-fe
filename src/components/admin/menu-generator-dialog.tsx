"use client";

import {
  Check,
  Download,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cmsErrorMessage } from "@/lib/cms-messages";
import type {
  FlyerTemplateStyle,
  GenerateMenuResponse,
  ParsedMenuData,
} from "@/types/menu-generator.types";

interface MenuGeneratorDialogProps {
  onMenuCreated?: () => void;
}

export function MenuGeneratorDialog({
  onMenuCreated,
}: MenuGeneratorDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputText, setInputText] = React.useState("");
  const [selectedStyle, setSelectedStyle] =
    React.useState<FlyerTemplateStyle>("bento_yellow");
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Result state
  const [generatedData, setGeneratedData] =
    React.useState<ParsedMenuData | null>(null);
  const [flyerImage, setFlyerImage] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (useExistingData = false) => {
    if (!useExistingData && !inputText.trim()) {
      toast.error("Silakan masukkan teks menu terlebih dahulu");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/menus/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: useExistingData ? undefined : inputText,
          parsed_data: useExistingData ? generatedData : undefined,
          style: selectedStyle,
          photo_src: photoPreview || undefined,
          auto_publish: false,
        }),
      });

      const result: GenerateMenuResponse = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Gagal membuat poster menu");
      }

      setGeneratedData(result.parsed_data);
      if (result.preview_image) {
        setFlyerImage(result.preview_image);
      }
      toast.success(
        useExistingData
          ? "Poster diperbarui!"
          : "Menu berhasil dianalisis dan poster dibuat!",
      );
    } catch (err: any) {
      console.error(err);
      toast.error(cmsErrorMessage(err, "Gagal memproses menu"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndPublish = async () => {
    if (!generatedData || !flyerImage) {
      toast.error("Belum ada poster yang siap ditampilkan");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/menus/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parsed_data: generatedData,
          style: selectedStyle,
          photo_src: photoPreview || undefined,
          auto_publish: true,
        }),
      });

      const result: GenerateMenuResponse = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Gagal menyimpan ke server");
      }

      toast.success("Menu dan poster berhasil disimpan dan ditampilkan!");
      setIsOpen(false);
      // Reset state
      setInputText("");
      setPhotoPreview(null);
      setGeneratedData(null);
      setFlyerImage(null);

      if (onMenuCreated) {
        onMenuCreated();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(cmsErrorMessage(err, "Gagal menampilkan menu"));
    } finally {
      setIsSaving(false);
    }
  };

  const updateDishField = (
    field: keyof ParsedMenuData["dishes"],
    value: string,
  ) => {
    if (!generatedData) return;
    setGeneratedData({
      ...generatedData,
      dishes: {
        ...generatedData.dishes,
        [field]: value,
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-600 hover:bg-amber-700 text-white font-medium flex items-center gap-2 shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-200" />
          <span>Buat poster dengan AI</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Wand2 className="w-5 h-5 text-amber-600" />
            Pembuat poster menu otomatis
          </DialogTitle>
          <DialogDescription>
            Ketik atau tempel teks menu Anda. AI akan menganalisis sajian dan
            membuat poster yang siap dibagikan dengan desain Dapur Bu Wikra.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-2">
          {/* ── LEFT COLUMN: INPUT / EDIT CONTROLS ── */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {!generatedData ? (
              // Initial Prompt View
              <div className="flex flex-col gap-4">
                <div>
                  <Label
                    htmlFor="menu-text"
                    className="font-semibold text-gray-800"
                  >
                    Teks Menu
                  </Label>
                  <Textarea
                    id="menu-text"
                    rows={5}
                    placeholder="Contoh:&#10;Menu Senin:&#10;- Ayam Goreng Lengkuas&#10;- Nasi Uduk Gurih&#10;- Bakwan Jagung&#10;- Sambal Terasi&#10;Harga 25k"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="mt-1 font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Bisa berupa format apapun dari chat WhatsApp, catatan
                    katering, atau daftar mentah.
                  </p>
                </div>

                {/* Template Style Selector */}
                <div>
                  <Label className="font-semibold text-gray-800 block mb-1.5">
                    Pilihan desain
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedStyle("bento_yellow")}
                      className={`p-3 rounded-xl border text-left flex flex-col transition-all ${
                        selectedStyle === "bento_yellow"
                          ? "border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/20"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-sm text-gray-900">
                        <span>Bento Kuning</span>
                        {selectedStyle === "bento_yellow" && (
                          <Check className="w-4 h-4 text-amber-600" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500 mt-0.5">
                        Poster tegak (1024 × 1280) dengan penunjuk panah
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedStyle("makan_apa_orange")}
                      className={`p-3 rounded-xl border text-left flex flex-col transition-all ${
                        selectedStyle === "makan_apa_orange"
                          ? "border-orange-600 bg-orange-50/70 ring-2 ring-orange-500/20"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-sm text-gray-900">
                        <span>Makan Apa Oranye</span>
                        {selectedStyle === "makan_apa_orange" && (
                          <Check className="w-4 h-4 text-orange-600" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500 mt-0.5">
                        Poster persegi (1000 × 1000) dengan label harga
                        berbentuk bintang
                      </span>
                    </button>
                  </div>
                </div>

                {/* Optional Photo Attachment */}
                <div>
                  <Label className="font-semibold text-gray-800 block mb-1.5">
                    Foto Makanan Bento (Opsional)
                  </Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>
                        {photoPreview ? "Ganti Foto" : "Unggah Foto Makanan"}
                      </span>
                    </Button>
                    {photoPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPhotoPreview(null)}
                        className="text-red-500 hover:text-red-600"
                      >
                        Hapus Foto
                      </Button>
                    )}
                  </div>
                  {photoPreview ? (
                    <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={photoPreview}
                        alt="Pratinjau"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Jika tidak ada foto, generator akan otomatis memakai
                      visual ilustrasi bento yang elegan.
                    </p>
                  )}
                </div>

                <Button
                  onClick={() => handleGenerate(false)}
                  disabled={isGenerating || !inputText.trim()}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 mt-2 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menganalisis menu dan membuat poster...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Buat poster sekarang</span>
                    </>
                  )}
                </Button>
              </div>
            ) : (
              // Fine-Tuning View (Once parsed)
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-1 border-b">
                  <span className="text-sm font-semibold text-gray-800">
                    Penyesuaian Detail Menu
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setGeneratedData(null);
                      setFlyerImage(null);
                    }}
                    className="text-xs text-gray-500 hover:text-gray-800 h-7"
                  >
                    Mulai Ulang Teks
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium">Judul poster</Label>
                    <Input
                      value={generatedData.title}
                      onChange={(e) =>
                        setGeneratedData({
                          ...generatedData,
                          title: e.target.value,
                        })
                      }
                      className="h-8 text-sm mt-0.5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Tanggal</Label>
                    <Input
                      type="date"
                      value={generatedData.date}
                      onChange={(e) =>
                        setGeneratedData({
                          ...generatedData,
                          date: e.target.value,
                        })
                      }
                      className="h-8 text-sm mt-0.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-amber-900">
                      Lauk Utama
                    </Label>
                    <Input
                      value={generatedData.dishes.main}
                      onChange={(e) => updateDishField("main", e.target.value)}
                      className="h-8 text-sm mt-0.5 border-amber-200"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-800">
                      Nasi / Karbo
                    </Label>
                    <Input
                      value={generatedData.dishes.carbs}
                      onChange={(e) => updateDishField("carbs", e.target.value)}
                      className="h-8 text-sm mt-0.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-yellow-900">
                      Lauk Pendamping
                    </Label>
                    <Input
                      value={generatedData.dishes.side}
                      onChange={(e) => updateDishField("side", e.target.value)}
                      className="h-8 text-sm mt-0.5 border-yellow-200"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-red-900">
                      Sambal / Pelengkap
                    </Label>
                    <Input
                      value={generatedData.dishes.condiment}
                      onChange={(e) =>
                        updateDishField("condiment", e.target.value)
                      }
                      className="h-8 text-sm mt-0.5 border-red-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium">Label Harga</Label>
                    <Input
                      value={generatedData.price_label || ""}
                      onChange={(e) =>
                        setGeneratedData({
                          ...generatedData,
                          price_label: e.target.value,
                        })
                      }
                      placeholder="Contoh: 25K"
                      className="h-8 text-sm mt-0.5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Slogan</Label>
                    <Input
                      value={generatedData.tagline}
                      onChange={(e) =>
                        setGeneratedData({
                          ...generatedData,
                          tagline: e.target.value,
                        })
                      }
                      className="h-8 text-sm mt-0.5"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium">
                    Deskripsi / teks promosi
                  </Label>
                  <Textarea
                    rows={2}
                    value={generatedData.description}
                    onChange={(e) =>
                      setGeneratedData({
                        ...generatedData,
                        description: e.target.value,
                      })
                    }
                    className="text-xs mt-0.5"
                  />
                </div>

                {/* Style Switcher & Re-render button */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={
                        selectedStyle === "bento_yellow" ? "default" : "outline"
                      }
                      size="sm"
                      className={`h-8 text-xs ${
                        selectedStyle === "bento_yellow"
                          ? "bg-amber-600 hover:bg-amber-700"
                          : ""
                      }`}
                      onClick={() => setSelectedStyle("bento_yellow")}
                    >
                      Bento Kuning
                    </Button>
                    <Button
                      type="button"
                      variant={
                        selectedStyle === "makan_apa_orange"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className={`h-8 text-xs ${
                        selectedStyle === "makan_apa_orange"
                          ? "bg-orange-600 hover:bg-orange-700"
                          : ""
                      }`}
                      onClick={() => setSelectedStyle("makan_apa_orange")}
                    >
                      Makan Apa Oranye
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isGenerating}
                    onClick={() => handleGenerate(true)}
                    className="h-8 text-xs flex items-center gap-1.5"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`}
                    />
                    <span>Perbarui Tampilan</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: LIVE FLYER PREVIEW ── */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center bg-gray-50/70 border border-gray-200 rounded-2xl p-4 min-h-[360px]">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-3 text-amber-700">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm font-medium">
                  Membuat poster berkualitas tinggi...
                </span>
              </div>
            ) : flyerImage ? (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="relative group w-full max-w-[320px] rounded-xl overflow-hidden shadow-lg border border-gray-300">
                  <img
                    src={flyerImage}
                    alt="Pratinjau poster menu"
                    className="w-full h-auto object-contain"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={flyerImage}
                    download={`flyer-menu-${generatedData?.date || "today"}.png`}
                    className="inline-flex"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh PNG</span>
                    </Button>
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center text-gray-400 gap-2 p-6">
                <ImageIcon className="w-12 h-12 stroke-[1.5]" />
                <span className="text-sm font-medium">
                  Pratinjau poster akan muncul di sini
                </span>
                <span className="text-xs text-gray-400 max-w-[220px]">
                  Masukkan teks menu di sebelah kiri untuk melihat hasil desain
                  otomatis.
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4 pt-3 border-t">
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={isSaving}
          >
            Batal
          </Button>

          {generatedData && (
            <Button
              onClick={handleSaveAndPublish}
              disabled={isSaving || !flyerImage}
              className="bg-green-700 hover:bg-green-800 text-white font-medium flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Cloudflare R2...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Simpan dan tampilkan menu</span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
