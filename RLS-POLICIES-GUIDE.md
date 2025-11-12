# Row-Level Security (RLS) Implementation Guide
## A'ish Raiments Management System

**Date:** 2025-11-12
**Status:** Documentation for future multi-tenant implementation
**Priority:** Medium (not required for single-user deployment)

---

## Overview

Row-Level Security (RLS) is a PostgreSQL feature that allows you to restrict which rows users can access in database tables. This is essential for multi-tenant applications where multiple businesses will use the same database.

### Current State
- **Single User:** Application currently designed for one business
- **No RLS:** All data accessible to authenticated users
- **Middleware Protection:** Routes protected by authentication middleware

### When to Implement RLS
- Before adding multiple user accounts
- Before offering SaaS/multi-tenant features
- When data isolation becomes a security requirement

---

## Implementation Steps

### Step 1: Add user_id Column to All Tables

```sql
-- Add user_id column to track data ownership
ALTER TABLE customers ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE inventory_items ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE sewing_jobs ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE expenses ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE sales_summary ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE collections_log ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE settings ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Backfill existing data with current user's ID
-- Replace 'YOUR_USER_ID' with actual user ID from auth.users table
UPDATE customers SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
UPDATE inventory_items SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
UPDATE sewing_jobs SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
UPDATE expenses SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
UPDATE sales_summary SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
UPDATE collections_log SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
UPDATE settings SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;

-- Make user_id NOT NULL after backfill
ALTER TABLE customers ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE inventory_items ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE sewing_jobs ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE expenses ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE sales_summary ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE collections_log ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE settings ALTER COLUMN user_id SET NOT NULL;
```

### Step 2: Enable RLS on All Tables

```sql
-- Enable Row-Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sewing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
```

### Step 3: Create RLS Policies

#### Customers Table
```sql
-- Policy for SELECT (read)
CREATE POLICY "Users can view their own customers"
  ON customers
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for INSERT (create)
CREATE POLICY "Users can create their own customers"
  ON customers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE (edit)
CREATE POLICY "Users can update their own customers"
  ON customers
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE
CREATE POLICY "Users can delete their own customers"
  ON customers
  FOR DELETE
  USING (auth.uid() = user_id);
```

#### Inventory Items Table
```sql
CREATE POLICY "Users can view their own inventory"
  ON inventory_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own inventory items"
  ON inventory_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory"
  ON inventory_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory"
  ON inventory_items FOR DELETE
  USING (auth.uid() = user_id);
```

#### Sewing Jobs Table
```sql
CREATE POLICY "Users can view their own jobs"
  ON sewing_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own jobs"
  ON sewing_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
  ON sewing_jobs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jobs"
  ON sewing_jobs FOR DELETE
  USING (auth.uid() = user_id);
```

#### Expenses Table
```sql
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);
```

#### Sales Summary Table
```sql
CREATE POLICY "Users can view their own sales"
  ON sales_summary FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sales"
  ON sales_summary FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales"
  ON sales_summary FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales"
  ON sales_summary FOR DELETE
  USING (auth.uid() = user_id);
```

#### Collections Log Table
```sql
CREATE POLICY "Users can view their own collections"
  ON collections_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections"
  ON collections_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON collections_log FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON collections_log FOR DELETE
  USING (auth.uid() = user_id);
```

#### Settings Table
```sql
CREATE POLICY "Users can view their own settings"
  ON settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings"
  ON settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Settings: No delete policy (settings should not be deleted)
```

### Step 4: Update Application Code

After implementing RLS, update all insert operations to include `user_id`:

```typescript
// Before (current code)
const { error } = await supabase
  .from("customers")
  .insert([{ name, phone, address }]);

// After (with RLS)
const { data: { user } } = await supabase.auth.getUser();
const { error } = await supabase
  .from("customers")
  .insert([{
    name,
    phone,
    address,
    user_id: user?.id  // Add user_id to all inserts
  }]);
```

**Recommendation:** Create a helper function to automatically add `user_id`:

