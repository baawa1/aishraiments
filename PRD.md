# Product Requirements Document (PRD)
## A'ish Raiments - Inventory & Accounting Management System

---

## 📋 Document Information

**Product Name:** A'ish Raiments Business Management System
**Version:** 1.0.0
**Last Updated:** November 11, 2025
**Document Owner:** A'ish Raiments
**Status:** In Development

---

## 🎯 Executive Summary

### Vision
To create a comprehensive, easy-to-use business management system specifically designed for fashion sewing businesses, replacing Excel-based tracking with a modern web application that automates calculations, provides real-time insights, and scales with business growth.

### Business Objective
Enable A'ish Raiments to efficiently manage inventory, track customer orders, monitor expenses, and gain visibility into business profitability through an intuitive digital platform accessible from any device.

### Target Users
- **Primary:** Business owner (Admin access)
- **Secondary:** 2-3 staff members/apprentices (Standard user access)

### Success Metrics
- **Efficiency:** Reduce time spent on data entry by 60%
- **Accuracy:** Eliminate manual calculation errors
- **Visibility:** Real-time profit/loss tracking
- **Cash Flow:** Track receivables and reduce outstanding payments by 30%
- **Inventory:** Prevent stock-outs with automated low-stock alerts

---

## 🏢 Business Context

### Current State (Excel-Based System)
**Pain Points:**
- Manual data entry across multiple sheets
- Prone to formula errors and data inconsistencies
- Limited mobile accessibility
- No real-time collaboration
- Difficult to track who owes money
- No automated alerts for low stock or overdue payments
- Time-consuming monthly reporting

**What Works Well:**
- Comprehensive data tracking
- Custom calculations for profit margins
- Brand color integration
- Monthly summary views

### Desired Future State
A modern web application that:
- ✅ Automates all calculations
- ✅ Works on desktop, tablet, and mobile
- ✅ Supports multiple users simultaneously
- ✅ Sends alerts for low stock and overdue payments
- ✅ Generates reports with one click
- ✅ Maintains brand identity
- ✅ Scales as the business grows

---

## 👥 User Personas

### Persona 1: Aisha (Business Owner)
**Role:** Admin
**Tech Proficiency:** Medium
**Primary Goals:**
- Monitor business profitability daily
- Track which customers owe money
- Manage inventory levels
- Understand monthly trends

**Pain Points:**
- Spends 2-3 hours weekly updating Excel
- Can't access data when meeting with clients
- Unsure which customers are overdue
- Doesn't know when to reorder materials

**Key Needs:**
- Dashboard with at-a-glance metrics
- Mobile access to customer information
- Automatic receivables tracking
- Low stock notifications

### Persona 2: Fatima (Senior Apprentice)
**Role:** Standard User
**Tech Proficiency:** Low-Medium
**Primary Goals:**
- Record new orders as they come in
- Update job status when garments are completed
- Track fabric usage
- Log customer payments

**Pain Points:**
- Doesn't know how to use Excel formulas
- Makes data entry mistakes
- Forgets to update job statuses
- Can't check inventory while shopping for materials

**Key Needs:**
- Simple, guided data entry forms
- Mobile-friendly interface
- Clear error messages
- No complex formulas to manage

---

## 🎨 Brand Identity

### Visual Identity
- **Business Name:** A'ish Raiments
- **Tagline:** Fashion Designer with Panache
- **Primary Color:** #72D0CF (Teal) - Creativity, sophistication
- **Accent Color:** #EC88C7 (Pink) - Fashion, femininity, elegance

### Brand Values
- **Professional:** Clean, organized, trustworthy
- **Creative:** Stylish, modern design
- **Accessible:** Easy to use, friendly interface
- **Empowering:** Helps business grow and succeed

---

## 🛠️ Technical Stack

### Frontend
- **Framework:** Next.js 14 (React 18)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Icons:** Lucide React
- **Charts:** Recharts

### Backend & Database
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth
- **API:** Supabase Client SDK
- **Real-time:** Supabase Realtime (future enhancement)

### Development Tools
- **Version Control:** Git
- **Package Manager:** npm
- **Code Quality:** ESLint, TypeScript strict mode
- **Deployment:** Vercel (recommended)

---

## 📊 Database Schema

### Tables

