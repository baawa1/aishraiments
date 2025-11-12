"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DatePicker } from "@/components/ui/date-picker";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Wallet, DollarSign } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PaymentMethod } from "@/types/database";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/table-skeleton";
import { MobileCardSkeleton } from "@/components/mobile-card-skeleton";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/table-pagination";

interface Receivable {
  customer_id: string | null;
  customer_name: string;
  phone: string | null;
  total_outstanding: number;
  last_sale_date: string;
  days_since_sale: number;
}

const paymentMethods: PaymentMethod[] = ["Transfer", "Cash", "POS", "Other"];

export default function ReceivablesPage() {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [collectDialogOpen, setCollectDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Receivable | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedDetailCustomer, setSelectedDetailCustomer] = useState<Receivable | null>(null);

  const [collectionForm, setCollectionForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    payment_method: "Transfer" as PaymentMethod,
    notes: "",
  });
  const [validationError, setValidationError] = useState("");

  const fetchReceivables = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const { data: salesData } = await supabase
      .from("sales_summary")
      .select("*")
      .gt("balance", 0);

    if (!salesData) {
      setLoading(false);
      return;
    }

    // Group by customer
    const customerMap = new Map<string, Receivable>();

    salesData.forEach((sale) => {
      const key = sale.customer_id || sale.customer_name;
      const existing = customerMap.get(key);

      if (existing) {
        existing.total_outstanding += Number(sale.balance);
        if (new Date(sale.date) > new Date(existing.last_sale_date)) {
          existing.last_sale_date = sale.date;
        }
      } else {
        customerMap.set(key, {
          customer_id: sale.customer_id,
          customer_name: sale.customer_name,
          phone: null,
          total_outstanding: Number(sale.balance),
          last_sale_date: sale.date,
          days_since_sale: 0,
        });
      }
    });

    // Fetch phone numbers for customers
    const receivablesArray = Array.from(customerMap.values());

    // Optimize: Batch fetch phone numbers instead of N+1 queries
    const customerIds = receivablesArray
      .map(r => r.customer_id)
      .filter((id): id is string => id !== null);

    if (customerIds.length > 0) {
      const { data: customersData } = await supabase
        .from("customers")
        .select("id, phone")
        .in("id", customerIds);

      if (customersData) {
        const phoneMap = new Map(customersData.map(c => [c.id, c.phone]));
        receivablesArray.forEach(r => {
          if (r.customer_id && phoneMap.has(r.customer_id)) {
            r.phone = phoneMap.get(r.customer_id) || null;
          }
        });
      }
    }

    // Calculate days since last sale
    receivablesArray.forEach(receivable => {
      receivable.days_since_sale = Math.floor(
        (new Date().getTime() - new Date(receivable.last_sale_date).getTime()) /
          (1000 * 60 * 60 * 24)
      );
    });

    // Sort by amount owed (descending)
    receivablesArray.sort((a, b) => b.total_outstanding - a.total_outstanding);

    setReceivables(receivablesArray);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReceivables();
  }, [fetchReceivables]);

  const handleCollectPayment = (receivable: Receivable) => {
    setSelectedCustomer(receivable);
    setCollectionForm({
      date: new Date().toISOString().split("T")[0],
      amount: receivable.total_outstanding.toString(),
      payment_method: "Transfer",
      notes: "",
    });
    setValidationError("");
    setCollectDialogOpen(true);
  };

  const handleSubmitCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    setSubmitting(true);

    if (!selectedCustomer) {
      setSubmitting(false);
      return;
    }

    const amount = parseFloat(collectionForm.amount);

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      setValidationError("Please enter a valid amount greater than zero.");
      setSubmitting(false);
      return;
    }

    if (amount > selectedCustomer.total_outstanding) {
      setValidationError(
        `Amount cannot exceed outstanding balance of ${formatCurrency(selectedCustomer.total_outstanding)}.`
      );
      setSubmitting(false);
      return;
    }

    try {
      const supabase = createClient();

      // Record in collections log
      const { error: collectionError } = await supabase
        .from("collections_log")
        .insert([
          {
            date: collectionForm.date,
            customer_id: selectedCustomer.customer_id,
            customer_name: selectedCustomer.customer_name,
            amount: amount,
            payment_method: collectionForm.payment_method,
            notes: collectionForm.notes || null,
          },
        ]);

      if (collectionError) {
        console.error("Error logging collection:", collectionError);
        toast.error("Error logging collection");
        setSubmitting(false);
        return;
      }

      // Update sales summary - find oldest unpaid sales and apply payment
      const { data: unpaidSales } = await supabase
        .from("sales_summary")
        .select("*")
        .eq("customer_name", selectedCustomer.customer_name)
        .gt("balance", 0)
        .order("date", { ascending: true });

      if (unpaidSales) {
        let remainingAmount = amount;

        for (const sale of unpaidSales) {
          if (remainingAmount <= 0) break;

          const saleBalance = Number(sale.balance);
          const paymentForThisSale = Math.min(remainingAmount, saleBalance);
          const newAmountPaid = Number(sale.amount_paid) + paymentForThisSale;

          await supabase
            .from("sales_summary")
            .update({ amount_paid: newAmountPaid })
            .eq("id", sale.id);

          // **CRITICAL: Auto-sync to sewing jobs if this sale is linked**
          if (sale.sewing_job_id) {
            const { data: job } = await supabase
              .from("sewing_jobs")
              .select("total_charged, amount_paid")
              .eq("id", sale.sewing_job_id)
              .single();

            if (job) {
              const newJobAmountPaid = Number(job.amount_paid) + paymentForThisSale;
              const newJobBalance = Number(job.total_charged) - newJobAmountPaid;

              let newStatus = "Pending";
              if (newJobBalance === 0) {
                newStatus = "Done";
              } else if (newJobAmountPaid > 0 && newJobBalance > 0) {
                newStatus = "Part";
              }

              await supabase
                .from("sewing_jobs")
                .update({
                  amount_paid: newJobAmountPaid,
                  status: newStatus,
                })
                .eq("id", sale.sewing_job_id);
            }
          }

          remainingAmount -= paymentForThisSale;
        }
      }

      await fetchReceivables();
      setCollectDialogOpen(false);
      setSelectedCustomer(null);
      toast.success("Payment recorded successfully");
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReceivables = receivables.filter((receivable) =>
    receivable.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (receivable.phone && receivable.phone.includes(searchTerm))
  );

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
  } = usePagination(filteredReceivables, { initialItemsPerPage: 10 });

  const totalOutstanding = receivables.reduce((sum, r) => sum + r.total_outstanding, 0);
  const overdueCount = receivables.filter((r) => r.days_since_sale > 30).length;

  const handleCardClick = (receivable: Receivable) => {
    setSelectedDetailCustomer(receivable);
    setDetailSheetOpen(true);
  };

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Receivables</h2>
          <p className="text-muted-foreground">
            Track outstanding customer payments
          </p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total Outstanding
            </h3>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold" style={{ color: "#F59E0B" }}>
            {formatCurrency(totalOutstanding)}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Customers with Balance
            </h3>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold">
            {receivables.length}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Overdue (30+ days)
            </h3>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-red-600">
            {overdueCount}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by customer name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-sm"
          aria-label="Search receivables by customer name or phone"
        />
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
              emptyMessage="No outstanding balances! 🎉"
              renderCard={(receivable) => {
                const isOverdue = receivable.days_since_sale > 30;
                return (
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {isOverdue && <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                        <span className="font-semibold truncate">{receivable.customer_name}</span>
                      </div>
                      <Badge variant={isOverdue ? "destructive" : "secondary"}>
                        {receivable.days_since_sale} days
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Outstanding:</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-orange-600">{formatCurrency(receivable.total_outstanding)}</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {receivable.phone || "No phone"} • Last sale: {formatDate(receivable.last_sale_date)}
                    </div>
                  </div>
                );
              }}
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
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Last Sale</TableHead>
                <TableHead>Days Overdue</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={6} rows={5} />
              ) : filteredReceivables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No outstanding balances! 🎉
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((receivable, index) => {
                const isOverdue = receivable.days_since_sale > 30;

                return (
                  <TableRow
                    key={index}
                    className={isOverdue ? "bg-red-50" : ""}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {isOverdue && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        {receivable.customer_name}
                      </div>
                    </TableCell>
                    <TableCell>{receivable.phone || "-"}</TableCell>
                    <TableCell className="text-right font-bold text-orange-600">
                      {formatCurrency(receivable.total_outstanding)}
                    </TableCell>
                    <TableCell>
                      {formatDate(receivable.last_sale_date)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          isOverdue
                            ? "text-red-600 font-medium"
                            : receivable.days_since_sale > 14
                            ? "text-yellow-600"
                            : ""
                        }
                      >
                        {receivable.days_since_sale} days
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <LoadingButton
                        onClick={() => handleCollectPayment(receivable)}
                        size="sm"
                        style={{ backgroundColor: "#72D0CF" }}
                        loading={false}
                      >
                        <Wallet className="mr-2 h-4 w-4" />
                        Collect Payment
                      </LoadingButton>
                    </TableCell>
                  </TableRow>
                );
              })
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

      <Dialog open={collectDialogOpen} onOpenChange={setCollectDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Collect Payment</DialogTitle>
            <DialogDescription>
              Record a payment from {selectedCustomer?.customer_name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCollection} className="space-y-4">
            <div className="rounded-md bg-gray-50 p-4">
              <div className="flex justify-between text-sm">
                <span>Outstanding Balance:</span>
                <span className="font-bold text-orange-600">
                  {selectedCustomer && formatCurrency(selectedCustomer.total_outstanding)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="collection_date">Date *</Label>
              <DatePicker
                date={collectionForm.date ? new Date(collectionForm.date) : new Date()}
                onDateChange={(date) =>
                  setCollectionForm({ ...collectionForm, date: date ? date.toISOString().split("T")[0] : "" })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="collection_amount">Amount (₦) *</Label>
              <Input
                id="collection_amount"
                type="number"
                step="0.01"
                value={collectionForm.amount}
                onChange={(e) => {
                  setCollectionForm({ ...collectionForm, amount: e.target.value });
                  setValidationError(""); // Clear error on change
                }}
                max={selectedCustomer?.total_outstanding}
                required
                className={validationError ? "border-red-500" : ""}
              />
              {validationError && (
                <p className="text-sm text-red-600">{validationError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="collection_method">Payment Method *</Label>
              <Select
                value={collectionForm.payment_method}
                onValueChange={(value) =>
                  setCollectionForm({ ...collectionForm, payment_method: value as PaymentMethod })
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
              <Label htmlFor="collection_notes">Notes</Label>
              <textarea
                id="collection_notes"
                value={collectionForm.notes}
                onChange={(e) =>
                  setCollectionForm({ ...collectionForm, notes: e.target.value })
                }
                placeholder="Payment reference or notes..."
                className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCollectDialogOpen(false)}
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
                Record Payment
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mobile Detail Sheet */}
      <DetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        title="Customer Balance"
      >
        {selectedDetailCustomer && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Customer:</span>
                <span className="font-semibold">{selectedDetailCustomer.customer_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Phone:</span>
                <span>{selectedDetailCustomer.phone || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Outstanding:</span>
                <span className="font-bold text-orange-600">
                  {formatCurrency(selectedDetailCustomer.total_outstanding)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Sale:</span>
                <span>{formatDate(selectedDetailCustomer.last_sale_date)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Days Since:</span>
                <Badge variant={selectedDetailCustomer.days_since_sale > 30 ? "destructive" : "secondary"}>
                  {selectedDetailCustomer.days_since_sale} days
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t">
              <LoadingButton
                onClick={() => {
                  handleCollectPayment(selectedDetailCustomer);
                  setDetailSheetOpen(false);
                }}
                className="w-full"
                style={{ backgroundColor: "#72D0CF" }}
                loading={false}
              >
                <Wallet className="mr-2 h-4 w-4" />
                Collect Payment
              </LoadingButton>
            </div>
          </div>
        )}
      </DetailSheet>
    </div>
  );
}
