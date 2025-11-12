// Brand Colors
export const COLORS = {
  primary: '#72D0CF',     // Teal - Creativity & sophistication
  accent: '#EC88C7',      // Pink - Fashion & elegance
  success: '#10B981',     // Green
  warning: '#F59E0B',     // Orange
  error: '#EF4444',       // Red
  info: '#6366F1',        // Indigo
} as const;

// Business Logic Constants
export const BUSINESS_RULES = {
  LOW_STOCK_THRESHOLD: 5,           // Quantity threshold for low stock alerts
  OVERDUE_DAYS: 60,                 // Days after last order to mark customer as inactive
  REORDER_DEFAULT_LEVEL: 10,        // Default reorder level for inventory
  PROFIT_MARGIN_TARGET: 0.40,       // 40% target profit margin
  RECENT_JOBS_LIMIT: 5,             // Number of recent jobs to show on dashboard
  LOW_STOCK_ITEMS_LIMIT: 5,         // Number of low stock items to show
} as const;

// Job Status Values
export const JOB_STATUS = {
  PENDING: 'Pending',
  PART: 'Part',
  DONE: 'Done',
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  TRANSFER: 'Transfer',
  CASH: 'Cash',
  POS: 'POS',
  OTHER: 'Other',
} as const;

// Fabric Categories
export const FABRIC_CATEGORIES = {
  FABRIC: 'Fabric',
  THREAD: 'Thread',
  LINING: 'Lining',
  ZIPPER: 'Zipper',
  EMBROIDERY: 'Embroidery',
  OTHER: 'Other',
} as const;

// Expense Types
export const EXPENSE_TYPES = {
  EMBROIDERY: 'Embroidery',
  TRANSPORT: 'Transport',
  REPAIR: 'Repair',
  SUPPLIES: 'Supplies',
  OTHER: 'Other',
} as const;

// Sale Types
export const SALE_TYPES = {
  SEWING: 'Sewing',
  FABRIC: 'Fabric',
  OTHER: 'Other',
} as const;

// Fabric Source
export const FABRIC_SOURCE = {
  YOURS: 'Yours',
  CUSTOMER: "Customer's",
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
} as const;

// Currency
export const CURRENCY = {
  SYMBOL: '₦',
  CODE: 'NGN',
  DECIMAL_PLACES: 2,
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  FULL: 'MMMM dd, yyyy HH:mm',
} as const;
