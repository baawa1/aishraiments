"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSettings } from "@/contexts/SettingsContext";
import { toast } from "sonner";
import { Customer } from "@/types/database";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MobileCardView } from "@/components/ui/mobile-card-view";
import { DetailSheet } from "@/components/ui/detail-sheet";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
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
import { Plus, Pencil, Trash2, User, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { TableSkeleton } from "@/components/table-skeleton";
import { MobileCardSkeleton } from "@/components/mobile-card-skeleton";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/table-pagination";

type SortField = "name" | "last_order_date" | "total_orders" | "lifetime_value" | "outstanding_balance";
type SortDirection = "asc" | "desc";

interface CustomerWithStats extends Customer {
  total_orders?: number;
  lifetime_value?: number;
  outstanding_balance?: number;
}

export default function CustomersPage() {
  const { settings } = useSettings();
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedDetailCustomer, setSelectedDetailCustomer] = useState<CustomerWithStats | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    measurements_notes: "",
    preferred_contact: "",
    fabric_preferences: "",
    size_fit_notes: "",
  });

  const supabase = createClient();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);

    try {
      // Use optimized API route to avoid N+1 query problem
      const response = await fetch('/api/customers/with-stats');
      const result = await response.json();

      if (!response.ok || result.error) {
        console.error("Error fetching customers:", result.error);
        toast.error("Failed to load customers");
        setLoading(false);
        return;
      }

      setCustomers(result.data || []);
    } catch (error) {
      console.error("Unexpected error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      address: "",
      measurements_notes: "",
      preferred_contact: "",
      fabric_preferences: "",
      size_fit_notes: "",
    });
    setEditingCustomer(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const data = {
      name: formData.name,
      phone: formData.phone || null,
      address: formData.address || null,
      measurements_notes: formData.measurements_notes || null,
      preferred_contact: formData.preferred_contact || null,
      fabric_preferences: formData.fabric_preferences || null,
      size_fit_notes: formData.size_fit_notes || null,
    };

    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from("customers")
          .update(data)
          .eq("id", editingCustomer.id);

        if (error) {
          console.error("Error updating customer:", error);
          toast.error("Error updating customer");
        } else {
          await fetchCustomers();
          setDialogOpen(false);
          resetForm();
          toast.success("Customer updated successfully");
        }
      } else {
        const { error } = await supabase.from("customers").insert([data]);

        if (error) {
          console.error("Error adding customer:", error);
          toast.error("Error adding customer");
        } else {
          await fetchCustomers();
          setDialogOpen(false);
          resetForm();
          toast.success("Customer added successfully");
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      address: customer.address || "",
      measurements_notes: customer.measurements_notes || "",
      preferred_contact: customer.preferred_contact || "",
      fabric_preferences: customer.fabric_preferences || "",
      size_fit_notes: customer.size_fit_notes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setCustomerToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;

    const { error } = await supabase.from("customers").delete().eq("id", customerToDelete);

    if (error) {
      console.error("Error deleting customer:", error);
      toast.error("Error deleting customer");
    } else {
      await fetchCustomers();
      toast.success("Customer deleted successfully");
    }
    setDeleteDialogOpen(false);
    setCustomerToDelete(null);
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

  const filteredCustomers = customers
    .filter((customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm))
    )
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      if (aValue == null) aValue = "";
      if (bValue == null) bValue = "";

      // Convert to numbers for numeric fields
      if (["total_orders", "lifetime_value", "outstanding_balance"].includes(sortField)) {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      // Handle dates
      if (sortField === "last_order_date") {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

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
  } = usePagination(filteredCustomers, { initialItemsPerPage: 10 });

  // Check if customer is inactive (no order in 60+ days)
  const isInactive = (customer: Customer) => {
    if (!customer.last_order_date) return false;
    const daysSinceLastOrder = Math.floor(
      (new Date().getTime() - new Date(customer.last_order_date).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return daysSinceLastOrder > 60;
  };

  const hasActiveFilters = searchTerm !== "";

  const clearFilters = () => {
    setSearchTerm("");
  };

  const handleCardClick = (customer: CustomerWithStats) => {
    setSelectedDetailCustomer(customer);
    setDetailSheetOpen(true);
  };

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">
            Manage your customer database
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
              style={{ backgroundColor: settings.brand_primary_color }}
              className="text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? "Edit Customer" : "Add New Customer"}
              </DialogTitle>
              <DialogDescription>
                {editingCustomer
                  ? "Update customer information."
                  : "Add a new customer to your database."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Customer Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="0801234567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address / Area</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Location or area"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred_contact">Preferred Contact Method</Label>
                <Select
                  value={formData.preferred_contact}
                  onValueChange={(value) =>
                    setFormData({ ...formData, preferred_contact: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Call">Call</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="measurements_notes">Measurements</Label>
                <textarea
                  id="measurements_notes"
                  value={formData.measurements_notes}
                  onChange={(e) =>
                    setFormData({ ...formData, measurements_notes: e.target.value })
                  }
                  placeholder="Bust: 36, Waist: 28, Hips: 38..."
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="size_fit_notes">Size / Fit Preferences</Label>
                <textarea
                  id="size_fit_notes"
                  value={formData.size_fit_notes}
                  onChange={(e) =>
                    setFormData({ ...formData, size_fit_notes: e.target.value })
                  }
                  placeholder="Prefers loose fit, has broad shoulders..."
                  className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fabric_preferences">Fabric Preferences</Label>
                <textarea
                  id="fabric_preferences"
                  value={formData.fabric_preferences}
                  onChange={(e) =>
                    setFormData({ ...formData, fabric_preferences: e.target.value })
                  }
                  placeholder="Loves Ankara, only plain colors..."
                  className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
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
                  {editingCustomer ? "Update Customer" : "Add Customer"}
                </LoadingButton>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search customers by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
        <div className="text-sm text-muted-foreground text-center sm:text-left">
          Total Customers: <span className="font-bold">{customers.length}</span>
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
              emptyMessage="No customers found"
              renderCard={(customer) => {
                const inactive = isInactive(customer);
                return (
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {inactive && <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />}
                        <span className="font-semibold truncate">{customer.name}</span>
                      </div>
                      <Badge variant={inactive ? "destructive" : "secondary"}>
                        {customer.total_orders || 0} orders
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Lifetime:</span>{" "}
                        <span className="font-medium">₦{(customer.lifetime_value || 0).toLocaleString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground">Balance:</span>{" "}
                        <span className={customer.outstanding_balance && customer.outstanding_balance > 0 ? "font-medium text-orange-600" : "font-medium"}>
                          ₦{(customer.outstanding_balance || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {customer.phone || "No phone"} • Last order: {customer.last_order_date ? formatDate(customer.last_order_date) : "Never"}
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
                <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("name")}>
                  Customer{getSortIcon("name")}
                </TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Contact Method</TableHead>
                <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("last_order_date")}>
                  Last Order{getSortIcon("last_order_date")}
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-gray-50 text-right" onClick={() => handleSort("total_orders")}>
                  Total Orders{getSortIcon("total_orders")}
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-gray-50 text-right" onClick={() => handleSort("lifetime_value")}>
                  Lifetime Value{getSortIcon("lifetime_value")}
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-gray-50 text-right" onClick={() => handleSort("outstanding_balance")}>
                  Outstanding{getSortIcon("outstanding_balance")}
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={8} rows={5} />
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((customer) => {
                const inactive = isInactive(customer);

                return (
                  <TableRow key={customer.id} className={inactive ? "bg-orange-50" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {inactive && (
                          <span title="Inactive (60+ days)">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          </span>
                        )}
                        <div>
                          <Link
                            href={`/customers/${customer.id}`}
                            className="font-medium hover:underline"
                            style={{ color: settings.brand_primary_color }}
                          >
                            {customer.name}
                          </Link>
                          {customer.address && (
                            <div className="text-xs text-muted-foreground">
                              {customer.address}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{customer.phone || "-"}</TableCell>
                    <TableCell>
                      {customer.preferred_contact ? (
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700">
                          {customer.preferred_contact}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.last_order_date ? formatDate(customer.last_order_date) : "No orders yet"}
                    </TableCell>
                    <TableCell className="text-right">
                      {customer.total_orders || 0}
                    </TableCell>
                    <TableCell className="text-right font-medium" style={{ color: settings.brand_primary_color }}>
                      ₦{(customer.lifetime_value || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={customer.outstanding_balance && customer.outstanding_balance > 0 ? "text-orange-600 font-medium" : ""}>
                        ₦{(customer.outstanding_balance || 0).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(customer)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(customer.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
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

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Customer"
        description="Are you sure you want to delete this customer? This will not delete their orders."
      />

      {/* Mobile Detail Sheet */}
      <DetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        title="Customer Details"
      >
        {selectedDetailCustomer && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Name:</span>
                <Link
                  href={`/customers/${selectedDetailCustomer.id}`}
                  className="font-semibold hover:underline"
                  style={{ color: settings.brand_primary_color }}
                >
                  {selectedDetailCustomer.name}
                </Link>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Phone:</span>
                <span>{selectedDetailCustomer.phone || "N/A"}</span>
              </div>
              {selectedDetailCustomer.address && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Address:</span>
                  <span className="text-right">{selectedDetailCustomer.address}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Orders:</span>
                <Badge>{selectedDetailCustomer.total_orders || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Lifetime Value:</span>
                <span className="font-bold" style={{ color: settings.brand_primary_color }}>
                  ₦{(selectedDetailCustomer.lifetime_value || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Outstanding:</span>
                <span className={selectedDetailCustomer.outstanding_balance && selectedDetailCustomer.outstanding_balance > 0 ? "font-medium text-orange-600" : "font-medium"}>
                  ₦{(selectedDetailCustomer.outstanding_balance || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Order:</span>
                <span>{selectedDetailCustomer.last_order_date ? formatDate(selectedDetailCustomer.last_order_date) : "Never"}</span>
              </div>
            </div>

            <div className="pt-4 border-t flex gap-2">
              <Button
                onClick={() => {
                  handleEdit(selectedDetailCustomer);
                  setDetailSheetOpen(false);
                }}
                className="flex-1"
                variant="outline"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                onClick={() => {
                  handleDelete(selectedDetailCustomer.id);
                  setDetailSheetOpen(false);
                }}
                variant="destructive"
                className="flex-1"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </DetailSheet>
    </div>
  );
}
