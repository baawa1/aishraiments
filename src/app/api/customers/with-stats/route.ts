import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = createServerClient();

    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch customers with aggregated stats using a single optimized query
    // This uses PostgreSQL's ability to do aggregations in subqueries
    const { data: customers, error } = await supabase
      .from('customers')
      .select(`
        *,
        sewing_jobs(count),
        sales_summary(amount_paid, balance)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Process the aggregations on the server side
    const customersWithStats = (customers || []).map((customer: any) => {
      const jobs = customer.sewing_jobs || [];
      const sales = customer.sales_summary || [];

      return {
        ...customer,
        total_orders: jobs.length,
        lifetime_value: sales.reduce((sum: number, sale: any) => sum + Number(sale.amount_paid || 0), 0),
        outstanding_balance: sales.reduce((sum: number, sale: any) => sum + Number(sale.balance || 0), 0),
        // Remove the nested data to keep response clean
        sewing_jobs: undefined,
        sales_summary: undefined,
      };
    });

    return NextResponse.json({ data: customersWithStats, error: null });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
