"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [collectDialogOpen, setCollectDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Receivable | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [collectionForm, setCollectionForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    payment_method: "Transfer" as PaymentMethod,
    notes: "",
  });
  const [validationError, setValidationError] = useState("");

  const supabase = createClient();

  const fetchReceivables = useCallback(async () => {
    setLoading(true);

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

    for (const receivable of receivablesArray) {
      if (receivable.customer_id) {
        const { data: customerData } = await supabase
          .from("customers")
          .select("phone")
          .eq("id", receivable.customer_id)
          .single();

        if (customerData) {
          receivable.phone = customerData.phone;
        }
      }

      // Calculate days since last sale
      receivable.days_since_sale = Math.floor(
        (new Date().getTime() - new Date(receivable.last_sale_date).getTime()) /
          (1000 * 60 * 60 * 24)
      );
    }

    // Sort by amount owed (descending)
    receivablesArray.sort((a, b) => b.total_outstanding - a.total_outstanding);

    setReceivables(receivablesArray);
    setLoading(false);
  }, [supabase]);

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

    if (!selectedCustomer) return;

    const amount = parseFloat(collectionForm.amount);

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      setValidationError("Please enter a valid amount greater than zero.");
      return;
    }

    if (amount > selectedCustomer.total_outstanding) {
      setValidationError(
        `Amount cannot exceed outstanding balance of ${formatCurrency(selectedCustomer.total_outstanding)}.`
      );
      return;
    }

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
      alert("Error logging collection");
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

        remainingAmount -= paymentForThisSale;
      }
    }

    await fetchReceivables();
    setCollectDialogOpen(false);
    setSelectedCustomer(null);
  };

  const filteredReceivables = receivables.filter((receivable) =>
    receivable.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (receivable.phone && receivable.phone.includes(searchTerm))
  );

  const totalOutstanding = receivables.reduce((sum, r) => sum + r.total_outstanding, 0);
  const overdueCount = receivables.filter((r) => r.days_since_sale > 30).length;

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Receivables</h2>
          <p className="text-muted-foreground">
            Track outstanding customer payments
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total Outstanding
            </h3>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold" style={{ color: "#F59E0B" }}>
            {formatCurrency(totalOutstanding)}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Customers with Balance
            </h3>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold">
            {receivables.length}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Overdue (30+ days)
            </h3>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-red-600">
            {overdueCount}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by customer name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

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
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredReceivables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No outstanding balances! 🎉
                </TableCell>
              </TableRow>
            ) : (
              filteredReceivables.map((receivable, index) => {
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
                      <Button
                        onClick={() => handleCollectPayment(receivable)}
                        size="sm"
                        style={{ backgroundColor: "#72D0CF" }}
                      >
                        <Wallet className="mr-2 h-4 w-4" />
                        Collect Payment
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={collectDialogOpen} onOpenChange={setCollectDialogOpen}>
        <DialogContent>
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
              <Input
                id="collection_date"
                type="date"
                value={collectionForm.date}
                onChange={(e) =>
                  setCollectionForm({ ...collectionForm, date: e.target.value })
                }
                required
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCollectDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" style={{ backgroundColor: "#72D0CF" }}>
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
