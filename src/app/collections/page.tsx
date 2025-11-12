"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { CollectionLog, PaymentMethod } from "@/types/database";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { MobileCardView } from "@/components/ui/mobile-card-view";
import { DetailSheet } from "@/components/ui/detail-sheet";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Wallet, TrendingUp, Calendar, X, Pencil, Trash2 } from "lucide-react";
import { TableSkeleton } from "@/components/table-skeleton";
import { MobileCardSkeleton } from "@/components/mobile-card-skeleton";
import { DateRange } from "react-day-picker";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/table-pagination";
import { toast } from "sonner";
import { LoadingButton } from "@/components/ui/loading-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/label";

const paymentMethods: PaymentMethod[] = ["Transfer", "Cash", "POS", "Other"];

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<CollectionLog | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionLog | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    date: "",
    amount: "",
    payment_method: "Transfer" as PaymentMethod,
    notes: "",
  });

  const supabase = createClient();

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

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
      toast.error("Failed to load collections");
    } else {
      setCollections(data || []);
    }
    setLoading(false);
  }, [dateRange]);

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

  const handleEdit = (collection: CollectionLog) => {
    setEditingCollection(collection);
    setEditForm({
      date: collection.date,
      amount: collection.amount.toString(),
      payment_method: collection.payment_method,
      notes: collection.notes || "",
    });
    setEditDialogOpen(true);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (!editingCollection) {
      setSubmitting(false);
      return;
    }

    const amount = parseFloat(editForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount greater than zero");
      setSubmitting(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("collections_log")
        .update({
          date: editForm.date,
          amount: amount,
          payment_method: editForm.payment_method,
          notes: editForm.notes || null,
        })
        .eq("id", editingCollection.id);

      if (error) {
        console.error("Error updating collection:", error);
        toast.error("Failed to update collection");
      } else {
        toast.success("Collection updated successfully");
        await fetchCollections();
        setEditDialogOpen(false);
        setEditingCollection(null);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("Failed to update collection");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;

    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("collections_log")
        .delete()
        .eq("id", deletingId);

      if (error) {
        console.error("Error deleting collection:", error);
        toast.error("Failed to delete collection");
      } else {
        toast.success("Collection deleted successfully");
        await fetchCollections();
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("Failed to delete collection");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
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
            aria-label="Search collections by customer name"
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={6} rows={5} />
              ) : filteredCollections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
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
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(collection)}
                        aria-label="Edit collection"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(collection.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        aria-label="Delete collection"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

            <div className="pt-4 border-t flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  handleEdit(selectedCollection);
                  setDetailSheetOpen(false);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  handleDeleteClick(selectedCollection.id);
                  setDetailSheetOpen(false);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </DetailSheet>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
            <DialogDescription>
              Update payment collection record for {editingCollection?.customer_name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_date">Date *</Label>
              <DatePicker
                date={editForm.date ? new Date(editForm.date) : new Date()}
                onDateChange={(date) =>
                  setEditForm({ ...editForm, date: date ? date.toISOString().split("T")[0] : "" })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_amount">Amount (₦) *</Label>
              <Input
                id="edit_amount"
                type="number"
                step="0.01"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                required
                aria-label="Collection amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_payment_method">Payment Method *</Label>
              <Select
                value={editForm.payment_method}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, payment_method: value as PaymentMethod })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_notes">Notes</Label>
              <textarea
                id="edit_notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Payment reference or notes..."
                className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Collection notes"
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                style={{ backgroundColor: "#72D0CF" }}
                loading={submitting}
                className="w-full sm:w-auto"
              >
                Save Changes
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Collection"
        description="Are you sure you want to delete this collection record? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleting}
        variant="destructive"
      />
    </div>
  );
}