#### 1. **customers**
Stores customer information and contact details.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Customer name |
| phone | TEXT | Contact number |
| address | TEXT | Location/area |
| measurements_notes | TEXT | Body measurements |
| first_order_date | DATE | When they became a customer |
| last_order_date | DATE | Most recent order |
| preferred_contact | TEXT | WhatsApp, call, etc. |
| fabric_preferences | TEXT | Favorite fabrics/styles |
| size_fit_notes | TEXT | Fit preferences |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last modification time |

**Key Features:**
- Lifetime value calculation
- Inactive customer identification
- Measurement history

#### 2. **inventory**
Tracks all fabrics and sewing materials.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| date | DATE | Purchase date |
| item_name | TEXT | Material name (e.g., "Ankara - Red Floral") |
| category | ENUM | Fabric, Thread, Lining, Zipper, Embroidery, Other |
| quantity_bought | DECIMAL | Units purchased |
| quantity_used | DECIMAL | Units consumed |
| quantity_left | DECIMAL | **Computed:** bought - used |
| unit_cost | DECIMAL | Cost per unit (₦) |
| total_cost | DECIMAL | **Computed:** quantity_left × unit_cost |
| supplier_notes | TEXT | Vendor/source information |
| reorder_level | DECIMAL | Low stock threshold |
| location | TEXT | Storage location |
| last_used_date | DATE | When material was last used |
| preferred_supplier | TEXT | Where to reorder |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last update |

**Key Features:**
- Automatic quantity calculation
- Low stock alerts
- Total inventory value tracking
- Supplier management

#### 3. **sewing_jobs**
Manages all customer orders and sewing projects.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| date | DATE | Order date |
| customer_id | UUID | Foreign key → customers |
| customer_name | TEXT | Customer name |
| phone | TEXT | Contact number |
| fabric_source | ENUM | "Yours" or "Customer's" |
| item_sewn | TEXT | Garment type |
| material_cost | DECIMAL | Cost of fabrics used (₦) |
| labour_charge | DECIMAL | Sewing fee (₦) |
| total_charged | DECIMAL | **Computed:** material + labour |
| amount_paid | DECIMAL | What customer paid (₦) |
| balance | DECIMAL | **Computed:** total - paid |
| profit | DECIMAL | **Computed:** paid - material_cost |
| status | ENUM | Pending, Part, Done |
| delivery_date_expected | DATE | When customer expects it |
| delivery_date_actual | DATE | When delivered |
| fitting_date | DATE | Appointment for fitting |
| hours_spent | DECIMAL | Time tracking |
| measurements_reference | TEXT | Link to customer measurements |
| notes | TEXT | Special instructions |
| created_at | TIMESTAMP | Order creation |
| updated_at | TIMESTAMP | Last update |

**Key Features:**
- Automatic profit calculation
- Part-payment tracking
- Status workflow
- Delivery date tracking
- Material cost attribution

#### 4. **expenses**
Records all business operating expenses.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| date | DATE | Expense date |
| expense_type | ENUM | Embroidery, Transport, Repair, Supplies, Other |
| description | TEXT | What was purchased |
| amount | DECIMAL | Cost (₦) |
| job_link | UUID | Foreign key → sewing_jobs (if job-specific) |
| payment_method | ENUM | Transfer, Cash, POS, Other |
| vendor_payee | TEXT | Who was paid |
| is_fixed | BOOLEAN | Recurring expense flag |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last update |

**Key Features:**
- Job-specific expense tracking
- Fixed vs variable categorization
- Vendor tracking
- Monthly expense analysis

#### 5. **sales_summary**
Central record of all sales transactions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| date | DATE | Sale date |
| sale_type | ENUM | Sewing, Fabric, Other |
| customer_id | UUID | Foreign key → customers |
| customer_name | TEXT | Customer name |
| total_amount | DECIMAL | Total sale value (₦) |
| amount_paid | DECIMAL | Amount received (₦) |
| balance | DECIMAL | **Computed:** total - paid |
| sewing_job_id | UUID | Foreign key → sewing_jobs |
| notes | TEXT | Additional details |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last update |

**Key Features:**
- Links to sewing jobs
- Automatic balance calculation
- Multi-type sales tracking

