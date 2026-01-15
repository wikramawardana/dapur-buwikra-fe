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
        "bg-yellow-100 text-yellow-700 border border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400",
      accepted:
        "bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-400",
      rejected:
        "bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/30 dark:text-red-400",
      inprogress:
        "bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-900/30 dark:text-purple-400",
      completed:
        "bg-green-100 text-green-700 border border-green-300 dark:bg-green-900/30 dark:text-green-400",
      cancelled:
        "bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-900/30 dark:text-gray-400",
    },
    payment: {
      paid: "bg-green-100 text-green-700 border border-green-300 dark:bg-green-900/30 dark:text-green-400",
      unpaid:
        "bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/30 dark:text-red-400",
    },
  };

  const variantClass =
    type === "order"
      ? variants.order[status as OrderStatus]
      : variants.payment[status as PaymentStatus];

  // Display label mapping for order statuses
  const displayLabel =
    type === "order" && status === "inprogress" ? "In Progress" : status;

  return (
    <Badge
      variant="secondary"
      className={cn("font-medium capitalize", variantClass, className)}
    >
      {displayLabel}
    </Badge>
  );
}
