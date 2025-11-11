"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { SewingJob, FabricSource, JobStatus } from "@/types/database";
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
import { Plus, Pencil, Trash2, AlertCircle, CheckCircle2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/table-skeleton";

type SortField = "date" | "customer_name" | "total_charged" | "amount_paid" | "balance" | "profit" | "status";
type SortDirection = "asc" | "desc";

export default function JobsPage() {
  const [jobs, setJobs] = useState<SewingJob[]>([]);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; phone: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<SewingJob | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fabricSourceFilter, setFabricSourceFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    customer_id: "",
    customer_name: "",
    phone: "",
    fabric_source: "Yours" as FabricSource,
    item_sewn: "",
    material_cost: "",
    labour_charge: "",
    amount_paid: "",
    status: "Pending" as JobStatus,
    delivery_date_expected: "",
    fitting_date: "",
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

  useEffect(() => {
    fetchJobs();
    fetchCustomers();
  }, [fetchJobs, fetchCustomers]);

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      customer_id: "",
      customer_name: "",
      phone: "",
      fabric_source: "Yours",
      item_sewn: "",
      material_cost: "",
      labour_charge: "",
      amount_paid: "",
      status: "Pending",
      delivery_date_expected: "",
      fitting_date: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    // If status is changing to "Done", prompt for actual delivery date
    let deliveryDateActual = editingJob?.delivery_date_actual || null;
    if (autoStatus === "Done" && (!editingJob || editingJob.status !== "Done")) {
      const today = new Date().toISOString().split("T")[0];
      const userDate = prompt("Job completed! Enter actual delivery date (YYYY-MM-DD):", today);
      if (userDate) {
        deliveryDateActual = userDate;
      } else {
        deliveryDateActual = today;
      }
    }

    const data = {
      date: formData.date,
      customer_id: formData.customer_id || null,
      customer_name: formData.customer_name,
      phone: formData.phone || null,
      fabric_source: formData.fabric_source,
      item_sewn: formData.item_sewn,
      material_cost: parseFloat(formData.material_cost) || 0,
      labour_charge: parseFloat(formData.labour_charge) || 0,
      amount_paid: amountPaid,
      status: autoStatus,
      delivery_date_expected: formData.delivery_date_expected || null,
      delivery_date_actual: deliveryDateActual,
      fitting_date: formData.fitting_date || null,
      measurements_reference: formData.measurements_reference || null,
      notes: formData.notes || null,
    };

    if (editingJob) {
      const { error } = await supabase
        .from("sewing_jobs")
        .update(data)
        .eq("id", editingJob.id);

      if (error) {
        console.error("Error updating job:", error);
        toast.error("Error updating job");
      } else {
        // If status changed to "Done", create/update sale record
        if (autoStatus === "Done" && (!editingJob || editingJob.status !== "Done")) {
          // Check if sale already exists for this job
          const { data: existingSale } = await supabase
            .from("sales_summary")
            .select("id")
            .eq("sewing_job_id", editingJob.id)
            .single();

          if (!existingSale) {
            // Create new sale record
            await supabase.from("sales_summary").insert([{
              date: formData.date,
              sale_type: "Sewing" as const,
              customer_id: formData.customer_id || null,
              customer_name: formData.customer_name,
              total_amount: totalCharged,
              amount_paid: amountPaid,
              sewing_job_id: editingJob.id,
              notes: `Auto-created from job: ${formData.item_sewn}`,
            }]);
          } else {
            // Update existing sale
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
        if (formData.customer_id) {
          await supabase
            .from("customers")
            .update({ last_order_date: formData.date })
            .eq("id", formData.customer_id);
        }

        await fetchJobs();
        setDialogOpen(false);
        resetForm();
        toast.success("Job updated successfully");
      }
    } else {
      const { error, data: newJob } = await supabase
        .from("sewing_jobs")
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error("Error adding job:", error);
        toast.error("Error adding job");
      } else {
        // If job is created with "Done" status, create sale record
        if (autoStatus === "Done" && newJob) {
          await supabase.from("sales_summary").insert([{
            date: formData.date,
            sale_type: "Sewing" as const,
            customer_id: formData.customer_id || null,
            customer_name: formData.customer_name,
            total_amount: totalCharged,
            amount_paid: amountPaid,
            sewing_job_id: newJob.id,
            notes: `Auto-created from job: ${formData.item_sewn}`,
          }]);
        }

        // Update customer's first and last order dates
        if (formData.customer_id) {
          const { data: customer } = await supabase
            .from("customers")
            .select("first_order_date")
            .eq("id", formData.customer_id)
            .single();

          const updates: { last_order_date: string; first_order_date?: string } = {
            last_order_date: formData.date,
          };

          if (!customer?.first_order_date) {
            updates.first_order_date = formData.date;
          }

          await supabase
            .from("customers")
            .update(updates)
            .eq("id", formData.customer_id);
        }

        await fetchJobs();
        setDialogOpen(false);
        resetForm();
        toast.success("Job added successfully");
      }
    }
  };

  const handleEdit = (job: SewingJob) => {
    setEditingJob(job);
    setFormData({
      date: job.date,
      customer_id: job.customer_id || "",
      customer_name: job.customer_name,
      phone: job.phone || "",
      fabric_source: job.fabric_source,
      item_sewn: job.item_sewn,
      material_cost: job.material_cost.toString(),
      labour_charge: job.labour_charge.toString(),
      amount_paid: job.amount_paid.toString(),
      status: job.status,
      delivery_date_expected: job.delivery_date_expected || "",
      fitting_date: job.fitting_date || "",
      measurements_reference: job.measurements_reference || "",
      notes: job.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    const { error } = await supabase.from("sewing_jobs").delete().eq("id", id);

    if (error) {
      console.error("Error deleting job:", error);
      toast.error("Error deleting job");
    } else {
      await fetchJobs();
      toast.success("Job deleted successfully");
    }
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

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sewing Jobs</h2>
          <p className="text-muted-foreground">
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
            >
              <Plus className="mr-2 h-4 w-4" />
              New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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
                      setFormData({ ...formData, fabric_source: value as FabricSource })
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

              <div className="grid grid-cols-3 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery_date_expected">Expected Delivery</Label>
                  <Input
                    id="delivery_date_expected"
                    type="date"
                    value={formData.delivery_date_expected}
                    onChange={(e) =>
                      setFormData({ ...formData, delivery_date_expected: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fitting_date">Fitting Date</Label>
                  <Input
                    id="fitting_date"
                    type="date"
                    value={formData.fitting_date}
                    onChange={(e) =>
                      setFormData({ ...formData, fitting_date: e.target.value })
                    }
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
                    ₦{((parseFloat(formData.material_cost) || 0) + (parseFloat(formData.labour_charge) || 0)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Balance:</span>
                  <span className="font-bold text-orange-600">
                    ₦{((parseFloat(formData.material_cost) || 0) + (parseFloat(formData.labour_charge) || 0) - (parseFloat(formData.amount_paid) || 0)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Profit:</span>
                  <span className="font-bold text-green-600">
                    ₦{((parseFloat(formData.amount_paid) || 0) - (parseFloat(formData.material_cost) || 0)).toLocaleString()}
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
                  {editingJob ? "Update Job" : "Create Job"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <Input
          placeholder="Search by customer or item..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
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
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="Yours">Your Fabric</SelectItem>
            <SelectItem value="Customer's">Customer&apos;s Fabric</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Revenue: </span>
            <span className="font-bold" style={{ color: "#72D0CF" }}>
              {formatCurrency(totalRevenue)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Collected: </span>
            <span className="font-bold" style={{ color: "#EC88C7" }}>
              {formatCurrency(totalCollected)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Profit: </span>
            <span className="font-bold text-green-600">
              {formatCurrency(totalProfit)}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-md border">
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
                      <div className="font-medium">{job.customer_name}</div>
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
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          job.status === "Done"
                            ? "bg-green-100 text-green-700"
                            : job.status === "Part"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {job.status === "Done" && <CheckCircle2 className="h-3 w-3" />}
                        {job.status}
                      </span>
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
                          onClick={() => handleDelete(job.id)}
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
    </div>
  );
}