#### 6. **collections_log**
Tracks all payment collections after initial sale.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| date | DATE | Payment date |
| customer_id | UUID | Foreign key → customers |
| customer_name | TEXT | Customer name |
| amount | DECIMAL | Payment received (₦) |
| payment_method | ENUM | Transfer, Cash, POS, Other |
| sale_id | UUID | Foreign key → sales_summary |
| notes | TEXT | Payment details |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last update |

**Key Features:**
- Part-payment tracking
- Payment method analysis
- Receivables reduction

#### 7. **settings**
Application configuration and brand settings.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| key | TEXT | Setting name (unique) |
| value | TEXT | Setting value |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last update |

**Default Settings:**
- `reporting_year`: 2025
- `brand_primary_color`: #72D0CF
- `brand_accent_color`: #EC88C7
- `business_name`: A'ish Raiments
- `business_motto`: Fashion Designer with Panache

---

## 🎯 Core Features & Requirements

### 1. Authentication & User Management

#### 1.1 Login System
**Priority:** P0 (Critical)
**Status:** ✅ Implemented

**Requirements:**
- Users must authenticate with email and password
- Login page displays brand identity (logo, colors, tagline)
- Failed login attempts show clear error messages
- Session persists across browser refreshes
- Automatic redirect to dashboard after successful login

**Acceptance Criteria:**
- [ ] User can log in with valid credentials
- [ ] Invalid credentials show error message
- [ ] Session remains active for 7 days
- [ ] Logout clears session completely

#### 1.2 User Roles (Future Enhancement)
**Priority:** P2 (Nice to have)

**Roles:**
- **Admin:** Full access to all features
- **Staff:** Cannot delete records or change settings
- **View-Only:** Can view but not edit

---

### 2. Dashboard

#### 2.1 KPI Cards
**Priority:** P0 (Critical)
**Status:** ✅ Implemented

**Requirements:**
- Display 7 key metrics in card format:
  1. Total Sales (all time)
  2. Amount Collected
  3. Outstanding Balance (color-coded: orange if > ₦50,000)
  4. Total Expenses
  5. Material Cost
  6. Profit (green if positive, red if negative)
  7. Inventory Value

**Data Sources:**
- Sales: `SUM(sales_summary.total_amount)`
- Collected: `SUM(sales_summary.amount_paid)`
- Outstanding: `SUM(sales_summary.balance)`
- Expenses: `SUM(expenses.amount)`
- Material Cost: `SUM(sewing_jobs.material_cost)`
- Profit: `Collected - (Expenses + Material Cost)`
- Inventory: `SUM(inventory.total_cost)`

**Acceptance Criteria:**
- [ ] All metrics update in real-time
- [ ] Currency formatted as ₦#,###
- [ ] Colors match brand palette
- [ ] Metrics calculate correctly

#### 2.2 Recent Activity
**Priority:** P1 (High)
**Status:** ✅ Implemented

**Requirements:**
- Show 5 most recent sewing jobs
- Display: Customer name, item, total charged, status
- Status color-coded:
  - Done: Green
  - Part: Yellow
  - Pending: Gray

#### 2.3 Low Stock Alerts
**Priority:** P1 (High)
**Status:** ✅ Implemented

**Requirements:**
- Show items where `quantity_left < reorder_level`
- Display: Item name, category, quantity left
- Highlight in orange
- Link to inventory page

---

### 3. Inventory Management

#### 3.1 Inventory List View
**Priority:** P0 (Critical)
**Status:** ✅ Implemented

**Requirements:**
- Table showing all inventory items
- Columns: Item Name, Category, Bought, Used, Left, Unit Cost, Total Cost, Location, Actions
- Search by item name
- Filter by category
- Sort by any column
- Show total inventory value
- Highlight low stock items (orange background)
- Low stock icon indicator

**Acceptance Criteria:**
- [ ] All items display correctly
- [ ] Search filters in real-time
- [ ] Category filter works
- [ ] Low stock items highlighted
- [ ] Total value updates dynamically

#### 3.2 Add/Edit Inventory
**Priority:** P0 (Critical)
**Status:** ✅ Implemented

**Requirements:**
- Modal dialog form
- Fields:
  - Date (default: today)
  - Item Name (required)
  - Category (dropdown: Fabric, Thread, Lining, Zipper, Embroidery, Other)
  - Quantity Bought (number, required)
  - Quantity Used (number, required)
  - Unit Cost (₦, required)
  - Reorder Level (optional)
  - Location (optional)
  - Preferred Supplier (optional)
  - Supplier Notes (optional)
