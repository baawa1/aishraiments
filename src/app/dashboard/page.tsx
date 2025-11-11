import { createServerClient } from "@/lib/supabase/server";
import { MetricCard } from "@/components/dashboard/metric-card";
import {
  DollarSign,
  Wallet,
  TrendingUp,
  Package,
  Receipt,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardMetrics } from "@/types/database";

async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = createServerClient();

  // Fetch all data in parallel
  const [
    { data: salesData },
    { data: expensesData },
    { data: jobsData },
    { data: inventoryData },
  ] = await Promise.all([
    supabase.from("sales_summary").select("total_amount, amount_paid, balance"),
    supabase.from("expenses").select("amount"),
    supabase.from("sewing_jobs").select("material_cost, amount_paid"),
    supabase.from("inventory").select("total_cost"),
  ]);

  // Calculate metrics
  const totalSales = salesData?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
  const amountCollected = salesData?.reduce((sum, sale) => sum + Number(sale.amount_paid), 0) || 0;
  const outstandingBalance = salesData?.reduce((sum, sale) => sum + Number(sale.balance), 0) || 0;
  const totalExpenses = expensesData?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
  const materialCost = jobsData?.reduce((sum, job) => sum + Number(job.material_cost), 0) || 0;
  const inventoryValue = inventoryData?.reduce((sum, item) => sum + Number(item.total_cost), 0) || 0;
  const profit = amountCollected - totalExpenses - materialCost;

  return {
    totalSales,
    amountCollected,
    outstandingBalance,
    totalExpenses,
    materialCost,
    profit,
    inventoryValue,
  };
}

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();
  const supabase = createServerClient();

  // Get recent jobs
  const { data: recentJobs } = await supabase
    .from("sewing_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  // Get low stock items
  const { data: lowStockItems } = await supabase
    .from("inventory")
    .select("*")
    .lt("quantity_left", 5)
    .order("quantity_left", { ascending: true })
    .limit(5);

  return (
    <div className="flex-1 space-y-6 p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to your business overview
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Sales"
          value={metrics.totalSales}
          icon={Receipt}
          color="#72D0CF"
          description="All time sales"
        />
        <MetricCard
          title="Amount Collected"
          value={metrics.amountCollected}
          icon={Wallet}
          color="#EC88C7"
          description="Payments received"
        />
        <MetricCard
          title="Outstanding Balance"
          value={metrics.outstandingBalance}
          icon={AlertCircle}
          color="#F59E0B"
          description="Pending payments"
        />
        <MetricCard
          title="Profit"
          value={metrics.profit}
          icon={TrendingUp}
          color={metrics.profit >= 0 ? "#10B981" : "#EF4444"}
          description="Revenue minus costs"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total Expenses"
          value={metrics.totalExpenses}
          icon={DollarSign}
          color="#EC88C7"
          description="Operating expenses"
        />
        <MetricCard
          title="Material Cost"
          value={metrics.materialCost}
          icon={Package}
          color="#72D0CF"
          description="Fabric & materials"
        />
        <MetricCard
          title="Inventory Value"
          value={metrics.inventoryValue}
          icon={Package}
          color="#6366F1"
          description="Stock on hand"
        />
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {recentJobs && recentJobs.length > 0 ? (
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{job.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.item_sewn}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium" style={{ color: "#72D0CF" }}>
                        ₦{Number(job.total_charged).toLocaleString()}
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          job.status === "Done"
                            ? "bg-green-100 text-green-700"
                            : job.status === "Part"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent jobs</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockItems && lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{item.item_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-orange-600">
                        {Number(item.quantity_left).toFixed(1)} left
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                All stock levels good
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
