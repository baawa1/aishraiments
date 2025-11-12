"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { SalesSummary, SaleType, InventoryItem, FabricCategory } from "@/types/database";
import { LoadingButton } from "@/components/ui/loading-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
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
import { Receipt, TrendingUp, Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/table-skeleton";
import { DateRange } from "react-day-picker";

type SortField = "date" | "customer_name" | "total_amount" | "amount_paid" | "balance";
type SortDirection = "asc" | "desc";

// Sale types now match inventory categories + Other
const saleTypes: (FabricCategory | "Other")[] = ["Fabric", "Thread", "Lining", "Zipper", "Embroidery", "Other"];

export default function SalesPage() {
  const [sales, setSales] = useState<SalesSummary[]>([]);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<SalesSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SalesSummary | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const [formData, setFormData] = useState<{
    date: Date | undefined;
    sale_type: FabricCategory | "Other";
    inventory_item_id: string;
    quantity_sold: string;
    customer_id: string;
    customer_name: string;
    total_amount: string;
    amount_paid: string;
    notes: string;
  }>({
    date: new Date(),
    sale_type: "Fabric",
    inventory_item_id: "",
    quantity_sold: "1",
    customer_id: "",
    customer_name: "",
    total_amount: "",
    amount_paid: "",
    notes: "",
  });

  const supabase = createClient();

  const fetchSales = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("sales_summary")
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
      console.error("Error fetching sales:", error);
    } else {
      setSales(data || []);
    }
    setLoading(false);
  }, [supabase, dateRange]);

  const fetchCustomers = useCallback(async () => {
    const { data } = await supabase
      .from("customers")
      .select("id, name")
      .order("name");
    setCustomers(data || []);
  }, [supabase]);

  const fetchInventoryByCategory = useCallback(async (category: FabricCategory) => {
    const { data } = await supabase
      .from("inventory")
      .select("*")
      .eq("category", category)
      .gt("quantity_left", 0)
      .order("item_name");
    setInventoryItems(data || []);
  }, [supabase]);

  useEffect(() => {
    fetchSales();
    fetchCustomers();
  }, [fetchSales, fetchCustomers]);

  // Fetch inventory when sale type changes
  useEffect(() => {
    if (formData.sale_type !== "Other") {
      fetchInventoryByCategory(formData.sale_type as FabricCategory);
    } else {
      setInventoryItems([]);
    }
  }, [formData.sale_type, fetchInventoryByCategory]);

  const resetForm = () => {
    setFormData({
      date: new Date(),
      sale_type: "Fabric",
      inventory_item_id: "",
      quantity_sold: "1",
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

  const handleInventoryItemSelect = (itemId: string) => {
    const item = inventoryItems.find((i) => i.id === itemId);
    if (item) {
      const quantity = parseFloat(formData.quantity_sold) || 1;
      const totalCost = item.unit_cost * quantity;
      setFormData({
        ...formData,
        inventory_item_id: itemId,
        total_amount: totalCost.toString(),
        amount_paid: totalCost.toString(), // Default to full payment
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = {
        date: formData.date?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
        sale_type: formData.sale_type as SaleType,
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

        if (error) throw error;
        toast.success("Sale updated successfully");
      } else {
        const { error } = await supabase.from("sales_summary").insert([data]);
        if (error) throw error;

        // Update inventory if item was selected
        if (formData.inventory_item_id && formData.sale_type !== "Other") {
          const item = inventoryItems.find((i) => i.id === formData.inventory_item_id);
          if (item) {
            const quantitySold = parseFloat(formData.quantity_sold) || 1;
            await supabase
              .from("inventory")
              .update({
                quantity_used: item.quantity_used + quantitySold,
              })
              .eq("id", formData.inventory_item_id);
          }
        }

        toast.success("Sale recorded successfully");
      }

      await fetchSales();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving sale:", error);
      toast.error(editingSale ? "Error updating sale" : "Error recording sale");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (sale: SalesSummary) => {
    setEditingSale(sale);
    setFormData({
      date: new Date(sale.date),
      sale_type: sale.sale_type === "Sewing" ? "Other" : (sale.sale_type as FabricCategory | "Other"),
      inventory_item_id: "",
      quantity_sold: "1",
      customer_id: sale.customer_id || "",
      customer_name: sale.customer_name,
      total_amount: sale.total_amount.toString(),
      amount_paid: sale.amount_paid.toString(),
      notes: sale.notes || "",
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
    const { error } = await supabase.from("sales_summary").delete().eq("id", deletingId);

    if (error) {
      console.error("Error deleting sale:", error);
      toast.error("Error deleting sale");
    } else {
      await fetchSales();
      toast.success("Sale deleted successfully");
    }
    setDeleting(false);
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 inline" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4 inline" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4 inline" />
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setDateRange(undefined);
  };

  const hasActiveFilters = searchTerm !== "" || typeFilter !== "all" || dateRange !== undefined;

  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
  const totalCollected = sales.reduce((sum, sale) => sum + Number(sale.amount_paid), 0);
  const totalOutstanding = sales.reduce((sum, sale) => sum + Number(sale.balance), 0);

  const filteredSales = sales
    .filter((sale) => {
      const matchesSearch = sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || sale.sale_type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      if (aValue == null) aValue = "";
      if (bValue == null) bValue = "";

      // Convert to numbers for numeric fields
      if (["total_amount", "amount_paid", "balance"].includes(sortField)) {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      // Handle dates
      if (sortField === "date") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const handleCardClick = (sale: SalesSummary) => {
    setSelectedSale(sale);
    setDetailSheetOpen(true);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Sales Summary</h2>
          <p className="text-sm text-muted-foreground">
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
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Record Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:p-6 p-4">
            <DialogHeader>
              <DialogTitle>
                {editingSale ? "Edit Sale" : "Record New Sale"}
              </DialogTitle>
              <DialogDescription>
                {editingSale
                  ? "Update sale information."
                  : "Record a sale from inventory or manual entry."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sale_date">Date</Label>
                  <DatePicker
                    date={formData.date}
                    onDateChange={(date) => setFormData({ ...formData, date })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sale_type">Sale Type *</Label>
                  <Select
                    value={formData.sale_type}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        sale_type: value as FabricCategory | "Other",
                        inventory_item_id: "",
                        total_amount: "",
                        amount_paid: ""
                      })
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

              {/* Inventory item selection (only show if not "Other") */}
              {formData.sale_type !== "Other" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="inventory_item">Select Item from Inventory</Label>
                    <Select
                      value={formData.inventory_item_id}
                      onValueChange={handleInventoryItemSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an item (optional - or enter manually below)" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.item_name} - {Number(item.quantity_left).toFixed(1)} left - {formatCurrency(item.unit_cost)} each
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.inventory_item_id && (
                    <div className="space-y-2">
                      <Label htmlFor="quantity_sold">Quantity Sold</Label>
                      <Input
                        id="quantity_sold"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.quantity_sold}
                        onChange={(e) => {
                          const newQuantity = e.target.value;
                          setFormData({ ...formData, quantity_sold: newQuantity });
                          // Recalculate total if item is selected
                          handleInventoryItemSelect(formData.inventory_item_id);
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        This will update inventory quantities automatically
                      </p>
                    </div>
                  )}
                </>
              )}

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

              <div className="grid sm:grid-cols-2 gap-4">
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
                    {formatCurrency((parseFloat(formData.total_amount) || 0) - (parseFloat(formData.amount_paid) || 0))}
                  </span>
                </div>
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
                  style={{ backgroundColor: "#72D0CF" }}
                  loading={submitting}
                  className="w-full sm:w-auto"
                >
                  {editingSale ? "Update Sale" : "Record Sale"}
                </LoadingButton>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total Sales
            </h3>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold" style={{ color: "#72D0CF" }}>
            {formatCurrency(totalSales)}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Amount Collected
            </h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold" style={{ color: "#EC88C7" }}>
            {formatCurrency(totalCollected)}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Outstanding Balance
            </h3>
            <Receipt className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-orange-600">
            {formatCurrency(totalOutstanding)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by customer name..."
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
              <SelectItem value="Sewing">Sewing</SelectItem>
              <SelectItem value="Fabric">Fabric</SelectItem>
              <SelectItem value="Thread">Thread</SelectItem>
              <SelectItem value="Lining">Lining</SelectItem>
              <SelectItem value="Zipper">Zipper</SelectItem>
              <SelectItem value="Embroidery">Embroidery</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {loading ? (
          <TableSkeleton columns={1} rows={5} />
        ) : (
          <MobileCardView
            data={filteredSales}
            onCardClick={handleCardClick}
            emptyMessage={sales.length === 0 ? "No sales recorded yet" : "No sales match your search"}
            renderCard={(sale) => (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{sale.customer_name}</div>
                    <div className="text-sm text-muted-foreground">{formatDate(sale.date)}</div>
                  </div>
                  <Badge variant="secondary">{sale.sale_type}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total:</span>{" "}
                    <span className="font-medium">{formatCurrency(Number(sale.total_amount))}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground">Balance:</span>{" "}
                    <span className={`font-semibold ${Number(sale.balance) > 0 ? "text-orange-600" : "text-green-600"}`}>
                      {formatCurrency(Number(sale.balance))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          />
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("date")}>
                Date{getSortIcon("date")}
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("customer_name")}>
                Customer{getSortIcon("customer_name")}
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-50 text-right" onClick={() => handleSort("total_amount")}>
                Total Amount{getSortIcon("total_amount")}
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-50 text-right" onClick={() => handleSort("amount_paid")}>
                Amount Paid{getSortIcon("amount_paid")}
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-50 text-right" onClick={() => handleSort("balance")}>
                Balance{getSortIcon("balance")}
              </TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton columns={8} rows={5} />
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
                    <Badge variant="secondary">{sale.sale_type}</Badge>
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
                        onClick={() => handleDeleteClick(sale.id)}
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

      {/* Mobile Detail Sheet */}
      <DetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        title="Sale Details"
      >
        {selectedSale && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Customer</div>
                  <div className="text-lg font-semibold">{selectedSale.customer_name}</div>
                </div>
                <Badge variant="secondary">{selectedSale.sale_type}</Badge>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Date</div>
                <div className="font-medium">{formatDate(selectedSale.date)}</div>
              </div>

              <div className="space-y-2 rounded-md bg-gray-50 p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Amount:</span>
                  <span className="font-semibold">{formatCurrency(Number(selectedSale.total_amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount Paid:</span>
                  <span className="font-semibold">{formatCurrency(Number(selectedSale.amount_paid))}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Balance:</span>
                  <span className={`font-bold ${Number(selectedSale.balance) > 0 ? "text-orange-600" : "text-green-600"}`}>
                    {formatCurrency(Number(selectedSale.balance))}
                  </span>
                </div>
              </div>

              {selectedSale.notes && (
                <div>
                  <div className="text-sm text-muted-foreground">Notes</div>
                  <div className="text-sm whitespace-pre-wrap">{selectedSale.notes}</div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setDetailSheetOpen(false);
                  handleEdit(selectedSale);
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
                  handleDeleteClick(selectedSale.id);
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
        title="Delete Sale"
        description="Are you sure you want to delete this sale? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
