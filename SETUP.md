# A'ish Raiments - Setup Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier is fine)

## Step 1: Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the project to finish setting up (takes 1-2 minutes)

## Step 2: Database Setup

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste it into the SQL editor and click **Run**
5. You should see "Success. No rows returned" - this means your database is ready!

## Step 3: Get Your API Keys

1. In Supabase, go to **Settings** (gear icon) → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (the `anon` `public` key)

## Step 4: Configure Your App

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 5: Install Dependencies & Run

```bash
# Install dependencies (if not already done)
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 6: Create Your First User

1. Go to your Supabase project dashboard
2. Click on **Authentication** → **Users**
3. Click **Add User** → **Create new user**
4. Enter:
   - Email: your email
   - Password: create a strong password
   - Auto Confirm User: ✅ **Check this box**
5. Click **Create user**

You can create 2-3 users this way for your team.

## Next Steps

Once everything is set up, you'll be able to:

- Track inventory (fabrics, thread, zippers, etc.)
- Manage customer orders
- Record expenses
- Track sales and payments
- View receivables (who owes you money)
- Generate monthly reports
- See your dashboard with all business metrics

## Need Help?

If you encounter any issues:

1. Make sure your `.env.local` file has the correct Supabase URL and key
2. Check that the database migration ran successfully
3. Verify that you've created at least one user in Supabase
4. Check the browser console for any error messages

## Features Overview

### 📊 Dashboard
- Total sales, collections, outstanding balance
- Expenses, material costs, and profit
- Inventory value
- Monthly charts

### 📦 Inventory Management
- Track all materials (fabrics, thread, zippers, etc.)
- Auto-calculate quantities left and costs
- Low stock alerts
- Supplier tracking

### 👗 Sewing Jobs
- Manage customer orders
- Track material and labour costs
- Record payments and balances
- Job status tracking (Pending/Part/Done)
- Delivery date tracking

### 💸 Expenses
- Record all business expenses
- Categorize expenses
- Link to specific jobs
- Track vendors/payees

### 👥 Customers
- Customer database
- Contact information
- Measurements and preferences
- Order history

### 🧾 Sales & Collections
- Sales summary
- Payment tracking
- Collections log
- Receivables with overdue alerts

### 📅 Monthly Reports
- Month-by-month breakdown
- Sales vs profit charts
- Material costs tracking
- Expense analysis

### ⚙️ Settings
- Brand colors (Teal #72D0CF & Pink #EC88C7)
- Business information
- Reporting year configuration
