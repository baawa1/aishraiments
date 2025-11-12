// Enum types
export type FabricCategory = 'Fabric' | 'Thread' | 'Lining' | 'Zipper' | 'Embroidery' | 'Other';
export type JobStatus = 'Pending' | 'Part' | 'Done';
export type FabricSource = 'Yours' | "Customer's";
export type ExpenseType = 'Embroidery' | 'Transport' | 'Repair' | 'Supplies' | 'Other';
export type SaleType = 'Sewing' | 'Fabric' | 'Other';
export type PaymentMethod = 'Transfer' | 'Cash' | 'POS' | 'Other';

// Customer type
export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  measurements_notes: string | null;
  first_order_date: string | null;
  last_order_date: string | null;
  preferred_contact: string | null;
  fabric_preferences: string | null;
  size_fit_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerInsert extends Omit<Customer, 'id' | 'created_at' | 'updated_at'> {}
export interface CustomerUpdate extends Partial<CustomerInsert> {}

// Inventory type
export interface InventoryItem {
  id: string;
  date: string;
  item_name: string;
  category: FabricCategory;
  quantity_bought: number;
  quantity_used: number;
  unit_cost: number;
  supplier_notes: string | null;
  reorder_level: number | null;
  location: string | null;
  last_used_date: string | null;
  preferred_supplier: string | null;
  created_at: string;
  updated_at: string;
  // Computed fields
  quantity_left: number;
  total_cost: number;
}

export interface InventoryItemInsert extends Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'quantity_left' | 'total_cost'> {}
export interface InventoryItemUpdate extends Partial<InventoryItemInsert> {}

// Sewing Job type
export interface SewingJob {
  id: string;
  date: string;
  customer_id: string | null;
  customer_name: string;
  phone: string | null;
  fabric_source: FabricSource;
  item_sewn: string;
  material_cost: number;
  labour_charge: number;
  amount_paid: number;
  status: JobStatus;
  notes: string | null;
  delivery_date_expected: string | null;
  delivery_date_actual: string | null;
  fitting_date: string | null;
  hours_spent: number | null;
  measurements_reference: string | null;
  created_at: string;
  updated_at: string;
  // Computed fields
  total_charged: number;
  balance: number;
  profit: number;
}

export interface SewingJobInsert extends Omit<SewingJob, 'id' | 'created_at' | 'updated_at' | 'total_charged' | 'balance' | 'profit'> {}
export interface SewingJobUpdate extends Partial<SewingJobInsert> {}

// Expense type
export interface Expense {
  id: string;
  date: string;
  expense_type: ExpenseType;
  description: string | null;
  amount: number;
  job_link: string | null;
  payment_method: PaymentMethod | null;
  vendor_payee: string | null;
  is_fixed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpenseInsert extends Omit<Expense, 'id' | 'created_at' | 'updated_at'> {}
export interface ExpenseUpdate extends Partial<ExpenseInsert> {}

// Sales Summary type
export interface SalesSummary {
  id: string;
  date: string;
  sale_type: SaleType;
  customer_id: string | null;
  customer_name: string;
  total_amount: number;
  amount_paid: number;
  notes: string | null;
  sewing_job_id: string | null;
  created_at: string;
  updated_at: string;
  // Computed field
  balance: number;
}

export interface SalesSummaryInsert extends Omit<SalesSummary, 'id' | 'created_at' | 'updated_at' | 'balance'> {}
export interface SalesSummaryUpdate extends Partial<SalesSummaryInsert> {}

// Collections Log type
export interface CollectionLog {
  id: string;
  date: string;
  customer_id: string | null;
  customer_name: string;
  amount: number;
  payment_method: PaymentMethod;
  notes: string | null;
  sale_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollectionLogInsert extends Omit<CollectionLog, 'id' | 'created_at' | 'updated_at'> {}
export interface CollectionLogUpdate extends Partial<CollectionLogInsert> {}

// Settings type
export interface Setting {
  id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface SettingInsert extends Omit<Setting, 'id' | 'created_at' | 'updated_at'> {}
export interface SettingUpdate extends Partial<SettingInsert> {}

// Dashboard KPI types
export interface DashboardMetrics {
  totalSales: number;
  amountCollected: number;
  outstandingBalance: number;
  totalExpenses: number;
  materialCost: number;
  profit: number;
  inventoryValue: number;
}

export interface MonthlyData {
  month: string;
  totalSales: number;
  amountCollected: number;
  outstanding: number;
  materialCost: number;
  expenses: number;
  profit: number;
}

export interface Receivable {
  customer_id: string;
  customer_name: string;
  phone: string | null;
  total_outstanding: number;
  last_sale_date: string;
  is_overdue: boolean;
}

// Database schema type for Supabase
export interface Database {
  public: {
    Tables: {
      customers: {
        Row: Customer;
        Insert: CustomerInsert;
        Update: CustomerUpdate;
      };
      inventory_items: {
        Row: InventoryItem;
        Insert: InventoryItemInsert;
        Update: InventoryItemUpdate;
      };
      sewing_jobs: {
        Row: SewingJob;
        Insert: SewingJobInsert;
        Update: SewingJobUpdate;
      };
      expenses: {
        Row: Expense;
        Insert: ExpenseInsert;
        Update: ExpenseUpdate;
      };
      sales_summary: {
        Row: SalesSummary;
        Insert: SalesSummaryInsert;
        Update: SalesSummaryUpdate;
      };
      collections_log: {
        Row: CollectionLog;
        Insert: CollectionLogInsert;
        Update: CollectionLogUpdate;
      };
      settings: {
        Row: Setting;
        Insert: SettingInsert;
        Update: SettingUpdate;
      };
    };
    Views: {
      [_: string]: never;
    };
    Functions: {
      [_: string]: never;
    };
    Enums: {
      fabric_category: FabricCategory;
      job_status: JobStatus;
      fabric_source: FabricSource;
      expense_type: ExpenseType;
      sale_type: SaleType;
      payment_method: PaymentMethod;
    };
  };
}