- Auto-calculate: Quantity Left, Total Cost
- Validation: All required fields must be filled
- Cancel button discards changes
- Save button adds/updates record

**Acceptance Criteria:**
- [ ] Form validates required fields
- [ ] Calculations are accurate
- [ ] Cancel discards changes
- [ ] Save updates table immediately
- [ ] Success/error feedback shown

#### 3.3 Delete Inventory
**Priority:** P1 (High)
**Status:** ✅ Implemented

**Requirements:**
- Trash icon in Actions column
- Confirmation dialog: "Are you sure you want to delete this item?"
- Permanent deletion (no soft delete)

**Acceptance Criteria:**
- [ ] Confirmation required before delete
- [ ] Item removed from list after deletion
- [ ] No orphaned references

---

### 4. Sewing Jobs Management

#### 4.1 Jobs List View
**Priority:** P0 (Critical)
**Status:** 🔄 Pending Implementation

**Requirements:**
- Table showing all sewing jobs
- Columns: Date, Customer, Item, Total Charged, Amount Paid, Balance, Profit, Status, Actions
- Search by customer name or item
- Filter by status (All, Pending, Part, Done)
- Filter by fabric source (All, Yours, Customer's)
- Sort by date, amount, profit
- Color-coded status badges
- Show overdue jobs (delivery_date_expected < today and status != Done)

**Acceptance Criteria:**
- [ ] All jobs display correctly
- [ ] Search works across customer and item
- [ ] Filters work independently and together
- [ ] Overdue jobs highlighted in red
- [ ] Status badges color-coded

#### 4.2 Add/Edit Sewing Job
**Priority:** P0 (Critical)
**Status:** 🔄 Pending Implementation

**Requirements:**
- Modal dialog form
- Fields:
  - Date (default: today)
  - Customer (autocomplete from customers table, or add new)
  - Phone (auto-fill if existing customer)
  - Fabric Source (dropdown: Yours, Customer's)
  - Item Sewn (text, e.g., "A-line gown")
  - Material Cost (₦, required)
  - Labour Charge (₦, required)
  - Amount Paid (₦, default: 0)
  - Status (dropdown: Pending, Part, Done)
  - Delivery Date Expected (date picker)
  - Fitting Date (optional)
  - Notes (optional)
- Auto-calculate: Total Charged, Balance, Profit
- Auto-update: Customer's last_order_date

**Acceptance Criteria:**
- [ ] Customer autocomplete works
- [ ] Calculations update in real-time
- [ ] Status changes update dashboard
- [ ] Customer record updated

#### 4.3 Job Status Workflow
**Priority:** P1 (High)
**Status:** 🔄 Pending Implementation

**Requirements:**
- Status progression: Pending → Part → Done
- When status changes to "Done":
  - Prompt to set delivery_date_actual
  - Create sale record in sales_summary
- When amount_paid increases:
  - If amount_paid == total_charged: Auto-change status to "Done"
  - If 0 < amount_paid < total_charged: Auto-change to "Part"

**Acceptance Criteria:**
- [ ] Status workflow enforced
- [ ] Sales record auto-created
- [ ] Status auto-updates based on payment

---

### 5. Expenses Tracking

#### 5.1 Expenses List View
**Priority:** P0 (Critical)
**Status:** 🔄 Pending Implementation

**Requirements:**
- Table showing all expenses
- Columns: Date, Type, Description, Amount, Vendor, Payment Method, Actions
- Search by description or vendor
- Filter by expense type
- Filter by date range
- Show total expenses
- Mark fixed expenses with icon

**Acceptance Criteria:**
- [ ] All expenses display correctly
- [ ] Filters work
- [ ] Total calculates accurately
- [ ] Fixed expenses identifiable

#### 5.2 Add/Edit Expense
**Priority:** P0 (Critical)
**Status:** 🔄 Pending Implementation

**Requirements:**
- Modal dialog form
- Fields:
  - Date (default: today)
  - Expense Type (dropdown: Embroidery, Transport, Repair, Supplies, Other)
  - Description (required)
  - Amount (₦, required)
  - Vendor/Payee (optional)
  - Payment Method (dropdown: Transfer, Cash, POS, Other)
  - Is Fixed Expense (checkbox)
  - Job Link (autocomplete, optional)
  - Notes (optional)

**Acceptance Criteria:**
- [ ] Form validates required fields
- [ ] Job linking works
- [ ] Total expenses update on dashboard

---

### 6. Sales Summary

#### 6.1 Sales List View
**Priority:** P0 (Critical)
**Status:** 🔄 Pending Implementation

**Requirements:**
- Table showing all sales
- Columns: Date, Sale Type, Customer, Total Amount, Amount Paid, Balance, Actions
- Search by customer
- Filter by sale type
- Filter by date range
- Show total sales and outstanding

**Acceptance Criteria:**
- [ ] All sales display correctly
- [ ] Filters work
- [ ] Totals calculate accurately

#### 6.2 Add/Edit Sale
**Priority:** P0 (Critical)
**Status:** 🔄 Pending Implementation

**Requirements:**
- Modal dialog form
- Fields:
  - Date (default: today)
  - Sale Type (dropdown: Sewing, Fabric, Other)
  - Customer (autocomplete)
  - Total Amount (₦, required)
  - Amount Paid (₦, default: 0)
  - Notes (optional)
- Auto-calculate: Balance
- Auto-link to sewing_job if sale_type = "Sewing"

**Acceptance Criteria:**
- [ ] Form validates correctly
- [ ] Auto-linking works
- [ ] Balance calculates

---

### 7. Customers Database

#### 7.1 Customers List View
**Priority:** P1 (High)
**Status:** 🔄 Pending Implementation

**Requirements:**
- Table showing all customers
- Columns: Name, Phone, Last Order Date, Total Orders, Lifetime Value, Actions
- Search by name or phone
- Sort by lifetime value, last order date
- Show inactive customers (no order in 60+ days) with warning icon

**Calculations:**
- Total Orders: `COUNT(sewing_jobs WHERE customer_id)`
- Lifetime Value: `SUM(sales_summary.amount_paid WHERE customer_id)`

**Acceptance Criteria:**
- [ ] All customers display
- [ ] Calculations accurate
- [ ] Inactive customers highlighted

#### 7.2 Customer Detail View
**Priority:** P1 (High)
**Status:** 🔄 Pending Implementation

**Requirements:**
- Show customer information
- Show order history
- Show total outstanding balance
- Show measurements
- Show preferences

**Acceptance Criteria:**
- [ ] All data displays correctly
- [ ] Order history chronological

#### 7.3 Add/Edit Customer
**Priority:** P1 (High)
**Status:** 🔄 Pending Implementation

**Requirements:**
- Modal dialog form
- Fields:
  - Name (required)
  - Phone (required)
  - Address (optional)
  - Preferred Contact (dropdown: WhatsApp, Call, SMS)
  - Fabric Preferences (text area)
  - Size/Fit Notes (text area)
  - Measurements Notes (text area)

**Acceptance Criteria:**
- [ ] Form validates
- [ ] Measurements stored

---

### 8. Receivables

#### 8.1 Receivables Dashboard
**Priority:** P0 (Critical)
**Status:** 🔄 Pending Implementation

**Requirements:**
- Auto-generated list of customers with outstanding balances
- Columns: Customer, Phone, Total Outstanding, Last Sale Date, Days Overdue, Actions
- Highlight overdue (>30 days) in red
- Show grand total outstanding
- Sort by amount or days overdue

**Data Source:**
```sql
SELECT
  customer_id,
  customer_name,
  phone,
  SUM(balance) as total_outstanding,
  MAX(date) as last_sale_date,
  DATEDIFF(CURRENT_DATE, MAX(date)) as days_since_sale
FROM sales_summary
WHERE balance > 0
GROUP BY customer_id
```

**Acceptance Criteria:**
- [ ] Auto-updates when payments logged
- [ ] Overdue highlighting works
- [ ] Grand total accurate
- [ ] Links to customer detail

#### 8.2 Quick Collection Action
**Priority:** P1 (High)
**Status:** 🔄 Pending Implementation

**Requirements:**
- "Collect Payment" button on each row
- Opens pre-filled collection form
- Records payment in collections_log
- Reduces balance in sales_summary

---

### 9. Collections Log

#### 9.1 Collections List View
**Priority:** P1 (High)
**Status:** 🔄 Pending Implementation

**Requirements:**
- Table showing all payment collections
- Columns: Date, Customer, Amount, Payment Method, Notes, Actions
- Filter by date range
- Filter by payment method
- Show total collected

**Acceptance Criteria:**
- [ ] All collections display
- [ ] Filters work
- [ ] Total accurate

#### 9.2 Log Collection
**Priority:** P1 (High)
**Status:** 🔄 Pending Implementation

**Requirements:**
- Modal dialog form
- Fields:
  - Date (default: today)
  - Customer (autocomplete from receivables)
  - Amount (₦, required, max = outstanding balance)
  - Payment Method (dropdown: Transfer, Cash, POS, Other)
  - Notes (optional)
- Auto-update: sales_summary.amount_paid
- Auto-update: customer.last_payment_date (future enhancement)

**Acceptance Criteria:**
- [ ] Cannot exceed outstanding balance
- [ ] Updates receivables immediately
- [ ] Payment method tracked

---

### 10. Monthly Summary & Reports

#### 10.1 Monthly Summary View
**Priority:** P1 (High)
**Status:** 🔄 Pending Implementation

**Requirements:**
- Table showing data for 12 months
- Columns: Month, Total Sales, Amount Collected, Outstanding, Material Cost, Expenses, Profit
- Auto-calculate all values
- Filter by year (dropdown: 2024, 2025, 2026...)
- Export to PDF/Excel (future enhancement)

**Calculations:**
- Total Sales: `SUM(sales_summary.total_amount) WHERE month`
- Amount Collected: `SUM(sales_summary.amount_paid) WHERE month`
- Outstanding: `SUM(sales_summary.balance) WHERE month`
- Material Cost: `SUM(sewing_jobs.material_cost) WHERE month`
- Expenses: `SUM(expenses.amount) WHERE month`
- Profit: `Collected - (Material Cost + Expenses)`

**Acceptance Criteria:**
- [ ] All months display
- [ ] Calculations accurate
- [ ] Year filter works
- [ ] Profit color-coded

#### 10.2 Charts
**Priority:** P1 (High)
**Status:** 🔄 Pending Implementation

**Requirements:**
- Bar chart: Monthly Total Sales
- Bar chart: Monthly Profit
- Line chart: Sales vs Expenses trend
- Pie chart: Expense breakdown by type

**Acceptance Criteria:**
- [ ] Charts render correctly
- [ ] Data updates in real-time
- [ ] Brand colors used
- [ ] Responsive on mobile

---

### 11. Settings

#### 11.1 General Settings
**Priority:** P2 (Nice to have)
**Status:** 🔄 Pending Implementation

**Requirements:**
- Edit business name and motto
- Edit brand colors
- Edit reporting year
- Save changes button

**Acceptance Criteria:**
- [ ] Changes persist
- [ ] Colors update throughout app
- [ ] Year change updates reports

#### 11.2 User Management (Future)
**Priority:** P3 (Future)

**Requirements:**
- Add/remove users
- Assign roles
- Reset passwords

---

## 📱 Non-Functional Requirements

### Performance
- **Page Load Time:** < 2 seconds on 3G connection
- **Database Queries:** < 500ms response time
- **Real-time Updates:** < 1 second delay
- **Image Optimization:** Next.js Image component

### Security
- **Authentication:** Required for all routes except /login
- **Authorization:** Role-based access control (future)
- **Data Validation:** Server-side validation on all inputs
- **SQL Injection:** Protected via Supabase parameterized queries
- **XSS Protection:** React automatic escaping
- **HTTPS:** Required in production

### Scalability
- **Database:** PostgreSQL can handle 10,000+ records
- **Concurrent Users:** Support 5-10 simultaneous users
- **File Storage:** Supabase storage for future image uploads
- **API Rate Limits:** Respect Supabase free tier limits

### Reliability
- **Uptime:** 99.5% (dependent on Supabase SLA)
- **Backup:** Automatic daily backups via Supabase
- **Error Handling:** Graceful error messages, no crashes
- **Data Integrity:** Foreign key constraints enforce referential integrity

### Usability
- **Mobile Responsive:** Works on phones (375px+), tablets, desktop
- **Accessibility:** WCAG 2.1 AA compliance
- **Browser Support:** Chrome, Firefox, Safari (last 2 versions)
- **Loading States:** Skeleton loaders for all async operations
- **Error Messages:** Clear, actionable, user-friendly

### Maintainability
- **Code Quality:** TypeScript strict mode, ESLint rules
- **Documentation:** Inline comments, README, this PRD
- **Testing:** Manual testing checklist (automated tests future)
- **Version Control:** Git with clear commit messages

---

## 🎨 Design System

### Typography
- **Headings:** Inter font family
- **Body:** Inter font family
- **Sizes:**
  - H1: 2rem (32px)
  - H2: 1.5rem (24px)
  - H3: 1.25rem (20px)
  - Body: 0.875rem (14px)
  - Small: 0.75rem (12px)

### Colors
- **Brand Primary:** #72D0CF (Teal)
- **Brand Accent:** #EC88C7 (Pink)
- **Success:** #10B981 (Green)
- **Warning:** #F59E0B (Orange)
- **Danger:** #EF4444 (Red)
- **Gray Scale:** Tailwind default grays
- **Background:** #F9FAFB
- **Text Primary:** #111827
- **Text Secondary:** #6B7280

### Spacing
- Base unit: 4px
- Standard: 1rem (16px)
- Large: 1.5rem (24px)
- XL: 2rem (32px)

### Components
- **Buttons:** Rounded corners (0.5rem), padding (0.5rem 1rem)
- **Cards:** White background, subtle shadow, 1rem padding
- **Tables:** Striped rows, hover effect, responsive scroll
- **Modals:** Centered, max-width 600px, backdrop overlay
- **Forms:** Inline labels, validation feedback

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Completed)
**Timeline:** Week 1
**Status:** ✅ Complete

- [x] Project setup (Next.js, TypeScript, Tailwind)
- [x] Database schema design
- [x] Authentication system
- [x] Navigation and layout
- [x] Dashboard with KPIs
- [x] Inventory CRUD operations

### Phase 2: Core Features (Current)
**Timeline:** Week 2-3
**Status:** 🔄 In Progress

- [ ] Sewing Jobs module
- [ ] Customers module
- [ ] Expenses module
- [ ] Sales Summary module
- [ ] Collections Log
- [ ] Receivables view

### Phase 3: Reporting & Polish
**Timeline:** Week 4
**Status:** 📋 Planned

- [ ] Monthly Summary with charts
- [ ] Settings page
- [ ] Mobile responsive optimization
- [ ] Form validation (Zod)
- [ ] Error handling
- [ ] Loading states

### Phase 4: Enhancements (Future)
**Timeline:** Month 2+
**Status:** 💡 Future

- [ ] Email/SMS reminders for overdue payments
- [ ] WhatsApp integration
- [ ] PDF invoice generation
- [ ] Barcode/QR code scanning for inventory
- [ ] Photo uploads (garment photos)
- [ ] Multi-currency support
- [ ] Advanced analytics
- [ ] Mobile app (React Native)
- [ ] Offline mode (PWA)

---

## 📏 Success Criteria

### MVP Launch Criteria
**Before going live, the app must:**
- ✅ Build without errors
- ✅ Authentication works
- ✅ Dashboard displays correct metrics
- ✅ All CRUD operations work (Inventory, Jobs, Expenses, Sales, Customers)
- ✅ Receivables auto-calculate
- ✅ Mobile responsive
- ✅ Deployed to production URL
- ✅ Supabase configured with production data
- ✅ At least 2 users created and tested

### 30-Day Success Metrics
**After 1 month of use:**
- 100% of orders tracked in system (vs Excel)
- Zero data entry errors
- <5 minutes to record new order
- Daily dashboard check by owner
- All outstanding balances tracked
- At least 1 low-stock alert acted upon

### 90-Day Success Metrics
**After 3 months:**
- 30% reduction in outstanding receivables
- Monthly reports generated in <1 minute
- 3+ active users
- Zero critical bugs
- Owner reports 60%+ time savings

---

## 🔒 Data Privacy & Compliance

### Data Ownership
- All data belongs to A'ish Raiments
- Can export all data at any time
- Can delete account and all data

### Data Storage
- Hosted on Supabase (AWS infrastructure)
- Database located in closest region to Nigeria
- Backups retained for 7 days

### Personal Data
- Customer phone numbers and addresses collected
- Used only for business purposes
- Not shared with third parties
- Customers can request data deletion

### Security Measures
- Passwords hashed with bcrypt
- HTTPS encryption in transit
- Row-level security in database
- Regular security updates

---

## 📖 User Documentation

### Quick Start Guide
1. **Login:** Use your email and password provided by admin
2. **Dashboard:** See business overview at a glance
3. **Add Inventory:** Click "Add Item" button, fill form, save
4. **Record Order:** Go to "Sewing Jobs", click "Add Job"
5. **Log Payment:** Go to "Receivables", click "Collect Payment"
6. **Check Reports:** Go to "Reports" for monthly summary

### Common Tasks
- **How to check who owes money:** Go to Receivables page
- **How to see profit this month:** Dashboard → Profit card
- **How to reorder materials:** Inventory → Look for orange highlighted items
- **How to update job status:** Jobs → Click edit icon → Change status
- **How to add new customer:** Customers → Click "Add Customer"

### Troubleshooting
- **Can't login:** Check email/password, contact admin to reset
- **Data not showing:** Refresh page, check internet connection
- **Changes not saving:** Check for error messages, ensure required fields filled
- **Calculations wrong:** Contact support with screenshot

---

## 🛠️ Development Guidelines

### Code Standards
- Use TypeScript for all files
- Follow ESLint rules
- Use functional components (React hooks)
- Use async/await (no callbacks)
- Keep components < 300 lines
- Extract reusable logic to custom hooks

### Naming Conventions
- **Files:** kebab-case (inventory-page.tsx)
- **Components:** PascalCase (InventoryTable)
- **Functions:** camelCase (fetchItems)
- **Constants:** UPPER_SNAKE_CASE (MAX_ITEMS)
- **Database:** snake_case (sewing_jobs)

### Git Workflow
- **Branches:** feature/name, bugfix/name
- **Commits:** Present tense ("Add inventory module")
- **Pull Requests:** Required for all changes
- **Reviews:** At least 1 approval

### Testing Checklist
- [ ] Form validation works
- [ ] Required fields enforced
- [ ] Calculations accurate
- [ ] Delete confirmation shown
- [ ] Search filters work
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Data persists after refresh

---

## 📞 Support & Maintenance

### Support Channels
- **Technical Issues:** GitHub Issues
- **Feature Requests:** Product roadmap board
- **Bug Reports:** Email with screenshots
- **Training:** Video tutorials (future)

### Maintenance Schedule
- **Updates:** Monthly feature releases
- **Security Patches:** As needed (within 48 hours)
- **Database Backups:** Daily automatic
- **Performance Monitoring:** Weekly review

### SLA (Service Level Agreement)
- **Critical Bugs:** Fix within 24 hours
- **High Priority:** Fix within 72 hours
- **Medium Priority:** Fix within 1 week
- **Low Priority/Enhancements:** Backlog

---

## 📊 Appendix

### A. Glossary
- **Balance:** Outstanding amount owed by customer
- **Collections:** Payments received after initial sale
- **Fixed Expense:** Recurring monthly cost
- **Inventory Value:** Total cost of materials on hand
- **Job:** A customer order for sewing
- **Material Cost:** Cost of fabrics/materials used in job
- **Profit:** Revenue minus costs
- **Receivables:** Money owed by customers
- **Reorder Level:** Minimum stock before alert
- **Status:** Current state of job (Pending/Part/Done)

### B. Acronyms
- **CRUD:** Create, Read, Update, Delete
- **KPI:** Key Performance Indicator
- **MVP:** Minimum Viable Product
- **PRD:** Product Requirements Document
- **PWA:** Progressive Web App
- **SLA:** Service Level Agreement
- **UI:** User Interface
- **UX:** User Experience

### C. References
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

### D. Changelog
- **2025-11-11:** Initial PRD created
- **2025-11-11:** Foundation phase completed

---

## ✅ Document Approval

**Prepared By:** Development Team
**Reviewed By:** A'ish Raiments (Business Owner)
**Approved By:** [Pending]
**Approval Date:** [Pending]

---

**End of Product Requirements Document**
