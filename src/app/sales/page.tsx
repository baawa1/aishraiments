"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { SalesSummary, SaleType } from "@/types/database";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Receipt, TrendingUp, Plus, Pencil, Trash2 } from "lucide-react";

const saleTypes: SaleType[] = ["Sewing", "Fabric", "Other"];

export default function SalesPage() {
  const [sales, setSales] = useState<SalesSummary[]>([]);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<SalesSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    sale_type: "Fabric" as SaleType,
    customer_id: "",
    customer_name: "",
    total_amount: "",
    amount_paid: "",
    notes: "",
  });

  const supabase = createClient();

  const fetchSales = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sales_summary")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching sales:", error);
    } else {
      setSales(data || []);
    }
    setLoading(false);
  }, [supabase]);

  const fetchCustomers = useCallback(async () => {
    const { data } = await supabase
      .from("customers")
      .select("id, name")
      .order("name");
    setCustomers(data || []);
  }, [supabase]);

  useEffect(() => {
    fetchSales();
    fetchCustomers();
  }, [fetchSales, fetchCustomers]);

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      sale_type: "Fabric",
      customer_id: "",
      customer_name: "",
      total_amount: "",
      amount_paid: "",
      notes: "",
    });
    setEditingSale(null);
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setFormData({
        ...formData,
        customer_id: customerId,
        customer_name: customer.name,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      date: formData.date,
      sale_type: formData.sale_type,
      customer_id: formData.customer_id || null,
      customer_name: formData.customer_name,
      total_amount: parseFloat(formData.total_amount) || 0,
      amount_paid: parseFloat(formData.amount_paid) || 0,
      notes: formData.notes || null,
      sewing_job_id: null, // Manual sales don't link to jobs
    };

    if (editingSale) {
      const { error } = await supabase
        .from("sales_summary")
        .update(data)
        .eq("id", editingSale.id);

      if (error) {
        console.error("Error updating sale:", error);
        alert("Error updating sale");
      } else {
        await fetchSales();
        setDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase.from("sales_summary").insert([data]);

      if (error) {
        console.error("Error adding sale:", error);
        alert("Error adding sale");
      } else {
        await fetchSales();
        setDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleEdit = (sale: SalesSummary) => {
    setEditingSale(sale);
    setFormData({
      date: sale.date,
      sale_type: sale.sale_type,
      customer_id: sale.customer_id || "",
      customer_name: sale.customer_name,
      total_amount: sale.total_amount.toString(),
      amount_paid: sale.amount_paid.toString(),
      notes: sale.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sale?")) return;

    const { error } = await supabase.from("sales_summary").delete().eq("id", id);

    if (error) {
      console.error("Error deleting sale:", error);
      alert("Error deleting sale");
    } else {
      await fetchSales();
    }
  };

  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
  const totalCollected = sales.reduce((sum, sale) => sum + Number(sale.amount_paid), 0);
  const totalOutstanding = sales.reduce((sum, sale) => sum + Number(sale.balance), 0);

  const filteredSales = sales.filter((sale) => {
    const matchesSearch = sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || sale.sale_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sales Summary</h2>
          <p className="text-muted-foreground">
            Record and track all sales transactions
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
              style={{ backgroundColor: "#72D0CF" }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Record Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSale ? "Edit Sale" : "Record New Sale"}
              </DialogTitle>
              <DialogDescription>
                {editingSale
                  ? "Update sale information."
                  : "Manually record a fabric sale or other revenue."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sale_date">Date *</Label>
                  <Input
                    id="sale_date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sale_type">Sale Type *</Label>
                  <Select
                    value={formData.sale_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, sale_type: value as SaleType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {saleTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer">Customer (Optional)</Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={handleCustomerSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer or enter name below" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                  placeholder="Enter name if not in list"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_amount">Total Amount (₦) *</Label>
                  <Input
                    id="total_amount"
                    type="number"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, total_amount: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount_paid">Amount Paid (₦) *</Label>
                  <Input
                    id="amount_paid"
                    type="number"
                    step="0.01"
                    value={formData.amount_paid}
                    onChange={(e) =>
                      setFormData({ ...formData, amount_paid: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional details about this sale..."
                  className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="rounded-md bg-gray-50 p-4">
                <div className="flex justify-between text-sm">
                  <span>Balance:</span>
                  <span className="font-bold text-orange-600">
                    ₦{((parseFloat(formData.total_amount) || 0) - (parseFloat(formData.amount_paid) || 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" style={{ backgroundColor: "#72D0CF" }}>
                  {editingSale ? "Update Sale" : "Record Sale"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total Sales
            </h3>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold" style={{ color: "#72D0CF" }}>
            {formatCurrency(totalSales)}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Amount Collected
            </h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold" style={{ color: "#EC88C7" }}>
            {formatCurrency(totalCollected)}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Outstanding Balance
            </h3>
            <Receipt className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-orange-600">
            {formatCurrency(totalOutstanding)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by customer name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Sewing">Sewing</SelectItem>
            <SelectItem value="Fabric">Fabric</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-right">Amount Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  {sales.length === 0
                    ? "No sales recorded yet. Click 'Record Sale' to add one."
                    : "No sales match your search."}
                </TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{formatDate(sale.date)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      sale.sale_type === "Sewing"
                        ? "bg-blue-100 text-blue-700"
                        : sale.sale_type === "Fabric"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {sale.sale_type}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{sale.customer_name}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(Number(sale.total_amount))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(sale.amount_paid))}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={Number(sale.balance) > 0 ? "text-orange-600 font-medium" : "text-green-600"}>
                      {formatCurrency(Number(sale.balance))}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {sale.notes || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(sale)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(sale.id)}
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
    </div>
  );
}
