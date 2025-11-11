"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Expense, ExpenseType, PaymentMethod } from "@/types/database";
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
import { Plus, Pencil, Trash2, RefreshCcw } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showFixedOnly, setShowFixedOnly] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    expense_type: "Supplies" as ExpenseType,
    description: "",
    amount: "",
    vendor_payee: "",
    payment_method: "Cash" as PaymentMethod | "",
    is_fixed: false,
    job_link: "",
  });

  const supabase = createClient();

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching expenses:", error);
    } else {
      setExpenses(data || []);
    }
    setLoading(false);
  }, [supabase]);

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
      date: new Date().toISOString().split("T")[0],
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

    const data = {
      date: formData.date,
      expense_type: formData.expense_type,
      description: formData.description || null,
      amount: parseFloat(formData.amount),
      vendor_payee: formData.vendor_payee || null,
      payment_method: formData.payment_method || null,
      is_fixed: formData.is_fixed,
      job_link: formData.job_link || null,
    };

    if (editingExpense) {
      const { error } = await supabase
        .from("expenses")
        .update(data)
        .eq("id", editingExpense.id);

      if (error) {
        console.error("Error updating expense:", error);
        alert("Error updating expense");
      } else {
        await fetchExpenses();
        setDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase.from("expenses").insert([data]);

      if (error) {
        console.error("Error adding expense:", error);
        alert("Error adding expense");
      } else {
        await fetchExpenses();
        setDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      date: expense.date,
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    const { error } = await supabase.from("expenses").delete().eq("id", id);

    if (error) {
      console.error("Error deleting expense:", error);
      alert("Error deleting expense");
    } else {
      await fetchExpenses();
    }
  };

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

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
          <p className="text-muted-foreground">
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
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
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

              <div className="grid grid-cols-2 gap-4">
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
                <Button type="submit" style={{ backgroundColor: "#EC88C7" }}>
                  {editingExpense ? "Update Expense" : "Add Expense"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <Input
          placeholder="Search by description or vendor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
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
          size="sm"
          className="gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Fixed Only
        </Button>
        <div className="ml-auto flex gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total: </span>
            <span className="font-bold" style={{ color: "#EC88C7" }}>
              {formatCurrency(totalExpenses)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Fixed: </span>
            <span className="font-bold">
              {formatCurrency(fixedExpenses)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Variable: </span>
            <span className="font-bold">
              {formatCurrency(variableExpenses)}
            </span>
          </div>
        </div>
      </div>

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
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No expenses found
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{formatDate(expense.date)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100">
                        {expense.expense_type}
                      </span>
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
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700">
                        {expense.payment_method}
                      </span>
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
                        onClick={() => handleDelete(expense.id)}
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
