import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus, PaymentStatus } from "@/types/order.types";

interface StatusBadgeProps {
  status: OrderStatus | PaymentStatus;
  type?: "order" | "payment";
  className?: string;
}

export function StatusBadge({
  status,
  type = "order",
  className,
}: StatusBadgeProps) {
  const variants = {
    order: {
      pending:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      completed:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
    payment: {
      paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      unpaid:
        "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    },
  };

  const variantClass =
    type === "order"
      ? variants.order[status as OrderStatus]
      : variants.payment[status as PaymentStatus];

  return (
    <Badge
      variant="secondary"
      className={cn("font-medium capitalize", variantClass, className)}
    >
      {status}
    </Badge>
  );
}
