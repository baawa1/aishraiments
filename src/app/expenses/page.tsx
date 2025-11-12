"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Expense, ExpenseType, PaymentMethod } from "@/types/database";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, RefreshCcw, X } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/table-skeleton";
import { MobileCardSkeleton } from "@/components/mobile-card-skeleton";
import { DateRange } from "react-day-picker";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/table-pagination";

const expenseTypes: ExpenseType[] = [
  "Embroidery",
  "Transport",
  "Repair",
  "Supplies",
  "Other",
];

const paymentMethods: PaymentMethod[] = ["Transfer", "Cash", "POS", "Other"];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [jobs, setJobs] = useState<Array<{ id: string; customer_name: string; item_sewn: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showFixedOnly, setShowFixedOnly] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const [formData, setFormData] = useState<{
    date: Date | undefined;
    expense_type: ExpenseType;
    description: string;
    amount: string;
    vendor_payee: string;
    payment_method: PaymentMethod | "";
    is_fixed: boolean;
    job_link: string;
  }>({
    date: new Date(),
    expense_type: "Supplies",
    description: "",
    amount: "",
    vendor_payee: "",
    payment_method: "Cash",
    is_fixed: false,
    job_link: "",
  });

  const supabase = createClient();

  const fetchExpenses = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("expenses")
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
      console.error("Error fetching expenses:", error);
    } else {
      setExpenses(data || []);
    }
    setLoading(false);
  }, [supabase, dateRange]);

  const fetchJobs = useCallback(async () => {
    const { data } = await supabase
      .from("sewing_jobs")
      .select("id, customer_name, item_sewn")
      .order("created_at", { ascending: false })
      .limit(50);
    setJobs(data || []);
  }, [supabase]);

  useEffect(() => {
    fetchExpenses();
    fetchJobs();
  }, [fetchExpenses, fetchJobs]);

  const resetForm = () => {
    setFormData({
      date: new Date(),
      expense_type: "Supplies",
      description: "",
      amount: "",
      vendor_payee: "",
      payment_method: "Cash",
      is_fixed: false,
      job_link: "",
    });
    setEditingExpense(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const data = {
      date: formData.date?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
      expense_type: formData.expense_type,
      description: formData.description || null,
      amount: parseFloat(formData.amount),
      vendor_payee: formData.vendor_payee || null,
      payment_method: formData.payment_method || null,
      is_fixed: formData.is_fixed,
      job_link: formData.job_link || null,
    };

    try {
      if (editingExpense) {
        const { error } = await supabase
          .from("expenses")
          .update(data)
          .eq("id", editingExpense.id);

        if (error) throw error;
        toast.success("Expense updated successfully");
      } else {
        const { error } = await supabase.from("expenses").insert([data]);
        if (error) throw error;
        toast.success("Expense added successfully");
      }

      await fetchExpenses();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error(editingExpense ? "Error updating expense" : "Error adding expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      date: new Date(expense.date),
      expense_type: expense.expense_type,
      description: expense.description || "",
      amount: expense.amount.toString(),
      vendor_payee: expense.vendor_payee || "",
      payment_method: expense.payment_method || "",
      is_fixed: expense.is_fixed,
      job_link: expense.job_link || "",
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    setDeleting(true);
    const { error } = await supabase.from("expenses").delete().eq("id", deletingId);

    if (error) {
      console.error("Error deleting expense:", error);
      toast.error("Error deleting expense");
    } else {
      await fetchExpenses();
      toast.success("Expense deleted successfully");
    }
    setDeleting(false);
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setShowFixedOnly(false);
    setDateRange(undefined);
  };

  const hasActiveFilters = searchTerm !== "" || typeFilter !== "all" || showFixedOnly || dateRange !== undefined;

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      (expense.description && expense.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (expense.vendor_payee && expense.vendor_payee.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === "all" || expense.expense_type === typeFilter;
    const matchesFixed = !showFixedOnly || expense.is_fixed;
    return matchesSearch && matchesType && matchesFixed;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const fixedExpenses = expenses.filter(e => e.is_fixed).reduce((sum, e) => sum + Number(e.amount), 0);
  const variableExpenses = expenses.filter(e => !e.is_fixed).reduce((sum, e) => sum + Number(e.amount), 0);

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
  } = usePagination(filteredExpenses, { initialItemsPerPage: 10 });

  const handleCardClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setDetailSheetOpen(true);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Expenses</h2>
          <p className="text-sm text-muted-foreground">
            Track all business expenses and costs
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
              style={{ backgroundColor: "#EC88C7" }}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:p-6 p-4">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? "Edit Expense" : "Record New Expense"}
              </DialogTitle>
              <DialogDescription>
                {editingExpense
                  ? "Update the expense details."
                  : "Add a new business expense."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <DatePicker
                    date={formData.date}
                    onDateChange={(date) => setFormData({ ...formData, date })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense_type">Expense Type *</Label>
                  <Select
                    value={formData.expense_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, expense_type: value as ExpenseType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="What was purchased or paid for?"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₦) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) =>
                      setFormData({ ...formData, payment_method: value as PaymentMethod })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor_payee">Vendor / Payee</Label>
                <Input
                  id="vendor_payee"
                  value={formData.vendor_payee}
                  onChange={(e) =>
                    setFormData({ ...formData, vendor_payee: e.target.value })
                  }
                  placeholder="Who was paid?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_link">Link to Job (Optional)</Label>
                <Select
                  value={formData.job_link}
                  onValueChange={(value) =>
                    setFormData({ ...formData, job_link: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select job if expense is job-specific" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No job link</SelectItem>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.customer_name} - {job.item_sewn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_fixed"
                  checked={formData.is_fixed}
                  onChange={(e) =>
                    setFormData({ ...formData, is_fixed: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="is_fixed" className="cursor-pointer">
                  This is a fixed/recurring expense
                </Label>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                  disabled={submitting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <LoadingButton
                  type="submit"
                  style={{ backgroundColor: "#EC88C7" }}
                  loading={submitting}
                  className="w-full sm:w-auto"
                >
                  {editingExpense ? "Update Expense" : "Add Expense"}
                </LoadingButton>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by description or vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            className="w-full sm:w-auto"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {expenseTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showFixedOnly ? "default" : "outline"}
            onClick={() => setShowFixedOnly(!showFixedOnly)}
            className="w-full sm:w-auto gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Fixed Only
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="text-center sm:text-left">
            <span className="text-muted-foreground">Total: </span>
            <span className="font-bold" style={{ color: "#EC88C7" }}>
              {formatCurrency(totalExpenses)}
            </span>
          </div>
          <div className="text-center sm:text-left">
            <span className="text-muted-foreground">Fixed: </span>
            <span className="font-bold">
              {formatCurrency(fixedExpenses)}
            </span>
          </div>
          <div className="text-center sm:text-left">
            <span className="text-muted-foreground">Variable: </span>
            <span className="font-bold">
              {formatCurrency(variableExpenses)}
            </span>
          </div>
        </div>
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
              emptyMessage="No expenses found"
              renderCard={(expense) => (
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{expense.description || expense.expense_type}</div>
                      {expense.vendor_payee && (
                        <div className="text-sm text-muted-foreground truncate">{expense.vendor_payee}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(Number(expense.amount))}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{expense.expense_type}</Badge>
                      {expense.is_fixed && <RefreshCcw className="h-3 w-3 text-blue-500" />}
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(expense.date)}</span>
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
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={7} rows={5} />
              ) : filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No expenses found
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{formatDate(expense.date)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{expense.expense_type}</Badge>
                      {expense.is_fixed && (
                        <span title="Fixed expense">
                          <RefreshCcw className="h-3 w-3 text-blue-500" />
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{expense.description || "-"}</TableCell>
                  <TableCell>{expense.vendor_payee || "-"}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(Number(expense.amount))}
                  </TableCell>
                  <TableCell>
                    {expense.payment_method ? (
                      <Badge variant="outline">{expense.payment_method}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(expense)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(expense.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
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

      {/* Mobile Detail Sheet */}
      <DetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        title="Expense Details"
      >
        {selectedExpense && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Type</div>
                  <Badge variant="secondary" className="mt-1">{selectedExpense.expense_type}</Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Amount</div>
                  <div className="text-2xl font-bold" style={{ color: "#EC88C7" }}>
                    {formatCurrency(Number(selectedExpense.amount))}
                  </div>
                </div>
              </div>

              {selectedExpense.description && (
                <div>
                  <div className="text-sm text-muted-foreground">Description</div>
                  <div className="font-medium">{selectedExpense.description}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="font-medium">{formatDate(selectedExpense.date)}</div>
                </div>
                {selectedExpense.payment_method && (
                  <div>
                    <div className="text-sm text-muted-foreground">Payment Method</div>
                    <Badge variant="outline" className="mt-1">{selectedExpense.payment_method}</Badge>
                  </div>
                )}
              </div>

              {selectedExpense.vendor_payee && (
                <div>
                  <div className="text-sm text-muted-foreground">Vendor / Payee</div>
                  <div className="font-medium">{selectedExpense.vendor_payee}</div>
                </div>
              )}

              {selectedExpense.is_fixed && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md">
                  <RefreshCcw className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Fixed/Recurring Expense</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setDetailSheetOpen(false);
                  handleEdit(selectedExpense);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  setDetailSheetOpen(false);
                  handleDeleteClick(selectedExpense.id);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </DetailSheet>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Expense"
        description="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
