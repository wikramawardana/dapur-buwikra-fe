"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants";
import type { PaginationInfo } from "@/types/order.types";

interface OrdersPaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function OrdersPagination({
  pagination,
  onPageChange,
  onPageSizeChange,
}: OrdersPaginationProps) {
  const { page, page_size, total_items, total_pages } = pagination;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
        <span>
          Showing {Math.min((page - 1) * page_size + 1, total_items)} to{" "}
          {Math.min(page * page_size, total_items)} of {total_items} results
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-xs sm:text-sm text-muted-foreground">
            Rows per page:
          </span>
          <Select
            value={String(page_size)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Pagination>
          <PaginationContent className="gap-1">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(1, page - 1))}
                className={`h-8 w-8 p-0 sm:h-10 sm:w-auto sm:px-4 ${
                  page === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }`}
              />
            </PaginationItem>

            {/* Show fewer page numbers on mobile */}
            {Array.from({ length: Math.min(3, total_pages) }, (_, i) => {
              let pageNum: number;
              if (total_pages <= 3) {
                pageNum = i + 1;
              } else if (page <= 2) {
                pageNum = i + 1;
              } else if (page >= total_pages - 1) {
                pageNum = total_pages - 2 + i;
              } else {
                pageNum = page - 1 + i;
              }

              return (
                <PaginationItem key={pageNum} className="hidden sm:block">
                  <PaginationLink
                    onClick={() => onPageChange(pageNum)}
                    isActive={pageNum === page}
                    className="cursor-pointer h-8 w-8 sm:h-10 sm:w-10"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            {/* Mobile: just show current page */}
            <PaginationItem className="sm:hidden">
              <span className="flex h-8 w-auto px-3 items-center justify-center text-sm">
                {page} / {total_pages}
              </span>
            </PaginationItem>

            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(Math.min(total_pages, page + 1))}
                className={`h-8 w-8 p-0 sm:h-10 sm:w-auto sm:px-4 ${
                  page === total_pages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
