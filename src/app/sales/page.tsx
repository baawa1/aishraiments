"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { SalesSummary, SaleType } from "@/types/database";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Receipt, TrendingUp } from "lucide-react";

export default function SalesPage() {
  const [sales, setSales] = useState<SalesSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchSales = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sales_summary")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching sales:", error);
    } else {
      setSales(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
  const totalCollected = sales.reduce((sum, sale) => sum + Number(sale.amount_paid), 0);
  const totalOutstanding = sales.reduce((sum, sale) => sum + Number(sale.balance), 0);

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sales Summary</h2>
          <p className="text-muted-foreground">
            View all sales transactions
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total Sales
            </h3>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold" style={{ color: "#72D0CF" }}>
            {formatCurrency(totalSales)}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Amount Collected
            </h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold" style={{ color: "#EC88C7" }}>
            {formatCurrency(totalCollected)}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Outstanding Balance
            </h3>
            <Receipt className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-orange-600">
            {formatCurrency(totalOutstanding)}
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-right">Amount Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No sales recorded. Sales are automatically created when jobs are marked as complete.
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{formatDate(sale.date)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700">
                      {sale.sale_type}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{sale.customer_name}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(Number(sale.total_amount))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(sale.amount_paid))}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={Number(sale.balance) > 0 ? "text-orange-600 font-medium" : "text-green-600"}>
                      {formatCurrency(Number(sale.balance))}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {sale.notes || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
