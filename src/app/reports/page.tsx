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
import { MobileCardSkeleton } from "@/components/mobile-card-skeleton";
import { MobileCardView } from "@/components/ui/mobile-card-view";
import { DetailSheet } from "@/components/ui/detail-sheet";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/table-pagination";
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
  inventoryProfit: number;
  sewingProfit: number;
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
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedMonthData, setSelectedMonthData] = useState<MonthlyData | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const supabase = createClient();

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // Fetch all data for the year in parallel (3 queries instead of 36)
    const [
      { data: salesData },
      { data: expensesData },
      { data: jobsData }
    ] = await Promise.all([
      supabase
        .from("sales_summary")
        .select("date, total_amount, amount_paid, balance, inventory_profit")
        .gte("date", startDate)
        .lte("date", endDate),
      supabase
        .from("expenses")
        .select("date, amount")
        .gte("date", startDate)
        .lte("date", endDate),
      supabase
        .from("sewing_jobs")
        .select("date, material_cost, profit")
        .gte("date", startDate)
        .lte("date", endDate)
    ]);

    // Determine how many months to show
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11
    const selectedYearNum = parseInt(year);

    // If current year, only show months up to current month; otherwise show all 12
    const maxMonthIndex = selectedYearNum === currentYear ? currentMonth : 11;

    // Initialize data structure for months up to maxMonthIndex
    const monthlyDataMap = new Map<string, MonthlyData>();
    for (let monthIndex = 0; monthIndex <= maxMonthIndex; monthIndex++) {
      const date = new Date(selectedYearNum, monthIndex, 1);
      const monthKey = format(date, "yyyy-MM");
      monthlyDataMap.set(monthKey, {
        month: monthKey,
        totalSales: 0,
        amountCollected: 0,
        outstanding: 0,
        materialCost: 0,
        expenses: 0,
        profit: 0,
        inventoryProfit: 0,
        sewingProfit: 0,
      });
    }

    // Aggregate sales data by month
    salesData?.forEach((sale) => {
      const monthKey = sale.date.substring(0, 7); // Extract YYYY-MM
      const monthData = monthlyDataMap.get(monthKey);
      if (monthData) {
        monthData.totalSales += Number(sale.total_amount);
        monthData.amountCollected += Number(sale.amount_paid);
        monthData.outstanding += Number(sale.balance);
        monthData.inventoryProfit += sale.inventory_profit ? Number(sale.inventory_profit) : 0;
      }
    });

    // Aggregate expenses data by month
    expensesData?.forEach((expense) => {
      const monthKey = expense.date.substring(0, 7);
      const monthData = monthlyDataMap.get(monthKey);
      if (monthData) {
        monthData.expenses += Number(expense.amount);
      }
    });

    // Aggregate jobs data by month
    jobsData?.forEach((job) => {
      const monthKey = job.date.substring(0, 7);
      const monthData = monthlyDataMap.get(monthKey);
      if (monthData) {
        monthData.materialCost += Number(job.material_cost);
        monthData.sewingProfit += Number(job.profit);
      }
    });

    // Calculate total profit for each month
    monthlyDataMap.forEach((monthData) => {
      monthData.profit = monthData.sewingProfit + monthData.inventoryProfit;
    });

    // Convert map to array and reverse to show most recent months first
    const data = Array.from(monthlyDataMap.values()).reverse();
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

  const handleCardClick = (data: MonthlyData) => {
    setSelectedMonthData(data);
    setDetailSheetOpen(true);
  };

  const yearTotals = monthlyData.reduce(
    (acc, month) => ({
      totalSales: acc.totalSales + month.totalSales,
      amountCollected: acc.amountCollected + month.amountCollected,
      outstanding: acc.outstanding + month.outstanding,
      materialCost: acc.materialCost + month.materialCost,
      expenses: acc.expenses + month.expenses,
      profit: acc.profit + month.profit,
      inventoryProfit: acc.inventoryProfit + month.inventoryProfit,
      sewingProfit: acc.sewingProfit + month.sewingProfit,
    }),
    {
      totalSales: 0,
      amountCollected: 0,
      outstanding: 0,
      materialCost: 0,
      expenses: 0,
      profit: 0,
      inventoryProfit: 0,
      sewingProfit: 0,
    }
  );

  // Pagination
  const {
    currentItems,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    totalItems,
    itemRange,
  } = usePagination(monthlyData, { initialItemsPerPage: 10 });

  // Chart data preparation
  const chartData = monthlyData.map((data) => ({
    month: format(new Date(data.month + "-01"), "MMM"),
    sales: data.totalSales,
    profit: data.profit,
    sewingProfit: data.sewingProfit,
    inventoryProfit: data.inventoryProfit,
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
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
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
            <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" style={{ fontSize: isMobile ? '12px' : '14px' }} />
                <YAxis style={{ fontSize: isMobile ? '12px' : '14px' }} />
                <Tooltip content={<CustomTooltip />} />
                {!isMobile && <Bar dataKey="sales" fill={settings.brand_primary_color} name="Total Sales" />}
                {isMobile && <Bar dataKey="sales" fill={settings.brand_primary_color} />}
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
            <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" style={{ fontSize: isMobile ? '12px' : '14px' }} />
                <YAxis style={{ fontSize: isMobile ? '12px' : '14px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="profit" fill="#10B981" name={isMobile ? undefined : "Profit"}>
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
            <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" style={{ fontSize: isMobile ? '12px' : '14px' }} />
                <YAxis style={{ fontSize: isMobile ? '12px' : '14px' }} />
                <Tooltip content={<CustomTooltip />} />
                {!isMobile && <Legend />}
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
            <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={isMobile
                    ? ({ percent }) => `${(percent * 100).toFixed(0)}%`
                    : ({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={isMobile ? 60 : 80}
                  fill="#8884d8"
                  dataKey="amount"
                  nameKey="type"
                  style={{ fontSize: isMobile ? '11px' : '14px' }}
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

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {loading ? (
          <MobileCardSkeleton rows={5} />
        ) : (
          <div className="space-y-4">
            <MobileCardView
              data={currentItems}
              onCardClick={handleCardClick}
              emptyMessage="No monthly data found"
              renderCard={(data) => (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{getMonthName(data.month)}</h3>
                    <span
                      className={`text-lg font-bold ${
                        data.profit >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(data.profit)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Sales:</span>
                      <div className="font-semibold">{formatCurrency(data.totalSales)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Collected:</span>
                      <div className="font-semibold">{formatCurrency(data.amountCollected)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Outstanding:</span>
                      <div className="font-semibold text-orange-600">{formatCurrency(data.outstanding)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Expenses:</span>
                      <div className="font-semibold">{formatCurrency(data.expenses)}</div>
                    </div>
                  </div>
                </div>
              )}
            />
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              itemRange={itemRange}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block space-y-4">
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
                <TableHead className="text-right">Sewing Profit</TableHead>
                <TableHead className="text-right">Inventory Profit</TableHead>
                <TableHead className="text-right">Total Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={9} rows={5} />
              ) : (
                currentItems.map((data) => (
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
                          data.sewingProfit >= 0
                            ? "text-green-600 font-medium"
                            : "text-red-600 font-medium"
                        }
                      >
                        {formatCurrency(data.sewingProfit)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          data.inventoryProfit >= 0
                            ? "text-green-600 font-medium"
                            : "text-red-600 font-medium"
                        }
                      >
                        {formatCurrency(data.inventoryProfit)}
                      </span>
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
                      yearTotals.sewingProfit >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {formatCurrency(yearTotals.sewingProfit)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={
                      yearTotals.inventoryProfit >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {formatCurrency(yearTotals.inventoryProfit)}
                  </span>
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
        {!loading && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            itemRange={itemRange}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
      </div>

      {/* Mobile Detail Sheet */}
      <DetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        title="Monthly Report Details"
      >
        {selectedMonthData && (
          <div className="space-y-4">
            <div className="text-center pb-4 border-b">
              <h3 className="text-xl font-bold">{getMonthName(selectedMonthData.month)}</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-muted-foreground">Total Sales:</span>
                <span className="font-bold" style={{ color: settings.brand_primary_color }}>
                  {formatCurrency(selectedMonthData.totalSales)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-muted-foreground">Amount Collected:</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(selectedMonthData.amountCollected)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-muted-foreground">Outstanding:</span>
                <span className="font-bold text-orange-600">
                  {formatCurrency(selectedMonthData.outstanding)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-muted-foreground">Material Cost:</span>
                <span className="font-bold">
                  {formatCurrency(selectedMonthData.materialCost)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-muted-foreground">Expenses:</span>
                <span className="font-bold">
                  {formatCurrency(selectedMonthData.expenses)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-muted-foreground">Sewing Profit:</span>
                <span
                  className={`font-bold ${
                    selectedMonthData.sewingProfit >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(selectedMonthData.sewingProfit)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-muted-foreground">Inventory Profit:</span>
                <span
                  className={`font-bold ${
                    selectedMonthData.inventoryProfit >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(selectedMonthData.inventoryProfit)}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg border-2 border-gray-200">
                <span className="text-base font-medium">Total Profit:</span>
                <span
                  className={`text-xl font-bold ${
                    selectedMonthData.profit >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(selectedMonthData.profit)}
                </span>
              </div>
            </div>
          </div>
        )}
      </DetailSheet>
    </div>
  );
}
