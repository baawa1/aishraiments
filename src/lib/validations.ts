import { z } from "zod";

// Inventory validation schema
export const inventorySchema = z.object({
  date: z.string().min(1, "Date is required"),
  item_name: z.string().min(1, "Item name is required").max(100, "Item name is too long"),
  category: z.enum(["Fabric", "Thread", "Lining", "Zipper", "Embroidery", "Other"]),
  quantity_bought: z.string().min(1, "Quantity bought is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Must be a positive number"),
  quantity_used: z.string().min(1, "Quantity used is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Must be a positive number"),
  unit_cost: z.string().min(1, "Unit cost is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Must be a positive number"),
  reorder_level: z.string().optional(),
  location: z.string().max(100, "Location is too long").optional(),
  preferred_supplier: z.string().max(100, "Supplier name is too long").optional(),
  supplier_notes: z.string().max(500, "Notes are too long").optional(),
});

// Customer validation schema
export const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required").max(100, "Name is too long"),
  phone: z.string().optional(),
  address: z.string().max(200, "Address is too long").optional(),
  preferred_contact: z.string().optional(),
  fabric_preferences: z.string().max(500, "Text is too long").optional(),
  size_fit_notes: z.string().max(500, "Text is too long").optional(),
  measurements_notes: z.string().max(1000, "Text is too long").optional(),
});

// Sewing Job validation schema
export const sewingJobSchema = z.object({
  date: z.string().min(1, "Date is required"),
  customer_id: z.string().optional(),
  customer_name: z.string().min(1, "Customer name is required"),
  phone: z.string().optional(),
  fabric_source: z.enum(["Yours", "Customer's"]),
  item_sewn: z.string().min(1, "Item description is required").max(200, "Description is too long"),
  material_cost: z.string().min(1, "Material cost is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Must be a positive number"),
  labour_charge: z.string().min(1, "Labour charge is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Must be a positive number"),
  amount_paid: z.string()
    .refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), "Must be a positive number"),
  status: z.enum(["Pending", "Part", "Done"]),
  delivery_date_expected: z.string().optional(),
  fitting_date: z.string().optional(),
  notes: z.string().max(1000, "Notes are too long").optional(),
});

// Expense validation schema
export const expenseSchema = z.object({
  date: z.string().min(1, "Date is required"),
  expense_type: z.enum(["Embroidery", "Transport", "Repair", "Supplies", "Other"]),
  description: z.string().min(1, "Description is required").max(200, "Description is too long"),
  amount: z.string().min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Must be a positive number"),
  vendor_payee: z.string().max(100, "Vendor name is too long").optional(),
  payment_method: z.enum(["Transfer", "Cash", "POS", "Other", ""]).optional(),
  is_fixed: z.boolean(),
  job_link: z.string().optional(),
});

// Sales validation schema
export const salesSchema = z.object({
  date: z.string().min(1, "Date is required"),
  sale_type: z.enum(["Sewing", "Fabric", "Other"]),
  customer_id: z.string().optional(),
  customer_name: z.string().min(1, "Customer name is required"),
  total_amount: z.string().min(1, "Total amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Must be a positive number"),
  amount_paid: z.string()
    .refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), "Must be a positive number"),
  notes: z.string().max(500, "Notes are too long").optional(),
});

// Collection/Payment validation schema
export const collectionSchema = z.object({
  date: z.string().min(1, "Date is required"),
  customer_id: z.string().min(1, "Customer is required"),
  customer_name: z.string().min(1, "Customer name is required"),
  amount: z.string().min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Must be a positive number"),
  payment_method: z.enum(["Transfer", "Cash", "POS", "Other"]),
  sale_id: z.string().optional(),
  notes: z.string().max(500, "Notes are too long").optional(),
});

export type InventoryFormData = z.infer<typeof inventorySchema>;
export type CustomerFormData = z.infer<typeof customerSchema>;
export type SewingJobFormData = z.infer<typeof sewingJobSchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type SalesFormData = z.infer<typeof salesSchema>;
export type CollectionFormData = z.infer<typeof collectionSchema>;
