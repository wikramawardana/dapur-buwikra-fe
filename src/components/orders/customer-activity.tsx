"use client";

import { Pencil, Trash2, UserPlus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import type { OrderCustomerActivity } from "@/types/order.types";

interface CustomerActivityProps {
  activities: OrderCustomerActivity[];
  isLoading?: boolean;
}

export function CustomerActivity({
  activities,
  isLoading = false,
}: CustomerActivityProps) {
  return (
    <Card className="neo-brutal bg-amber-50 dark:bg-amber-950/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold uppercase tracking-wide">
          Recent Customer Activity
        </CardTitle>
        <CardDescription>
          Track who added, updated, or deleted customers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div className="flex gap-3" key={item}>
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tracked customer activity yet.
          </p>
        ) : (
          <ScrollArea className="h-64 pr-3">
            <div className="space-y-1">
              {activities.map((activity) => {
                const creator =
                  activity.performed_by.name || activity.performed_by.email;
                const actionLabel = {
                  created: "added",
                  updated: "updated",
                  deleted: "deleted",
                }[activity.action];
                const ActionIcon = {
                  created: UserPlus,
                  updated: Pencil,
                  deleted: Trash2,
                }[activity.action];

                return (
                  <div
                    className="flex gap-3 border-b border-black/10 py-3 last:border-0 dark:border-white/10"
                    key={`${activity.occurred_at}-${activity.customer_email}-${activity.action}`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black bg-white dark:border-white dark:bg-black">
                      <ActionIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm leading-5">
                        <span className="font-bold">{creator}</span>{" "}
                        {actionLabel} customer{" "}
                        <span className="font-bold">
                          {activity.customer_name}
                        </span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {activity.customer_email} ·{" "}
                        {formatDateTime(activity.occurred_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
