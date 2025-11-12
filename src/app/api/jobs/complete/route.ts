import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface CompleteJobRequest {
  jobId: string;
  date: string;
  customerName: string;
  customerId: string | null;
  itemSewn: string;
  totalCharged: number;
  amountPaid: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CompleteJobRequest = await request.json();
    const { jobId, date, customerName, customerId, itemSewn, totalCharged, amountPaid } = body;

    // Validate input
    if (!jobId || !date || !customerName || totalCharged === undefined || amountPaid === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if job exists and is not already done
    const { data: existingJob, error: jobError } = await supabase
      .from('sewing_jobs')
      .select('status')
      .eq('id', jobId)
      .single();

    if (jobError || !existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Update job status to Done
    const { error: updateError } = await supabase
      .from('sewing_jobs')
      .update({ status: 'Done', delivery_date_actual: date })
      .eq('id', jobId);

    if (updateError) {
      console.error('Error updating job:', updateError);
      return NextResponse.json({ error: 'Failed to update job status' }, { status: 500 });
    }

    // Check if sale already exists for this job
    const { data: existingSale } = await supabase
      .from('sales_summary')
      .select('id')
      .eq('sewing_job_id', jobId)
      .maybeSingle();

    if (!existingSale) {
      // Create new sale record
      const { error: saleError } = await supabase.from('sales_summary').insert([{
        date,
        sale_type: 'Sewing' as const,
        customer_id: customerId,
        customer_name: customerName,
        total_amount: totalCharged,
        amount_paid: amountPaid,
        sewing_job_id: jobId,
        notes: `Auto-created from job: ${itemSewn}`,
      }]);

      if (saleError) {
        console.error('Error creating sale:', saleError);
        // Rollback: revert job status if sale creation fails
        await supabase
          .from('sewing_jobs')
          .update({ status: existingJob.status })
          .eq('id', jobId);

        return NextResponse.json(
          { error: 'Failed to create sale record. Job status reverted.' },
          { status: 500 }
        );
      }
    } else {
      // Update existing sale
      const { error: updateSaleError } = await supabase
        .from('sales_summary')
        .update({
          total_amount: totalCharged,
          amount_paid: amountPaid,
          date,
        })
        .eq('id', existingSale.id);

      if (updateSaleError) {
        console.error('Error updating sale:', updateSaleError);
        return NextResponse.json({ error: 'Failed to update sale record' }, { status: 500 });
      }
    }

    // Update customer's last_order_date
    if (customerId) {
      await supabase
        .from('customers')
        .update({ last_order_date: date })
        .eq('id', customerId);
    }

    return NextResponse.json({
      success: true,
      message: 'Job completed successfully',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
