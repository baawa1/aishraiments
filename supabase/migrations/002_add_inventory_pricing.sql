-- Migration: Add cost_price and selling_price for inventory profit tracking
-- Date: 2025-11-12
-- Description:
--   1. Rename unit_cost to cost_price for clarity
--   2. Add selling_price field (optional) to inventory
--   3. Update computed columns to reference cost_price
--   4. Add profit tracking fields to sales_summary table

-- ============================================================
-- INVENTORY TABLE UPDATES
-- ============================================================

-- Step 1: Drop computed columns that depend on unit_cost
ALTER TABLE inventory DROP COLUMN IF EXISTS total_cost;

-- Step 2: Rename unit_cost to cost_price
ALTER TABLE inventory RENAME COLUMN unit_cost TO cost_price;

-- Step 3: Add selling_price column (optional/nullable)
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10, 2) NULL;

-- Step 4: Recreate total_cost computed column with new column name
-- Note: Cannot reference quantity_left (another generated column), so calculate directly
ALTER TABLE inventory ADD COLUMN total_cost DECIMAL(10, 2)
    GENERATED ALWAYS AS ((quantity_bought - quantity_used) * cost_price) STORED;

-- Step 5: Add profit_margin computed column (only when selling_price is set)
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(10, 2)
    GENERATED ALWAYS AS (
        CASE
            WHEN selling_price IS NOT NULL THEN (selling_price - cost_price)
            ELSE NULL
        END
    ) STORED;

-- ============================================================
-- SALES_SUMMARY TABLE UPDATES
-- ============================================================

-- Add inventory item reference and profit tracking fields
ALTER TABLE sales_summary ADD COLUMN IF NOT EXISTS inventory_item_id UUID
    REFERENCES inventory(id) ON DELETE SET NULL;

ALTER TABLE sales_summary ADD COLUMN IF NOT EXISTS quantity_sold DECIMAL(10, 2) NULL;

ALTER TABLE sales_summary ADD COLUMN IF NOT EXISTS unit_cost_price DECIMAL(10, 2) NULL;

ALTER TABLE sales_summary ADD COLUMN IF NOT EXISTS unit_selling_price DECIMAL(10, 2) NULL;

-- Add computed profit column for inventory sales
-- (total_amount - (unit_cost_price * quantity_sold))
-- But we'll use a simpler approach: store the profit directly since total_amount might include other items
ALTER TABLE sales_summary ADD COLUMN IF NOT EXISTS inventory_profit DECIMAL(10, 2)
    GENERATED ALWAYS AS (
        CASE
            WHEN unit_selling_price IS NOT NULL AND unit_cost_price IS NOT NULL AND quantity_sold IS NOT NULL
            THEN (unit_selling_price - unit_cost_price) * quantity_sold
            ELSE NULL
        END
    ) STORED;

-- ============================================================
-- CREATE INDEX FOR PERFORMANCE
-- ============================================================

-- Index for inventory item lookups in sales
CREATE INDEX IF NOT EXISTS idx_sales_summary_inventory_item
    ON sales_summary(inventory_item_id)
    WHERE inventory_item_id IS NOT NULL;

-- Index for profit reporting queries
CREATE INDEX IF NOT EXISTS idx_sales_summary_profit
    ON sales_summary(date, inventory_item_id)
    WHERE inventory_profit IS NOT NULL;

-- ============================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON COLUMN inventory.cost_price IS 'Purchase/acquisition cost per unit (previously unit_cost)';
COMMENT ON COLUMN inventory.selling_price IS 'Retail/selling price per unit (optional - for items sold to customers)';
COMMENT ON COLUMN inventory.profit_margin IS 'Profit per unit (selling_price - cost_price), NULL if selling_price not set';

COMMENT ON COLUMN sales_summary.inventory_item_id IS 'Reference to inventory item sold (for inventory sales)';
COMMENT ON COLUMN sales_summary.quantity_sold IS 'Quantity of inventory item sold';
COMMENT ON COLUMN sales_summary.unit_cost_price IS 'Cost price at time of sale (snapshot for historical accuracy)';
COMMENT ON COLUMN sales_summary.unit_selling_price IS 'Selling price at time of sale';
COMMENT ON COLUMN sales_summary.inventory_profit IS 'Profit from inventory sale: (unit_selling_price - unit_cost_price) * quantity_sold';
