"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { CollectionLog, PaymentMethod } from "@/types/database";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { MobileCardView } from "@/components/ui/mobile-card-view";
import { DetailSheet } from "@/components/ui/detail-sheet";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Wallet, TrendingUp, Calendar, X } from "lucide-react";
import { TableSkeleton } from "@/components/table-skeleton";
import { MobileCardSkeleton } from "@/components/mobile-card-skeleton";
import { DateRange } from "react-day-picker";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/table-pagination";

const paymentMethods: PaymentMethod[] = ["Transfer", "Cash", "POS", "Other"];

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<CollectionLog | null>(null);

  const supabase = createClient();

  const fetchCollections = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("collections_log")
      .select("*")
      .order("date", { ascending: false });

    // Apply date range filters if provided
    if (dateRange?.from) {
      query = query.gte("date", dateRange.from.toISOString().split("T")[0]);
    }
    if (dateRange?.to) {
      query = query.lte("date", dateRange.to.toISOString().split("T")[0]);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching collections:", error);
    } else {
      setCollections(data || []);
    }
    setLoading(false);
  }, [supabase, dateRange]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const filteredCollections = collections.filter((collection) => {
    const matchesSearch = collection.customer_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesMethod =
      methodFilter === "all" || collection.payment_method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const totalCollected = filteredCollections.reduce(
    (sum, collection) => sum + Number(collection.amount),
    0
  );

  // Group by payment method
  const collectionsByMethod = filteredCollections.reduce((acc, collection) => {
    const method = collection.payment_method;
    acc[method] = (acc[method] || 0) + Number(collection.amount);
    return acc;
  }, {} as Record<PaymentMethod, number>);

  const hasActiveFilters = searchTerm !== "" || methodFilter !== "all" || dateRange !== undefined;

  const clearFilters = () => {
    setSearchTerm("");
    setMethodFilter("all");
    setDateRange(undefined);
  };

  // Pagination
  const {
    currentItems,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    totalItems,
    itemRange,
  } = usePagination(filteredCollections, { initialItemsPerPage: 10 });

  const handleCardClick = (collection: CollectionLog) => {
    setSelectedCollection(collection);
    setDetailSheetOpen(true);
  };

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Collections Log</h2>
        <p className="text-muted-foreground">
          View all payment collections history
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total Collected
            </h3>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold" style={{ color: "#10B981" }}>
            {formatCurrency(totalCollected)}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Transfer
            </h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-lg sm:text-xl font-bold" style={{ color: "#72D0CF" }}>
            {formatCurrency(collectionsByMethod["Transfer"] || 0)}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Cash
            </h3>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-lg sm:text-xl font-bold" style={{ color: "#EC88C7" }}>
            {formatCurrency(collectionsByMethod["Cash"] || 0)}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              POS
            </h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-lg sm:text-xl font-bold text-indigo-600">
            {formatCurrency(collectionsByMethod["POS"] || 0)}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All Methods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            {paymentMethods.map((method) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          className="w-full sm:w-auto"
        />

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {loading ? (
          <MobileCardSkeleton rows={5} />
        ) : (
          <div className="space-y-4">
            <MobileCardView
              data={currentItems}
              onCardClick={handleCardClick}
              emptyMessage={collections.length === 0 ? "No payment collections recorded yet." : "No collections match your filters."}
              renderCard={(collection) => (
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold truncate">{collection.customer_name}</span>
                    <Badge
                      variant="secondary"
                      className={
                        collection.payment_method === "Transfer"
                          ? "bg-blue-100 text-blue-700"
                          : collection.payment_method === "Cash"
                          ? "bg-green-100 text-green-700"
                          : collection.payment_method === "POS"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-700"
                      }
                    >
                      {collection.payment_method}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Amount:</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-green-600">{formatCurrency(Number(collection.amount))}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(collection.date)}
                    {collection.notes && ` • ${collection.notes}`}
                  </div>
                </div>
              )}
            />
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              itemRange={itemRange}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={5} rows={5} />
              ) : filteredCollections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    {collections.length === 0
                      ? "No payment collections recorded yet."
                      : "No collections match your filters."}
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((collection) => (
                <TableRow key={collection.id}>
                  <TableCell>{formatDate(collection.date)}</TableCell>
                  <TableCell className="font-medium">
                    {collection.customer_name}
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-600">
                    {formatCurrency(Number(collection.amount))}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        collection.payment_method === "Transfer"
                          ? "bg-blue-100 text-blue-700"
                          : collection.payment_method === "Cash"
                          ? "bg-green-100 text-green-700"
                          : collection.payment_method === "POS"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {collection.payment_method}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {collection.notes || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
        {!loading && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            itemRange={itemRange}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
      </div>

      <div className="rounded-md border bg-gray-50 p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Total for this period:</span>
          <span className="text-lg sm:text-2xl font-bold text-green-600">
            {formatCurrency(totalCollected)}
          </span>
        </div>
      </div>

      {/* Mobile Detail Sheet */}
      <DetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        title="Collection Details"
      >
        {selectedCollection && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Date:</span>
                <span className="font-medium">{formatDate(selectedCollection.date)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Customer:</span>
                <span className="font-semibold">{selectedCollection.customer_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(Number(selectedCollection.amount))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payment Method:</span>
                <Badge
                  variant="secondary"
                  className={
                    selectedCollection.payment_method === "Transfer"
                      ? "bg-blue-100 text-blue-700"
                      : selectedCollection.payment_method === "Cash"
                      ? "bg-green-100 text-green-700"
                      : selectedCollection.payment_method === "POS"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-700"
                  }
                >
                  {selectedCollection.payment_method}
                </Badge>
              </div>
              {selectedCollection.notes && (
                <div className="pt-2 border-t">
                  <span className="text-sm text-muted-foreground block mb-1">Notes:</span>
                  <p className="text-sm">{selectedCollection.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </DetailSheet>
    </div>
  );
}
