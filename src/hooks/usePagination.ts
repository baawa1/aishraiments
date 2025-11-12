import { useState, useMemo, useEffect } from "react";

export interface PaginationResult<T> {
  currentItems: T[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (perPage: number) => void;
  totalPages: number;
  totalItems: number;
  itemRange: {
    start: number;
    end: number;
  };
}

interface UsePaginationOptions {
  initialItemsPerPage?: number;
}

export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions = {}
): PaginationResult<T> {
  const { initialItemsPerPage = 10 } = options;

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  // Reset to page 1 when items array changes (e.g., after filtering)
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  // Reset to page 1 when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const paginationData = useMemo(() => {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Ensure current page is within valid range
    const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages || 1);

    const indexOfLastItem = validCurrentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);

    const itemRange = {
      start: totalItems === 0 ? 0 : indexOfFirstItem + 1,
      end: Math.min(indexOfLastItem, totalItems),
    };

    return {
      currentItems,
      totalPages,
      totalItems,
      itemRange,
      validCurrentPage,
    };
  }, [items, currentPage, itemsPerPage]);

  return {
    currentItems: paginationData.currentItems,
    currentPage: paginationData.validCurrentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages: paginationData.totalPages,
    totalItems: paginationData.totalItems,
    itemRange: paginationData.itemRange,
  };
}