```typescript
// lib/supabase/helpers.ts
export async function getAuthenticatedUserId(supabase: SupabaseClient) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  return user.id;
}

// Usage in components
const userId = await getAuthenticatedUserId(supabase);
await supabase.from("customers").insert([{
  name,
  phone,
  user_id: userId
}]);
```

---

## Testing RLS Policies

### Test Checklist

1. **Create Test Users**
   ```sql
   -- In Supabase dashboard, create 2 test users
   -- User A: test-a@example.com
   -- User B: test-b@example.com
   ```

2. **Test Data Isolation**
   - Login as User A, create a customer
   - Login as User B, verify User A's customer is not visible
   - Login as User B, create a customer
   - Login as User A, verify User B's customer is not visible

3. **Test CRUD Operations**
   - SELECT: Can only see own data ✓
   - INSERT: Can only create with own user_id ✓
   - UPDATE: Can only update own data ✓
   - DELETE: Can only delete own data ✓

4. **Test Policy Violations**
   - Try to manually query another user's data (should return empty)
   - Try to update another user's record (should fail)
   - Try to insert with different user_id (should fail)

---

## Performance Considerations

### Index user_id for Performance
```sql
-- Add indexes on user_id for all tables
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_inventory_user_id ON inventory_items(user_id);
CREATE INDEX idx_jobs_user_id ON sewing_jobs(user_id);
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_sales_user_id ON sales_summary(user_id);
CREATE INDEX idx_collections_user_id ON collections_log(user_id);
CREATE INDEX idx_settings_user_id ON settings(user_id);
```

### Composite Indexes
For queries that filter by both `user_id` and other fields:

```sql
-- Example: Jobs filtered by user and status
CREATE INDEX idx_jobs_user_status ON sewing_jobs(user_id, status);

-- Example: Sales filtered by user and date
CREATE INDEX idx_sales_user_date ON sales_summary(user_id, date DESC);
```

---

## Security Benefits

### With RLS Enabled
- ✅ **Database-Level Protection:** Even if application code has bugs, data is protected
- ✅ **Multi-Tenant Ready:** Can safely add multiple users/businesses
- ✅ **Audit Trail:** Know exactly who owns what data
- ✅ **Compliance:** Meets data isolation requirements for regulations

### Without RLS (Current State)
- ⚠️ **Application-Level Only:** Security depends on correct middleware implementation
- ⚠️ **Single Tenant:** Cannot safely add multiple users
- ⚠️ **Risk:** A bug in query logic could expose other users' data

---

## Migration Checklist

- [ ] Back up entire database before starting
- [ ] Add `user_id` columns to all tables
- [ ] Backfill existing data with current user ID
- [ ] Set `user_id` to NOT NULL
- [ ] Create indexes on `user_id`
- [ ] Enable RLS on all tables
- [ ] Create policies for SELECT, INSERT, UPDATE, DELETE
- [ ] Update application code to include `user_id` in inserts
- [ ] Test all CRUD operations
- [ ] Verify data isolation between test users
- [ ] Deploy to production with monitoring
- [ ] Run VACUUM ANALYZE to update statistics

---

## Troubleshooting

### "No rows returned" after enabling RLS
**Cause:** User's auth token doesn't match `user_id` in database
**Fix:** Check that `auth.uid()` returns correct user ID

### "Permission denied" on insert
**Cause:** INSERT policy's WITH CHECK condition failing
**Fix:** Verify `user_id` in insert matches `auth.uid()`

### Slow queries after RLS
**Cause:** Missing indexes on `user_id`
**Fix:** Add indexes as shown in Performance Considerations section

### Can't see any data after migration
**Cause:** Existing data not backfilled with `user_id`
**Fix:** Run UPDATE queries to set `user_id` for existing records

---

## Further Reading

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Multi-Tenancy Patterns](https://supabase.com/docs/guides/database/multi-tenancy)

---

**Note:** RLS implementation is not urgently needed for single-user deployment. However, it's a critical security layer if you plan to offer the application to multiple businesses or users.
