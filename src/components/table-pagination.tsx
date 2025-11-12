"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
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

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  itemRange: {
    start: number;
    end: number;
  };
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (perPage: number) => void;
  pageSizeOptions?: number[];
}

export function TablePagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  itemRange,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [10, 25, 50, 100],
}: TablePaginationProps) {
  // Generate page numbers to display
  const generatePageNumbers = (isMobile: boolean = false) => {
    const pages: (number | "ellipsis")[] = [];
    // Show fewer pages on mobile to prevent overflow
    const maxVisiblePages = isMobile ? 3 : 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // On mobile, show minimal pages
      if (isMobile) {
        if (currentPage > 2) {
          pages.push("ellipsis");
        }

        // Show current page if it's not first or last
        if (currentPage !== 1 && currentPage !== totalPages) {
          pages.push(currentPage);
        }

        if (currentPage < totalPages - 1) {
          pages.push("ellipsis");
        }
      } else {
        // Desktop: show more pages
        if (currentPage > 3) {
          pages.push("ellipsis");
        }

        // Show pages around current page
        const startPage = Math.max(2, currentPage - 1);
        const endPage = Math.min(totalPages - 1, currentPage + 1);

        for (let i = startPage; i <= endPage; i++) {
          pages.push(i);
        }

        if (currentPage < totalPages - 2) {
          pages.push("ellipsis");
        }
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbersDesktop = generatePageNumbers(false);
  const pageNumbersMobile = generatePageNumbers(true);

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 py-4 px-2">
      {/* Left section: Items per page selector and count */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 items-center sm:items-start lg:items-center">
        <div className="flex items-center gap-2 justify-center">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onItemsPerPageChange(Number(value))}
          >
            <SelectTrigger className="h-9 w-[75px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground text-center sm:text-left">
          {totalItems === 0 ? (
            "No items"
          ) : (
            <span className="whitespace-nowrap">
              Showing <span className="font-medium text-foreground">{itemRange.start}-{itemRange.end}</span> of <span className="font-medium text-foreground">{totalItems}</span>
            </span>
          )}
        </div>
      </div>

      {/* Right section: Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center lg:justify-end">
          <Pagination>
            {/* Desktop pagination */}
            <PaginationContent className="hidden sm:flex">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {pageNumbersDesktop.map((page, index) => (
                <PaginationItem key={index}>
                  {page === "ellipsis" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      onClick={() => onPageChange(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    onPageChange(Math.min(totalPages, currentPage + 1))
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>

            {/* Mobile pagination - more compact */}
            <PaginationContent className="flex sm:hidden">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {pageNumbersMobile.map((page, index) => (
                <PaginationItem key={index}>
                  {page === "ellipsis" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      onClick={() => onPageChange(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    onPageChange(Math.min(totalPages, currentPage + 1))
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
