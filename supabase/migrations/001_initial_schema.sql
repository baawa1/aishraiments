-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE fabric_category AS ENUM ('Fabric', 'Thread', 'Lining', 'Zipper', 'Embroidery', 'Other');
CREATE TYPE job_status AS ENUM ('Pending', 'Part', 'Done');
CREATE TYPE fabric_source AS ENUM ('Yours', 'Customer''s');
CREATE TYPE expense_type AS ENUM ('Embroidery', 'Transport', 'Repair', 'Supplies', 'Other');
CREATE TYPE sale_type AS ENUM ('Sewing', 'Fabric', 'Other');
CREATE TYPE payment_method AS ENUM ('Transfer', 'Cash', 'POS', 'Other');

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    measurements_notes TEXT,
    first_order_date DATE,
    last_order_date DATE,
    preferred_contact TEXT,
    fabric_preferences TEXT,
    size_fit_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory table
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    item_name TEXT NOT NULL,
    category fabric_category NOT NULL,
    quantity_bought DECIMAL(10, 2) NOT NULL DEFAULT 0,
    quantity_used DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    supplier_notes TEXT,
    reorder_level DECIMAL(10, 2),
    location TEXT,
    last_used_date DATE,
    preferred_supplier TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Computed column for quantity left
    quantity_left DECIMAL(10, 2) GENERATED ALWAYS AS (quantity_bought - quantity_used) STORED,
    -- Computed column for total cost
    total_cost DECIMAL(10, 2) GENERATED ALWAYS AS ((quantity_bought - quantity_used) * unit_cost) STORED
);

-- Sewing Jobs table
CREATE TABLE sewing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    phone TEXT,
    fabric_source fabric_source NOT NULL,
    item_sewn TEXT NOT NULL,
    material_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    labour_charge DECIMAL(10, 2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status job_status NOT NULL DEFAULT 'Pending',
    notes TEXT,
    delivery_date_expected DATE,
    delivery_date_actual DATE,
    fitting_date DATE,
    hours_spent DECIMAL(5, 2),
    measurements_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Computed columns
    total_charged DECIMAL(10, 2) GENERATED ALWAYS AS (material_cost + labour_charge) STORED,
    balance DECIMAL(10, 2) GENERATED ALWAYS AS (material_cost + labour_charge - amount_paid) STORED,
    profit DECIMAL(10, 2) GENERATED ALWAYS AS (amount_paid - material_cost) STORED
);

-- Expenses table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    expense_type expense_type NOT NULL,
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    job_link UUID REFERENCES sewing_jobs(id) ON DELETE SET NULL,
    payment_method payment_method,
    vendor_payee TEXT,
    is_fixed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales Summary table
CREATE TABLE sales_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    sale_type sale_type NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    sewing_job_id UUID REFERENCES sewing_jobs(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Computed column
    balance DECIMAL(10, 2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED
);

-- Collections Log table
CREATE TABLE collections_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method payment_method NOT NULL,
    notes TEXT,
    sale_id UUID REFERENCES sales_summary(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES
    ('reporting_year', '2025'),
    ('brand_primary_color', '#72D0CF'),
    ('brand_accent_color', '#EC88C7'),
    ('business_name', 'A''ish Raiments'),
    ('business_motto', 'Fashion Designer with Panache');

-- Create indexes for better query performance
CREATE INDEX idx_inventory_category ON inventory(category);
CREATE INDEX idx_inventory_date ON inventory(date);
CREATE INDEX idx_sewing_jobs_customer ON sewing_jobs(customer_id);
CREATE INDEX idx_sewing_jobs_status ON sewing_jobs(status);
CREATE INDEX idx_sewing_jobs_date ON sewing_jobs(date);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_type ON expenses(expense_type);
CREATE INDEX idx_sales_date ON sales_summary(date);
CREATE INDEX idx_sales_customer ON sales_summary(customer_id);
CREATE INDEX idx_collections_date ON collections_log(date);
CREATE INDEX idx_collections_customer ON collections_log(customer_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sewing_jobs_updated_at BEFORE UPDATE ON sewing_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_summary_updated_at BEFORE UPDATE ON sales_summary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_log_updated_at BEFORE UPDATE ON collections_log
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE sewing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies (allow authenticated users to access all data for now)
-- You can make these more restrictive based on user roles later

CREATE POLICY "Enable all operations for authenticated users" ON customers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON inventory
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON sewing_jobs
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON expenses
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON sales_summary
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON collections_log
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON settings
    FOR ALL USING (auth.role() = 'authenticated');
