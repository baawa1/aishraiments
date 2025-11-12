"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SewingJob, FabricSource, JobStatus, InventoryItem } from "@/types/database";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, Trash2, AlertCircle, CheckCircle2, ArrowUpDown, ArrowUp, ArrowDown, X, User } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/table-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SortField = "date" | "customer_name" | "total_charged" | "amount_paid" | "balance" | "profit" | "status";
type SortDirection = "asc" | "desc";

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<SewingJob[]>([]);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; phone: string | null }>>([]);
  const [inventoryFabrics, setInventoryFabrics] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<SewingJob | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fabricSourceFilter, setFabricSourceFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedJob, setSelectedJob] = useState<SewingJob | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const [formData, setFormData] = useState<{
    date: Date | undefined;
    customer_id: string;
    customer_name: string;
    phone: string;
    fabric_source: FabricSource;
    fabric_inventory_id: string;
    item_sewn: string;
    material_cost: string;
    labour_charge: string;
    amount_paid: string;
    status: JobStatus;
    delivery_date_expected: Date | undefined;
    fitting_date: Date | undefined;
    measurements_reference: string;
    notes: string;
  }>({
    date: new Date(),
    customer_id: "",
    customer_name: "",
    phone: "",
    fabric_source: "Yours",
    fabric_inventory_id: "",
    item_sewn: "",
    material_cost: "",
    labour_charge: "",
    amount_paid: "",
    status: "Pending",
    delivery_date_expected: undefined,
    fitting_date: undefined,
    measurements_reference: "",
    notes: "",
  });

  const supabase = createClient();

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sewing_jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching jobs:", error);
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  }, [supabase]);

  const fetchCustomers = useCallback(async () => {
    const { data } = await supabase
      .from("customers")
      .select("id, name, phone")
      .order("name");
    setCustomers(data || []);
  }, [supabase]);

  const fetchInventoryFabrics = useCallback(async () => {
    const { data } = await supabase
      .from("inventory")
      .select("*")
      .eq("category", "Fabric")
      .gt("quantity_left", 0)
      .order("item_name");
    setInventoryFabrics(data || []);
  }, [supabase]);

  useEffect(() => {
    fetchJobs();
    fetchCustomers();
    fetchInventoryFabrics();
  }, [fetchJobs, fetchCustomers, fetchInventoryFabrics]);

  const resetForm = () => {
    setFormData({
      date: new Date(),
      customer_id: "",
      customer_name: "",
      phone: "",
      fabric_source: "Yours",
      fabric_inventory_id: "",
      item_sewn: "",
      material_cost: "",
      labour_charge: "",
      amount_paid: "",
      status: "Pending",
      delivery_date_expected: undefined,
      fitting_date: undefined,
      measurements_reference: "",
      notes: "",
    });
    setEditingJob(null);
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setFormData({
        ...formData,
        customer_id: customerId,
        customer_name: customer.name,
        phone: customer.phone || "",
      });
    }
  };

  const handleFabricSelect = (fabricId: string) => {
    const fabric = inventoryFabrics.find((f) => f.id === fabricId);
    if (fabric) {
      setFormData({
        ...formData,
        fabric_inventory_id: fabricId,
        material_cost: fabric.unit_cost.toString(),
      });
    }
  };

  const validateDates = () => {
    if (formData.fitting_date && formData.delivery_date_expected) {
      if (formData.fitting_date >= formData.delivery_date_expected) {
        toast.error("Fitting date must be before delivery date");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateDates()) {
      return;
    }

    setSubmitting(true);

    const totalCharged = (parseFloat(formData.material_cost) || 0) + (parseFloat(formData.labour_charge) || 0);
    const amountPaid = parseFloat(formData.amount_paid) || 0;

    // Auto-update status based on payment
    let autoStatus = formData.status;
    if (amountPaid >= totalCharged && totalCharged > 0) {
      autoStatus = "Done";
    } else if (amountPaid > 0 && amountPaid < totalCharged) {
      autoStatus = "Part";
    } else if (amountPaid === 0) {
      autoStatus = "Pending";
    }

    // If status is changing to "Done", set actual delivery date to today
    let deliveryDateActual = editingJob?.delivery_date_actual || null;
    if (autoStatus === "Done" && (!editingJob || editingJob.status !== "Done")) {
      deliveryDateActual = new Date().toISOString().split("T")[0];
    }

    const data = {
      date: formData.date?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
      customer_id: formData.customer_id || null,
      customer_name: formData.customer_name,
      phone: formData.phone || null,
      fabric_source: formData.fabric_source,
      item_sewn: formData.item_sewn,
      material_cost: parseFloat(formData.material_cost) || 0,
      labour_charge: parseFloat(formData.labour_charge) || 0,
      amount_paid: amountPaid,
      status: autoStatus,
      delivery_date_expected: formData.delivery_date_expected?.toISOString().split("T")[0] || null,
      delivery_date_actual: deliveryDateActual,
      fitting_date: formData.fitting_date?.toISOString().split("T")[0] || null,
      measurements_reference: formData.measurements_reference || null,
      notes: formData.notes || null,
    };

    try {
      if (editingJob) {
        const { error } = await supabase
          .from("sewing_jobs")
          .update(data)
          .eq("id", editingJob.id);

        if (error) throw error;

        // If status changed to "Done", create/update sale record
        if (autoStatus === "Done" && (!editingJob || editingJob.status !== "Done")) {
          const { data: existingSale } = await supabase
            .from("sales_summary")
            .select("id")
            .eq("sewing_job_id", editingJob.id)
            .single();

          if (!existingSale) {
            await supabase.from("sales_summary").insert([{
              date: data.date,
              sale_type: "Sewing" as const,
              customer_id: data.customer_id,
              customer_name: data.customer_name,
              total_amount: totalCharged,
              amount_paid: amountPaid,
              sewing_job_id: editingJob.id,
              notes: `Auto-created from job: ${data.item_sewn}`,
            }]);
          } else {
            await supabase
              .from("sales_summary")
              .update({
                total_amount: totalCharged,
                amount_paid: amountPaid,
              })
              .eq("id", existingSale.id);
          }
        }

        // Update customer's last_order_date
        if (data.customer_id) {
          await supabase
            .from("customers")
            .update({ last_order_date: data.date })
            .eq("id", data.customer_id);
        }

        toast.success("Job updated successfully");
      } else {
        const { error, data: newJob } = await supabase
          .from("sewing_jobs")
          .insert([data])
          .select()
          .single();

        if (error) throw error;

        // If using own fabric, create sale and update inventory
        if (formData.fabric_source === "Yours" && formData.fabric_inventory_id) {
          const fabric = inventoryFabrics.find((f) => f.id === formData.fabric_inventory_id);
          if (fabric) {
            // Create sale record for fabric
            await supabase.from("sales_summary").insert([{
              date: data.date,
              sale_type: "Fabric" as const,
              customer_id: data.customer_id,
              customer_name: data.customer_name,
              total_amount: fabric.unit_cost,
              amount_paid: fabric.unit_cost,
              notes: `Fabric sale for job: ${data.item_sewn} (${fabric.item_name})`,
            }]);

            // Update inventory quantity_used
            await supabase
              .from("inventory")
              .update({
                quantity_used: fabric.quantity_used + 1, // Assuming 1 unit per job
              })
              .eq("id", formData.fabric_inventory_id);
          }
        }

        // If job is created with "Done" status, create sale record
        if (autoStatus === "Done" && newJob) {
          await supabase.from("sales_summary").insert([{
            date: data.date,
            sale_type: "Sewing" as const,
            customer_id: data.customer_id,
            customer_name: data.customer_name,
            total_amount: totalCharged,
            amount_paid: amountPaid,
            sewing_job_id: newJob.id,
            notes: `Auto-created from job: ${data.item_sewn}`,
          }]);
        }

        // Update customer's first and last order dates
        if (data.customer_id) {
          const { data: customer } = await supabase
            .from("customers")
            .select("first_order_date")
            .eq("id", data.customer_id)
            .single();

          const updates: { last_order_date: string; first_order_date?: string } = {
            last_order_date: data.date,
          };

          if (!customer?.first_order_date) {
            updates.first_order_date = data.date;
          }

          await supabase
            .from("customers")
            .update(updates)
            .eq("id", data.customer_id);
        }

        toast.success("Job added successfully");
      }

      await fetchJobs();
      await fetchInventoryFabrics();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving job:", error);
      toast.error(editingJob ? "Error updating job" : "Error adding job");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (job: SewingJob) => {
    setEditingJob(job);
    setFormData({
      date: new Date(job.date),
      customer_id: job.customer_id || "",
      customer_name: job.customer_name,
      phone: job.phone || "",
      fabric_source: job.fabric_source,
      fabric_inventory_id: "",
      item_sewn: job.item_sewn,
      material_cost: job.material_cost.toString(),
      labour_charge: job.labour_charge.toString(),
      amount_paid: job.amount_paid.toString(),
      status: job.status,
      delivery_date_expected: job.delivery_date_expected ? new Date(job.delivery_date_expected) : undefined,
      fitting_date: job.fitting_date ? new Date(job.fitting_date) : undefined,
      measurements_reference: job.measurements_reference || "",
      notes: job.notes || "",
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
    const { error } = await supabase.from("sewing_jobs").delete().eq("id", deletingId);

    if (error) {
      console.error("Error deleting job:", error);
      toast.error("Error deleting job");
    } else {
      await fetchJobs();
      toast.success("Job deleted successfully");
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
    setStatusFilter("all");
    setFabricSourceFilter("all");
  };

  const hasActiveFilters = searchTerm !== "" || statusFilter !== "all" || fabricSourceFilter !== "all";

  const filteredJobs = jobs
    .filter((job) => {
      const matchesSearch =
        job.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.item_sewn.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      const matchesFabricSource =
        fabricSourceFilter === "all" || job.fabric_source === fabricSourceFilter;
      return matchesSearch && matchesStatus && matchesFabricSource;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      if (aValue == null) aValue = "";
      if (bValue == null) bValue = "";

      // Convert to numbers for numeric fields
      if (["total_charged", "amount_paid", "balance", "profit"].includes(sortField)) {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const isOverdue = (job: SewingJob) => {
    if (!job.delivery_date_expected || job.status === "Done") return false;
    return new Date(job.delivery_date_expected) < new Date();
  };

  const totalRevenue = filteredJobs.reduce((sum, job) => sum + Number(job.total_charged), 0);
  const totalCollected = filteredJobs.reduce((sum, job) => sum + Number(job.amount_paid), 0);
  const totalProfit = filteredJobs.reduce((sum, job) => sum + Number(job.profit), 0);
  const totalRemaining = totalRevenue - totalCollected;

  const handleCardClick = (job: SewingJob) => {
    setSelectedJob(job);
    setDetailSheetOpen(true);
  };

  const navigateToCustomer = (customerId: string | null) => {
    if (customerId) {
      router.push(`/customers/${customerId}`);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Sewing Jobs</h2>
          <p className="text-sm text-muted-foreground">
            Manage customer orders and track progress
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
              New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto sm:p-6 p-4">
            <DialogHeader>
              <DialogTitle>
                {editingJob ? "Edit Sewing Job" : "Create New Sewing Job"}
              </DialogTitle>
              <DialogDescription>
                {editingJob
                  ? "Update the job details."
                  : "Record a new customer order."}
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
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value as JobStatus })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Part">Part Payment</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={handleCustomerSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select existing customer or enter new" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} {customer.phone && `(${customer.phone})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="08012345678"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item_sewn">Item / Garment *</Label>
                  <Input
                    id="item_sewn"
                    value={formData.item_sewn}
                    onChange={(e) =>
                      setFormData({ ...formData, item_sewn: e.target.value })
                    }
                    placeholder="e.g., A-line gown, 2-piece set"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fabric_source">Fabric Source</Label>
                  <Select
                    value={formData.fabric_source}
                    onValueChange={(value) =>
                      setFormData({ ...formData, fabric_source: value as FabricSource, fabric_inventory_id: "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yours">Your Fabric</SelectItem>
                      <SelectItem value="Customer's">Customer&apos;s Fabric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Fabric selection from inventory when using own fabric */}
              {formData.fabric_source === "Yours" && (
                <div className="space-y-2">
                  <Label htmlFor="fabric_inventory">Select Fabric from Inventory</Label>
                  <Select
                    value={formData.fabric_inventory_id}
                    onValueChange={handleFabricSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a fabric (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventoryFabrics.map((fabric) => (
                        <SelectItem key={fabric.id} value={fabric.id}>
                          {fabric.item_name} - {Number(fabric.quantity_left).toFixed(1)} left - {formatCurrency(fabric.unit_cost)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Selecting a fabric will auto-fill material cost and create a sale record
                  </p>
                </div>
              )}

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="material_cost">Material Cost (₦) *</Label>
                  <Input
                    id="material_cost"
                    type="number"
                    step="0.01"
                    value={formData.material_cost}
                    onChange={(e) =>
                      setFormData({ ...formData, material_cost: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="labour_charge">Labour Charge (₦) *</Label>
                  <Input
                    id="labour_charge"
                    type="number"
                    step="0.01"
                    value={formData.labour_charge}
                    onChange={(e) =>
                      setFormData({ ...formData, labour_charge: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount_paid">Amount Paid (₦)</Label>
                  <Input
                    id="amount_paid"
                    type="number"
                    step="0.01"
                    value={formData.amount_paid}
                    onChange={(e) =>
                      setFormData({ ...formData, amount_paid: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery_date_expected">Expected Delivery</Label>
                  <DatePicker
                    date={formData.delivery_date_expected}
                    onDateChange={(date) => setFormData({ ...formData, delivery_date_expected: date })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fitting_date">Fitting Date</Label>
                  <DatePicker
                    date={formData.fitting_date}
                    onDateChange={(date) => setFormData({ ...formData, fitting_date: date })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="measurements_reference">Measurements Reference</Label>
                <Input
                  id="measurements_reference"
                  value={formData.measurements_reference}
                  onChange={(e) =>
                    setFormData({ ...formData, measurements_reference: e.target.value })
                  }
                  placeholder="Link to measurements or notes"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Special instructions, design details, etc."
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="rounded-md bg-gray-50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Charged:</span>
                  <span className="font-bold">
                    {formatCurrency((parseFloat(formData.material_cost) || 0) + (parseFloat(formData.labour_charge) || 0))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Balance:</span>
                  <span className="font-bold text-orange-600">
                    {formatCurrency((parseFloat(formData.material_cost) || 0) + (parseFloat(formData.labour_charge) || 0) - (parseFloat(formData.amount_paid) || 0))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Profit:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency((parseFloat(formData.amount_paid) || 0) - (parseFloat(formData.material_cost) || 0))}
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
                  {editingJob ? "Update Job" : "Create Job"}
                </LoadingButton>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold" style={{ color: "#72D0CF" }}>
              {formatCurrency(totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold" style={{ color: "#EC88C7" }}>
              {formatCurrency(totalCollected)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-orange-600">
              {formatCurrency(totalRemaining)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-green-600">
              {formatCurrency(totalProfit)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
        <Input
          placeholder="Search by customer or item..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-0 sm:max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Part">Part Payment</SelectItem>
            <SelectItem value="Done">Done</SelectItem>
          </SelectContent>
        </Select>
        <Select value={fabricSourceFilter} onValueChange={setFabricSourceFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="Yours">Your Fabric</SelectItem>
            <SelectItem value="Customer's">Customer&apos;s Fabric</SelectItem>
          </SelectContent>
        </Select>
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
          <TableSkeleton columns={1} rows={5} />
        ) : (
          <MobileCardView
            data={filteredJobs}
            onCardClick={handleCardClick}
            emptyMessage="No sewing jobs found"
            renderCard={(job) => {
              const overdue = isOverdue(job);
              return (
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{job.customer_name}</div>
                      <div className="text-sm text-muted-foreground truncate">{job.item_sewn}</div>
                    </div>
                    <Badge
                      variant={job.status === "Done" ? "default" : job.status === "Part" ? "secondary" : "outline"}
                      className={
                        job.status === "Done"
                          ? "bg-green-100 text-green-700"
                          : job.status === "Part"
                          ? "bg-yellow-100 text-yellow-700"
                          : ""
                      }
                    >
                      {job.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total:</span>{" "}
                      <span className="font-medium">{formatCurrency(Number(job.total_charged))}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground">Balance:</span>{" "}
                      <span className="font-semibold text-orange-600">{formatCurrency(Number(job.balance))}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{formatDate(job.date)}</span>
                    {job.delivery_date_expected && (
                      <span className={overdue ? "text-red-600 font-medium flex items-center gap-1" : "text-muted-foreground"}>
                        {overdue && <AlertCircle className="h-3 w-3" />}
                        Due: {formatDate(job.delivery_date_expected)}
                      </span>
                    )}
                  </div>
                </div>
              );
            }}
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
              <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("customer_name")}>
                Customer{getSortIcon("customer_name")}
              </TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-50 text-right" onClick={() => handleSort("total_charged")}>
                Total{getSortIcon("total_charged")}
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-50 text-right" onClick={() => handleSort("amount_paid")}>
                Paid{getSortIcon("amount_paid")}
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-50 text-right" onClick={() => handleSort("balance")}>
                Balance{getSortIcon("balance")}
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-50 text-right" onClick={() => handleSort("profit")}>
                Profit{getSortIcon("profit")}
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("status")}>
                Status{getSortIcon("status")}
              </TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton columns={10} rows={5} />
            ) : filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
                  No jobs found
                </TableCell>
              </TableRow>
            ) : (
              filteredJobs.map((job) => {
                const overdue = isOverdue(job);

                return (
                  <TableRow key={job.id} className={overdue ? "bg-red-50" : ""}>
                    <TableCell>{formatDate(job.date)}</TableCell>
                    <TableCell>
                      <div
                        className="font-medium cursor-pointer hover:text-blue-600 flex items-center gap-1"
                        onClick={() => navigateToCustomer(job.customer_id)}
                      >
                        <User className="h-3 w-3" />
                        {job.customer_name}
                      </div>
                      {job.phone && (
                        <div className="text-xs text-muted-foreground">
                          {job.phone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>{job.item_sewn}</div>
                      <div className="text-xs text-muted-foreground">
                        {job.fabric_source}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(job.total_charged))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(job.amount_paid))}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={Number(job.balance) > 0 ? "text-orange-600 font-medium" : ""}>
                        {formatCurrency(Number(job.balance))}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={Number(job.profit) >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {formatCurrency(Number(job.profit))}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={job.status === "Done" ? "default" : job.status === "Part" ? "secondary" : "outline"}
                        className={
                          job.status === "Done"
                            ? "bg-green-100 text-green-700"
                            : job.status === "Part"
                            ? "bg-yellow-100 text-yellow-700"
                            : ""
                        }
                      >
                        {job.status === "Done" && <CheckCircle2 className="h-3 w-3 mr-1 inline" />}
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {job.delivery_date_expected ? (
                        <div className={overdue ? "text-red-600 font-medium flex items-center gap-1" : ""}>
                          {overdue && <AlertCircle className="h-4 w-4" />}
                          {formatDate(job.delivery_date_expected)}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(job)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(job.id)}
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

      {/* Mobile Detail Sheet */}
      <DetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        title="Sewing Job Details"
      >
        {selectedJob && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Customer</div>
                  <div
                    className="text-lg font-semibold cursor-pointer hover:text-blue-600 flex items-center gap-2"
                    onClick={() => {
                      setDetailSheetOpen(false);
                      navigateToCustomer(selectedJob.customer_id);
                    }}
                  >
                    <User className="h-4 w-4" />
                    {selectedJob.customer_name}
                  </div>
                  {selectedJob.phone && (
                    <div className="text-sm text-muted-foreground">{selectedJob.phone}</div>
                  )}
                </div>
                <Badge
                  variant={selectedJob.status === "Done" ? "default" : selectedJob.status === "Part" ? "secondary" : "outline"}
                  className={
                    selectedJob.status === "Done"
                      ? "bg-green-100 text-green-700"
                      : selectedJob.status === "Part"
                      ? "bg-yellow-100 text-yellow-700"
                      : ""
                  }
                >
                  {selectedJob.status}
                </Badge>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Item / Garment</div>
                <div className="font-medium">{selectedJob.item_sewn}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Fabric Source</div>
                  <div className="font-medium">{selectedJob.fabric_source}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="font-medium">{formatDate(selectedJob.date)}</div>
                </div>
              </div>

              <div className="space-y-2 rounded-md bg-gray-50 p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Material Cost:</span>
                  <span className="font-medium">{formatCurrency(Number(selectedJob.material_cost))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Labour Charge:</span>
                  <span className="font-medium">{formatCurrency(Number(selectedJob.labour_charge))}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Total Charged:</span>
                  <span className="font-bold">{formatCurrency(Number(selectedJob.total_charged))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Amount Paid:</span>
                  <span className="font-bold" style={{ color: "#EC88C7" }}>{formatCurrency(Number(selectedJob.amount_paid))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Balance:</span>
                  <span className="font-bold text-orange-600">{formatCurrency(Number(selectedJob.balance))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Profit:</span>
                  <span className="font-bold text-green-600">{formatCurrency(Number(selectedJob.profit))}</span>
                </div>
              </div>

              {selectedJob.delivery_date_expected && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Expected Delivery</div>
                    <div className={`font-medium ${isOverdue(selectedJob) ? "text-red-600" : ""}`}>
                      {formatDate(selectedJob.delivery_date_expected)}
                    </div>
                  </div>
                  {selectedJob.fitting_date && (
                    <div>
                      <div className="text-sm text-muted-foreground">Fitting Date</div>
                      <div className="font-medium">{formatDate(selectedJob.fitting_date)}</div>
                    </div>
                  )}
                </div>
              )}

              {selectedJob.measurements_reference && (
                <div>
                  <div className="text-sm text-muted-foreground">Measurements Reference</div>
                  <div className="text-sm">{selectedJob.measurements_reference}</div>
                </div>
              )}

              {selectedJob.notes && (
                <div>
                  <div className="text-sm text-muted-foreground">Notes</div>
                  <div className="text-sm whitespace-pre-wrap">{selectedJob.notes}</div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setDetailSheetOpen(false);
                  handleEdit(selectedJob);
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
                  handleDeleteClick(selectedJob.id);
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
        title="Delete Job"
        description="Are you sure you want to delete this sewing job? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
