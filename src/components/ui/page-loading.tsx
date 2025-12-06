"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PageLoadingProps {
  variant?: "home" | "orders" | "users" | "default";
  className?: string;
}

/**
 * Reusable page loading skeleton component.
 * Use this for consistent loading states across the app.
 */
export function PageLoading({
  variant = "default",
  className,
}: PageLoadingProps) {
  switch (variant) {
    case "home":
      return <HomePageSkeleton className={className} />;
    case "orders":
      return <OrdersPageSkeleton className={className} />;
    case "users":
      return <UsersPageSkeleton className={className} />;
    default:
      return <DefaultSkeleton className={className} />;
  }
}

/**
 * Welcome card skeleton - used in home page
 */
export function WelcomeCardSkeleton({ className }: { className?: string }) {
  return (
    <Card
      className={cn(
        "border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900",
        className,
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 border-4 border-black dark:border-white" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-6 w-80" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mt-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Action card skeleton - used for clickable cards
 */
export function ActionCardSkeleton({ className }: { className?: string }) {
  return (
    <Card
      className={cn(
        "border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-gray-100 dark:bg-gray-900",
        className,
      )}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

/**
 * Stats card skeleton - used for metric cards
 */
export function StatsCardSkeleton({
  className,
  color = "gray",
}: {
  className?: string;
  color?: "blue" | "green" | "red" | "yellow" | "purple" | "gray";
}) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
    green:
      "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
    red: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
    yellow:
      "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800",
    purple:
      "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800",
    gray: "neo-brutal neo-brutal-white",
  };

  return (
    <Card className={cn(colorClasses[color], className)}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-5 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-3 w-32 mt-1" />
      </CardContent>
    </Card>
  );
}

/**
 * Table skeleton - used for data tables
 */
export function TableSkeleton({
  rows = 5,
  columns = 6,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("neo-brutal neo-brutal-white", className)}>
      <div className="border-2 border-black dark:border-white">
        {/* Table Header */}
        <div className="flex border-b-2 border-black dark:border-white bg-gray-100 dark:bg-gray-800 p-3">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="flex-1 px-2">
              <Skeleton className="h-5 w-full max-w-24" />
            </div>
          ))}
        </div>
        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex border-b border-gray-200 dark:border-gray-700 p-3"
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="flex-1 px-2">
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Search/Filter bar skeleton
 */
export function FilterBarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-4", className)}>
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-24" />
    </div>
  );
}

/**
 * Pagination skeleton
 */
export function PaginationSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <Skeleton className="h-5 w-32" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-9" />
      </div>
    </div>
  );
}

// Page-specific skeleton compositions

function HomePageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <WelcomeCardSkeleton />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ActionCardSkeleton />
        <ActionCardSkeleton />
      </div>
    </div>
  );
}

function OrdersPageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid gap-4 md:grid-cols-2">
        <StatsCardSkeleton color="blue" />
        <StatsCardSkeleton color="green" />
      </div>
      <FilterBarSkeleton />
      <TableSkeleton rows={5} columns={7} />
      <PaginationSkeleton />
    </div>
  );
}

function UsersPageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCardSkeleton color="blue" />
        <StatsCardSkeleton color="red" />
        <StatsCardSkeleton color="green" />
      </div>
      <Card className="neo-brutal neo-brutal-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-10 w-64" />
          </div>
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={5} columns={5} />
        </CardContent>
      </Card>
    </div>
  );
}

function DefaultSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid gap-4 md:grid-cols-2">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
      <TableSkeleton />
    </div>
  );
}

export {
  HomePageSkeleton,
  OrdersPageSkeleton,
  UsersPageSkeleton,
  DefaultSkeleton,
};
