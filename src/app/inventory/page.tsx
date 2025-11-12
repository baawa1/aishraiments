"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { InventoryItem, FabricCategory } from "@/types/database";
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
import { Plus, Pencil, Trash2, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TableSkeleton } from "@/components/table-skeleton";
import { MobileCardSkeleton } from "@/components/mobile-card-skeleton";

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
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const [formData, setFormData] = useState<{
    date: Date | undefined;
    item_name: string;
    category: FabricCategory;
    quantity_bought: string;
    quantity_used: string;
    unit_cost: string;
    supplier_notes: string;
    reorder_level: string;
    location: string;
    preferred_supplier: string;
  }>({
    date: new Date(),
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
      date: new Date(),
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
    setSubmitting(true);

    const data = {
      date: formData.date?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
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
    setSubmitting(false);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      date: new Date(item.date),
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

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    setDeleting(true);
    const { error } = await supabase.from("inventory").delete().eq("id", deletingId);

    if (error) {
      console.error("Error deleting item:", error);
      toast.error("Error deleting item");
    } else {
      await fetchItems();
      toast.success("Item deleted successfully");
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
    setSelectedCategory("all");
  };

  const hasActiveFilters = searchTerm !== "" || selectedCategory !== "all";

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

  const handleCardClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setDetailSheetOpen(true);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Inventory</h2>
          <p className="text-sm text-muted-foreground">
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
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:p-6 p-4">
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
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <DatePicker
                    date={formData.date}
                    onDateChange={(date) => setFormData({ ...formData, date })}
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

              <div className="grid sm:grid-cols-3 gap-4">
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

              <div className="grid sm:grid-cols-2 gap-4">
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
                  {editingItem ? "Update Item" : "Add Item"}
                </LoadingButton>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[180px]">
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
        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
        <div className="text-sm text-center sm:text-left">
          <span className="font-medium">Total Value:</span>{" "}
          <span style={{ color: "#72D0CF" }} className="font-bold">
            {formatCurrency(totalInventoryValue)}
          </span>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {loading ? (
          <MobileCardSkeleton rows={5} />
        ) : (
          <MobileCardView
            data={filteredItems}
            onCardClick={handleCardClick}
            emptyMessage="No inventory items found"
            renderCard={(item) => {
              const isLowStock = item.reorder_level && item.quantity_left <= item.reorder_level;
              return (
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {isLowStock && <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />}
                      <span className="font-semibold truncate">{item.item_name}</span>
                    </div>
                    <Badge variant="secondary">{item.category}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Left:</span>{" "}
                      <span className="font-medium">{Number(item.quantity_left).toFixed(1)}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{formatCurrency(Number(item.total_cost))}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.location || "No location"} • {formatDate(item.date)}
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
                      <Badge variant="secondary">{item.category}</Badge>
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
                          onClick={() => handleDeleteClick(item.id)}
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
        title="Inventory Item Details"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Item Name</div>
                <div className="text-lg font-semibold flex items-center gap-2">
                  {selectedItem.reorder_level && selectedItem.quantity_left <= selectedItem.reorder_level && (
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                  )}
                  {selectedItem.item_name}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Category</div>
                  <Badge variant="secondary" className="mt-1">{selectedItem.category}</Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="font-medium">{formatDate(selectedItem.date)}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Bought</div>
                  <div className="font-medium">{Number(selectedItem.quantity_bought).toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Used</div>
                  <div className="font-medium">{Number(selectedItem.quantity_used).toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Left</div>
                  <div className="font-semibold text-lg">{Number(selectedItem.quantity_left).toFixed(1)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Unit Cost</div>
                  <div className="font-medium">{formatCurrency(Number(selectedItem.unit_cost))}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Cost</div>
                  <div className="font-semibold text-lg">{formatCurrency(Number(selectedItem.total_cost))}</div>
                </div>
              </div>

              {(selectedItem.location || selectedItem.preferred_supplier) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedItem.location && (
                    <div>
                      <div className="text-sm text-muted-foreground">Location</div>
                      <div className="font-medium">{selectedItem.location}</div>
                    </div>
                  )}
                  {selectedItem.preferred_supplier && (
                    <div>
                      <div className="text-sm text-muted-foreground">Supplier</div>
                      <div className="font-medium">{selectedItem.preferred_supplier}</div>
                    </div>
                  )}
                </div>
              )}

              {selectedItem.reorder_level && (
                <div>
                  <div className="text-sm text-muted-foreground">Reorder Level</div>
                  <div className="font-medium">{selectedItem.reorder_level}</div>
                </div>
              )}

              {selectedItem.supplier_notes && (
                <div>
                  <div className="text-sm text-muted-foreground">Notes</div>
                  <div className="text-sm">{selectedItem.supplier_notes}</div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setDetailSheetOpen(false);
                  handleEdit(selectedItem);
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
                  handleDeleteClick(selectedItem.id);
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
        title="Delete Item"
        description="Are you sure you want to delete this inventory item? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
