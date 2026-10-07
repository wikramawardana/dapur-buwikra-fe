"use client";

import {
  CheckCheck,
  CreditCard,
  Loader2,
  Play,
  ThumbsUp,
  X,
} from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cmsErrorMessage } from "@/lib/cms-messages";
import type { BulkOperationResult } from "@/services/orders.service";
import {
  bulkAcceptOrders,
  bulkCompleteOrders,
  bulkMarkPaid,
  bulkStartOrders,
} from "@/services/orders.service";
import type { Order } from "@/types/order.types";

type BulkAction = "accept" | "start" | "complete" | "mark_paid";

interface BulkActionsBarProps {
  selectedOrders: Order[];
  onActionComplete: () => void;
  onClearSelection: () => void;
}

interface ActionConfig {
  key: BulkAction;
  label: string;
  icon: React.ReactNode;
  description: string;
  variant:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  className: string;
  /** Returns whether a given order is eligible for this action */
  isEligible: (order: Order) => boolean;
}

const ACTIONS: ActionConfig[] = [
  {
    key: "accept",
    label: "Terima",
    icon: <ThumbsUp className="h-3.5 w-3.5" />,
    description: "Terima pesanan terpilih yang masih menunggu?",
    variant: "default",
    className:
      "bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-800",
    isEligible: (order) => order.status === "pending",
  },
  {
    key: "start",
    label: "Mulai proses",
    icon: <Play className="h-3.5 w-3.5" />,
    description:
      "Mulai memproses pesanan terpilih? Statusnya akan berubah menjadi Diproses.",
    variant: "default",
    className:
      "bg-purple-600 hover:bg-purple-700 text-white border-2 border-purple-800",
    isEligible: (order) => order.status === "accepted",
  },
  {
    key: "complete",
    label: "Selesaikan",
    icon: <CheckCheck className="h-3.5 w-3.5" />,
    description:
      "Tandai pesanan terpilih sebagai selesai? Pastikan semua sajian sudah diantar.",
    variant: "default",
    className:
      "bg-green-600 hover:bg-green-700 text-white border-2 border-green-800",
    isEligible: (order) => order.status === "inprogress",
  },
  {
    key: "mark_paid",
    label: "Tandai lunas",
    icon: <CreditCard className="h-3.5 w-3.5" />,
    description: "Tandai pesanan terpilih sebagai lunas?",
    variant: "default",
    className:
      "bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-800",
    isEligible: (order) => order.payment_status !== "paid",
  },
];

function showResultToast(actionLabel: string, result: BulkOperationResult) {
  if (result.failed.length === 0) {
    toast.success(
      `${actionLabel}: ${result.succeeded.length} pesanan berhasil diperbarui`,
    );
  } else if (result.succeeded.length === 0) {
    toast.error(
      `${actionLabel}: Semua ${result.failed.length} pesanan gagal diperbarui`,
      {
        description: result.failed.map((f) => f.error).join(", "),
      },
    );
  } else {
    toast.warning(
      `${actionLabel}: ${result.succeeded.length} berhasil, ${result.failed.length} gagal`,
      {
        description: result.failed.map((f) => f.error).join(", "),
      },
    );
  }
}

export function BulkActionsBar({
  selectedOrders,
  onActionComplete,
  onClearSelection,
}: BulkActionsBarProps) {
  const [loadingAction, setLoadingAction] = React.useState<BulkAction | null>(
    null,
  );

  if (selectedOrders.length === 0) return null;

  const handleBulkAction = async (action: BulkAction) => {
    const config = ACTIONS.find((a) => a.key === action);
    if (!config) return;

    const eligibleOrders = selectedOrders.filter(config.isEligible);

    if (eligibleOrders.length === 0) {
      toast.warning(
        `Tidak ada pesanan yang dapat diproses dengan tindakan "${config.label}"`,
      );
      return;
    }

    const ids = eligibleOrders.map((o) => o.id);

    setLoadingAction(action);
    try {
      let result: BulkOperationResult;

      switch (action) {
        case "accept":
          result = await bulkAcceptOrders(ids);
          break;
        case "start":
          result = await bulkStartOrders(ids);
          break;
        case "complete":
          result = await bulkCompleteOrders(ids);
          break;
        case "mark_paid":
          result = await bulkMarkPaid(ids);
          break;
      }

      showResultToast(config.label, result);

      if (result.succeeded.length > 0) {
        onActionComplete();
        onClearSelection();
      }
    } catch (error) {
      toast.error(cmsErrorMessage(error, "Gagal menjalankan tindakan massal"));
    } finally {
      setLoadingAction(null);
    }
  };

  // Count eligible orders per action
  const eligibleCounts = ACTIONS.reduce(
    (acc, action) => {
      acc[action.key] = selectedOrders.filter(action.isEligible).length;
      return acc;
    },
    {} as Record<BulkAction, number>,
  );

  return (
    <div className="neo-brutal neo-brutal-white border-2 border-black bg-amber-50 px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center rounded-md bg-black px-2 py-0.5 text-xs font-bold text-white">
            {selectedOrders.length}
          </span>
          <span className="text-sm font-semibold text-black">
            pesanan dipilih
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-6 w-6 p-0 text-gray-500 hover:text-black"
            title="Hapus pilihan"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {ACTIONS.map((action) => {
            const count = eligibleCounts[action.key];
            const isLoading = loadingAction === action.key;
            const isDisabled = loadingAction !== null || count === 0;

            return (
              <AlertDialog key={action.key}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant={action.variant}
                    size="sm"
                    disabled={isDisabled}
                    className={`gap-1.5 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:shadow-none ${action.className}`}
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      action.icon
                    )}
                    <span className="hidden sm:inline">{action.label}</span>
                    {count > 0 && (
                      <span className="rounded bg-white/20 px-1 text-[10px]">
                        {count}
                      </span>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="neo-brutal neo-brutal-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-bold">
                      {action.label} {count} Pesanan
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {action.description}
                      {count < selectedOrders.length && (
                        <span className="mt-2 block text-xs text-amber-600">
                          Catatan: Hanya {count} dari {selectedOrders.length}{" "}
                          pesanan terpilih yang dapat diproses dengan tindakan
                          ini.
                        </span>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="neo-brutal">
                      Batal
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className={`neo-brutal ${action.className}`}
                      onClick={() => handleBulkAction(action.key)}
                    >
                      {action.label} {count} Pesanan
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            );
          })}
        </div>
      </div>
    </div>
  );
}
