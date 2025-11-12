"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSettings } from "@/contexts/SettingsContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, DollarSign, Package, BarChart3, PieChart as PieChartIcon, TrendingUpIcon } from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { TableSkeleton } from "@/components/table-skeleton";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MonthlyData {
  month: string;
  totalSales: number;
  amountCollected: number;
  outstanding: number;
  materialCost: number;
  expenses: number;
  profit: number;
}

interface ExpenseBreakdown {
  type: string;
  amount: number;
}

export default function ReportsPage() {
  const { settings } = useSettings();
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("2025");
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  const supabase = createClient();

  // Fetch available years and reporting year from settings
  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
      .from("settings")
      .select("*");

    if (data) {
      const reportingYear = data.find((s) => s.key === "reporting_year");
      if (reportingYear) {
        setSelectedYear(reportingYear.value);
      }
    }

    // Generate available years (current year - 2 to current year + 1)
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 2; year <= currentYear + 1; year++) {
      years.push(year.toString());
    }
    setAvailableYears(years);
  }, [supabase]);

  const fetchExpenseBreakdown = useCallback(async (year: string) => {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data: expensesData } = await supabase
      .from("expenses")
      .select("expense_type, amount")
      .gte("date", startDate)
      .lte("date", endDate);

    if (expensesData) {
      const breakdown: Record<string, number> = {};
      expensesData.forEach((expense) => {
        const type = expense.expense_type || "Other";
        breakdown[type] = (breakdown[type] || 0) + Number(expense.amount);
      });

      const breakdownArray = Object.entries(breakdown).map(([type, amount]) => ({
        type,
        amount,
      }));

      setExpenseBreakdown(breakdownArray);
    }
  }, [supabase]);

  const fetchMonthlyData = useCallback(async (year: string) => {
    setLoading(true);

    const data: MonthlyData[] = [];

    // Generate months for the selected year
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const date = new Date(parseInt(year), monthIndex, 1);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const startDate = format(monthStart, "yyyy-MM-dd");
      const endDate = format(monthEnd, "yyyy-MM-dd");
      const monthKey = format(date, "yyyy-MM");

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
        month: monthKey,
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
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (selectedYear) {
      fetchMonthlyData(selectedYear);
      fetchExpenseBreakdown(selectedYear);
    }
  }, [selectedYear, fetchMonthlyData, fetchExpenseBreakdown]);

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

  // Chart data preparation
  const chartData = monthlyData.map((data) => ({
    month: format(new Date(data.month + "-01"), "MMM"),
    sales: data.totalSales,
    profit: data.profit,
    expenses: data.expenses + data.materialCost,
  }));

  // Colors for pie chart
  const COLORS = [settings.brand_primary_color, settings.brand_accent_color, "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="text-sm">
              <span className="font-medium">{entry.name}: </span>
              <span style={{ color: entry.color }}>{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Monthly Reports</h2>
          <p className="text-muted-foreground">
            View monthly performance and trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="year-select" className="text-sm font-medium">
            Year:
          </label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]" id="year-select">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedYear} Total Sales
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: settings.brand_primary_color }}>
              {formatCurrency(yearTotals.totalSales)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedYear} Total Profit
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
              {selectedYear} Total Expenses
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: settings.brand_accent_color }}>
              {formatCurrency(yearTotals.expenses + yearTotals.materialCost)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Bar Chart: Monthly Total Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" style={{ color: settings.brand_primary_color }} />
              Monthly Total Sales
            </CardTitle>
            <CardDescription>Sales performance across the year</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sales" fill={settings.brand_primary_color} name="Total Sales" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart: Monthly Profit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5" style={{ color: "#10B981" }} />
              Monthly Profit
            </CardTitle>
            <CardDescription>Profit trends throughout the year</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="profit" fill="#10B981" name="Profit">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? "#10B981" : "#EF4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Line Chart: Sales vs Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" style={{ color: settings.brand_accent_color }} />
              Sales vs Expenses Trend
            </CardTitle>
            <CardDescription>Compare revenue and costs over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke={settings.brand_primary_color} strokeWidth={2} name="Sales" />
                <Line type="monotone" dataKey="expenses" stroke={settings.brand_accent_color} strokeWidth={2} name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart: Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" style={{ color: "#F59E0B" }} />
              Expense Breakdown by Type
            </CardTitle>
            <CardDescription>Distribution of expenses across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                  nameKey="type"
                >
                  {expenseBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border overflow-x-auto">
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
              <TableSkeleton columns={7} rows={5} />
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
