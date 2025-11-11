"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, DollarSign, Package } from "lucide-react";

interface MonthlyData {
  month: string;
  totalSales: number;
  amountCollected: number;
  outstanding: number;
  materialCost: number;
  expenses: number;
  profit: number;
}

export default function ReportsPage() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchMonthlyData = useCallback(async () => {
    setLoading(true);

    const months = [
      "2025-01",
      "2025-02",
      "2025-03",
      "2025-04",
      "2025-05",
      "2025-06",
      "2025-07",
      "2025-08",
      "2025-09",
      "2025-10",
      "2025-11",
      "2025-12",
    ];

    const data: MonthlyData[] = [];

    for (const month of months) {
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;

      // Get sales for the month
      const { data: salesData } = await supabase
        .from("sales_summary")
        .select("total_amount, amount_paid, balance")
        .gte("date", startDate)
        .lte("date", endDate);

      // Get expenses for the month
      const { data: expensesData } = await supabase
        .from("expenses")
        .select("amount")
        .gte("date", startDate)
        .lte("date", endDate);

      // Get material costs for the month
      const { data: jobsData } = await supabase
        .from("sewing_jobs")
        .select("material_cost")
        .gte("date", startDate)
        .lte("date", endDate);

      const totalSales = salesData?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      const amountCollected = salesData?.reduce((sum, s) => sum + Number(s.amount_paid), 0) || 0;
      const outstanding = salesData?.reduce((sum, s) => sum + Number(s.balance), 0) || 0;
      const materialCost = jobsData?.reduce((sum, j) => sum + Number(j.material_cost), 0) || 0;
      const expenses = expensesData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const profit = amountCollected - materialCost - expenses;

      data.push({
        month,
        totalSales,
        amountCollected,
        outstanding,
        materialCost,
        expenses,
        profit,
      });
    }

    setMonthlyData(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchMonthlyData();
  }, [fetchMonthlyData]);

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const yearTotals = monthlyData.reduce(
    (acc, month) => ({
      totalSales: acc.totalSales + month.totalSales,
      amountCollected: acc.amountCollected + month.amountCollected,
      outstanding: acc.outstanding + month.outstanding,
      materialCost: acc.materialCost + month.materialCost,
      expenses: acc.expenses + month.expenses,
      profit: acc.profit + month.profit,
    }),
    {
      totalSales: 0,
      amountCollected: 0,
      outstanding: 0,
      materialCost: 0,
      expenses: 0,
      profit: 0,
    }
  );

  return (
    <div className="flex-1 space-y-6 p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Monthly Reports</h2>
        <p className="text-muted-foreground">
          View monthly performance and trends
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Year Total Sales
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "#72D0CF" }}>
              {formatCurrency(yearTotals.totalSales)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Year Total Profit
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${yearTotals.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(yearTotals.profit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Year Total Expenses
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "#EC88C7" }}>
              {formatCurrency(yearTotals.expenses + yearTotals.materialCost)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Total Sales</TableHead>
              <TableHead className="text-right">Collected</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead className="text-right">Material Cost</TableHead>
              <TableHead className="text-right">Expenses</TableHead>
              <TableHead className="text-right">Profit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              monthlyData.map((data) => (
                <TableRow key={data.month}>
                  <TableCell className="font-medium">
                    {getMonthName(data.month)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(data.totalSales)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(data.amountCollected)}
                  </TableCell>
                  <TableCell className="text-right text-orange-600">
                    {formatCurrency(data.outstanding)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(data.materialCost)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(data.expenses)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        data.profit >= 0
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {formatCurrency(data.profit)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
            <TableRow className="bg-gray-100 font-bold">
              <TableCell>TOTAL</TableCell>
              <TableCell className="text-right">
                {formatCurrency(yearTotals.totalSales)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(yearTotals.amountCollected)}
              </TableCell>
              <TableCell className="text-right text-orange-600">
                {formatCurrency(yearTotals.outstanding)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(yearTotals.materialCost)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(yearTotals.expenses)}
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={
                    yearTotals.profit >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {formatCurrency(yearTotals.profit)}
                </span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
