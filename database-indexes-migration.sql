-- Database Performance Optimization: Indexes Migration
-- A'ish Raiments Management System
-- Date: 2025-11-12
-- Purpose: Add indexes for frequently queried fields to improve performance

-- =====================================================
-- TABLE: sales_summary
-- =====================================================
-- Index on customer_name for receivables and search queries
CREATE INDEX IF NOT EXISTS idx_sales_customer_name
ON sales_summary(customer_name);

-- Index on date for date range queries and sorting
CREATE INDEX IF NOT EXISTS idx_sales_date
ON sales_summary(date DESC);

-- Index on balance for receivables queries (WHERE balance > 0)
CREATE INDEX IF NOT EXISTS idx_sales_balance
ON sales_summary(balance) WHERE balance > 0;

-- Composite index for sewing job lookups
CREATE INDEX IF NOT EXISTS idx_sales_job_id
ON sales_summary(sewing_job_id) WHERE sewing_job_id IS NOT NULL;

-- Index on customer_id for faster joins
CREATE INDEX IF NOT EXISTS idx_sales_customer_id
ON sales_summary(customer_id) WHERE customer_id IS NOT NULL;

-- =====================================================
-- TABLE: sewing_jobs
-- =====================================================
-- Index on customer_id for customer order history
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id
ON sewing_jobs(customer_id) WHERE customer_id IS NOT NULL;

-- Index on status for filtering by job status
CREATE INDEX IF NOT EXISTS idx_jobs_status
ON sewing_jobs(status);

-- Index on date for sorting and date range queries
CREATE INDEX IF NOT EXISTS idx_jobs_date
ON sewing_jobs(date DESC);

-- Composite index for pending/part jobs (dashboard queries)
CREATE INDEX IF NOT EXISTS idx_jobs_status_date
ON sewing_jobs(status, date DESC) WHERE status IN ('Pending', 'Part');

-- Index on delivery_date_expected for upcoming deliveries
CREATE INDEX IF NOT EXISTS idx_jobs_delivery_expected
ON sewing_jobs(delivery_date_expected) WHERE delivery_date_expected IS NOT NULL;

-- =====================================================
-- TABLE: collections_log
-- =====================================================
-- Index on customer_name for filtering and search
CREATE INDEX IF NOT EXISTS idx_collections_customer_name
ON collections_log(customer_name);

-- Index on date for date range queries and sorting
CREATE INDEX IF NOT EXISTS idx_collections_date
ON collections_log(date DESC);

-- Index on payment_method for filtering
CREATE INDEX IF NOT EXISTS idx_collections_payment_method
ON collections_log(payment_method);

-- Index on customer_id for faster joins
CREATE INDEX IF NOT EXISTS idx_collections_customer_id
ON collections_log(customer_id) WHERE customer_id IS NOT NULL;

-- =====================================================
-- TABLE: expenses
-- =====================================================
-- Index on date for date range queries and monthly reports
CREATE INDEX IF NOT EXISTS idx_expenses_date
ON expenses(date DESC);

-- Index on expense_type for filtering and reports
CREATE INDEX IF NOT EXISTS idx_expenses_type
ON expenses(expense_type);

-- Composite index for fixed vs variable expense queries
CREATE INDEX IF NOT EXISTS idx_expenses_is_fixed_date
ON expenses(is_fixed, date DESC);

-- Index on job_link for job-related expense lookups
CREATE INDEX IF NOT EXISTS idx_expenses_job_link
ON expenses(job_link) WHERE job_link IS NOT NULL;

-- =====================================================
-- TABLE: inventory_items
-- =====================================================
-- Index on category for filtering by material type
CREATE INDEX IF NOT EXISTS idx_inventory_category
ON inventory_items(category);

-- Partial index for low stock alerts (quantity_left <= reorder_level)
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock
ON inventory_items(quantity_left, reorder_level)
WHERE quantity_left <= reorder_level;

-- Index on date for chronological sorting
CREATE INDEX IF NOT EXISTS idx_inventory_date
ON inventory_items(date DESC);

-- =====================================================
-- TABLE: customers
-- =====================================================
-- Index on name for search queries
CREATE INDEX IF NOT EXISTS idx_customers_name
ON customers(name);

-- Index on phone for search queries
CREATE INDEX IF NOT EXISTS idx_customers_phone
ON customers(phone) WHERE phone IS NOT NULL;

-- Index on last_order_date for customer activity queries
CREATE INDEX IF NOT EXISTS idx_customers_last_order
ON customers(last_order_date DESC) WHERE last_order_date IS NOT NULL;

-- =====================================================
-- TABLE: settings
-- =====================================================
-- No indexes needed - single row table with minimal queries

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify indexes were created successfully

-- List all indexes in the database
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;

-- Check index usage statistics (run after some time in production)
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as index_scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. All indexes use "IF NOT EXISTS" to prevent errors on re-runs
-- 2. Descending indexes (DESC) are used for date fields since most queries sort by newest first
-- 3. Partial indexes (WHERE clauses) are used to reduce index size and improve efficiency
-- 4. Composite indexes are created for common multi-column queries
-- 5. These indexes will automatically be used by PostgreSQL query optimizer
-- 6. Monitor index usage in production using pg_stat_user_indexes
-- 7. Consider VACUUM ANALYZE after creating indexes to update statistics

-- =====================================================
-- EXPECTED PERFORMANCE IMPROVEMENTS
-- =====================================================
-- - Receivables page: 50-80% faster (batch query + indexes)
-- - Dashboard low stock alerts: 60-90% faster (partial index)
-- - Collections filtering: 40-70% faster (date + customer_name indexes)
-- - Customer search: 50-80% faster (name + phone indexes)
-- - Monthly reports: 30-60% faster (date indexes with DESC)
-- - Job status filtering: 40-70% faster (status + composite indexes)

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
-- Uncomment and run these commands to remove all indexes

-- DROP INDEX IF EXISTS idx_sales_customer_name;
-- DROP INDEX IF EXISTS idx_sales_date;
-- DROP INDEX IF EXISTS idx_sales_balance;
-- DROP INDEX IF EXISTS idx_sales_job_id;
-- DROP INDEX IF EXISTS idx_sales_customer_id;
-- DROP INDEX IF EXISTS idx_jobs_customer_id;
-- DROP INDEX IF EXISTS idx_jobs_status;
-- DROP INDEX IF EXISTS idx_jobs_date;
-- DROP INDEX IF EXISTS idx_jobs_status_date;
-- DROP INDEX IF EXISTS idx_jobs_delivery_expected;
-- DROP INDEX IF EXISTS idx_collections_customer_name;
-- DROP INDEX IF EXISTS idx_collections_date;
-- DROP INDEX IF EXISTS idx_collections_payment_method;
-- DROP INDEX IF EXISTS idx_collections_customer_id;
-- DROP INDEX IF EXISTS idx_expenses_date;
-- DROP INDEX IF EXISTS idx_expenses_type;
-- DROP INDEX IF EXISTS idx_expenses_is_fixed_date;
-- DROP INDEX IF EXISTS idx_expenses_job_link;
-- DROP INDEX IF EXISTS idx_inventory_category;
-- DROP INDEX IF EXISTS idx_inventory_low_stock;
-- DROP INDEX IF EXISTS idx_inventory_date;
-- DROP INDEX IF EXISTS idx_customers_name;
-- DROP INDEX IF EXISTS idx_customers_phone;
-- DROP INDEX IF EXISTS idx_customers_last_order;
