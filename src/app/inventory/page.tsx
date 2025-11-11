"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { InventoryItem, FabricCategory } from "@/types/database";
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
import { Plus, Pencil, Trash2, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TableSkeleton } from "@/components/table-skeleton";

type SortField = "item_name" | "category" | "quantity_left" | "unit_cost" | "total_cost" | "date";
type SortDirection = "asc" | "desc";

const categories: FabricCategory[] = [
  "Fabric",
  "Thread",
  "Lining",
  "Zipper",
  "Embroidery",
  "Other",
];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    item_name: "",
    category: "Fabric" as FabricCategory,
    quantity_bought: "",
    quantity_used: "",
    unit_cost: "",
    supplier_notes: "",
    reorder_level: "",
    location: "",
    preferred_supplier: "",
  });

  const supabase = createClient();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching inventory:", error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      item_name: "",
      category: "Fabric",
      quantity_bought: "",
      quantity_used: "",
      unit_cost: "",
      supplier_notes: "",
      reorder_level: "",
      location: "",
      preferred_supplier: "",
    });
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      date: formData.date,
      item_name: formData.item_name,
      category: formData.category,
      quantity_bought: parseFloat(formData.quantity_bought) || 0,
      quantity_used: parseFloat(formData.quantity_used) || 0,
      unit_cost: parseFloat(formData.unit_cost) || 0,
      supplier_notes: formData.supplier_notes || null,
      reorder_level: formData.reorder_level ? parseFloat(formData.reorder_level) : null,
      location: formData.location || null,
      preferred_supplier: formData.preferred_supplier || null,
    };

    if (editingItem) {
      const { error } = await supabase
        .from("inventory")
        .update(data)
        .eq("id", editingItem.id);

      if (error) {
        console.error("Error updating item:", error);
        toast.error("Error updating item");
      } else {
        await fetchItems();
        setDialogOpen(false);
        resetForm();
        toast.success("Item updated successfully");
      }
    } else {
      const { error } = await supabase.from("inventory").insert([data]);

      if (error) {
        console.error("Error adding item:", error);
        toast.error("Error adding item");
      } else {
        await fetchItems();
        setDialogOpen(false);
        resetForm();
        toast.success("Item added successfully");
      }
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      date: item.date,
      item_name: item.item_name,
      category: item.category,
      quantity_bought: item.quantity_bought.toString(),
      quantity_used: item.quantity_used.toString(),
      unit_cost: item.unit_cost.toString(),
      supplier_notes: item.supplier_notes || "",
      reorder_level: item.reorder_level?.toString() || "",
      location: item.location || "",
      preferred_supplier: item.preferred_supplier || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const { error } = await supabase.from("inventory").delete().eq("id", id);

    if (error) {
      console.error("Error deleting item:", error);
      toast.error("Error deleting item");
    } else {
      await fetchItems();
      toast.success("Item deleted successfully");
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

  const filteredItems = items
    .filter((item) => {
      const matchesSearch = item.item_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle null/undefined values
      if (aValue == null) aValue = "";
      if (bValue == null) bValue = "";

      // Convert to numbers for numeric fields
      if (["quantity_left", "unit_cost", "total_cost"].includes(sortField)) {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      // Compare
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const totalInventoryValue = items.reduce(
    (sum, item) => sum + Number(item.total_cost),
    0
  );

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground">
            Manage your fabrics and materials
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
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Inventory Item" : "Add New Inventory Item"}
              </DialogTitle>
              <DialogDescription>
                {editingItem
                  ? "Update the details of this inventory item."
                  : "Add a new fabric or material to your inventory."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
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
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value as FabricCategory })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="item_name">Item Name</Label>
                <Input
                  id="item_name"
                  value={formData.item_name}
                  onChange={(e) =>
                    setFormData({ ...formData, item_name: e.target.value })
                  }
                  placeholder="e.g., Ankara - Red Floral"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity_bought">Quantity Bought</Label>
                  <Input
                    id="quantity_bought"
                    type="number"
                    step="0.01"
                    value={formData.quantity_bought}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity_bought: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity_used">Quantity Used</Label>
                  <Input
                    id="quantity_used"
                    type="number"
                    step="0.01"
                    value={formData.quantity_used}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity_used: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_cost">Unit Cost (₦)</Label>
                  <Input
                    id="unit_cost"
                    type="number"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={(e) =>
                      setFormData({ ...formData, unit_cost: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reorder_level">Reorder Level</Label>
                  <Input
                    id="reorder_level"
                    type="number"
                    step="0.01"
                    value={formData.reorder_level}
                    onChange={(e) =>
                      setFormData({ ...formData, reorder_level: e.target.value })
                    }
                    placeholder="Alert when stock is low"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="Storage location"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred_supplier">Preferred Supplier</Label>
                <Input
                  id="preferred_supplier"
                  value={formData.preferred_supplier}
                  onChange={(e) =>
                    setFormData({ ...formData, preferred_supplier: e.target.value })
                  }
                  placeholder="Where to reorder from"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier_notes">Supplier Notes</Label>
                <Input
                  id="supplier_notes"
                  value={formData.supplier_notes}
                  onChange={(e) =>
                    setFormData({ ...formData, supplier_notes: e.target.value })
                  }
                  placeholder="Additional notes"
                />
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
                  {editingItem ? "Update Item" : "Add Item"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-sm">
          <span className="font-medium">Total Value:</span>{" "}
          <span style={{ color: "#72D0CF" }} className="font-bold">
            {formatCurrency(totalInventoryValue)}
          </span>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("item_name")}>
                Item Name{getSortIcon("item_name")}
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("category")}>
                Category{getSortIcon("category")}
              </TableHead>
              <TableHead className="text-right">Bought</TableHead>
              <TableHead className="text-right">Used</TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-50 text-right" onClick={() => handleSort("quantity_left")}>
                Left{getSortIcon("quantity_left")}
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-50 text-right" onClick={() => handleSort("unit_cost")}>
                Unit Cost{getSortIcon("unit_cost")}
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-50 text-right" onClick={() => handleSort("total_cost")}>
                Total Cost{getSortIcon("total_cost")}
              </TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton columns={9} rows={5} />
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  No items found
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const isLowStock =
                  item.reorder_level && item.quantity_left <= item.reorder_level;

                return (
                  <TableRow key={item.id} className={isLowStock ? "bg-orange-50" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {isLowStock && (
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                        )}
                        {item.item_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100">
                        {item.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(item.quantity_bought).toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(item.quantity_used).toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {Number(item.quantity_left).toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(item.unit_cost))}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(item.total_cost))}
                    </TableCell>
                    <TableCell>{item.location || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
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
