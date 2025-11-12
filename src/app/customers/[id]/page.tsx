"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, User, Phone, MapPin, ShoppingBag, DollarSign, Calendar, Ruler } from "lucide-react";
import { format } from "date-fns";

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  measurements_notes: string;
  first_order_date: string;
  last_order_date: string;
  preferred_contact: string;
  fabric_preferences: string;
  size_fit_notes: string;
}

interface SewingJob {
  id: string;
  date: string;
  item_sewn: string;
  total_charged: number;
  amount_paid: number;
  balance: number;
  status: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { settings } = useSettings();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [jobs, setJobs] = useState<SewingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  const [lifetimeValue, setLifetimeValue] = useState(0);
  const [outstandingBalance, setOutstandingBalance] = useState(0);

  const supabase = createClient();
  const customerId = params.id as string;

  const fetchCustomerData = async () => {
    setLoading(true);

    // Fetch customer details
    const { data: customerData } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single();

    if (customerData) {
      setCustomer(customerData);
    }

    // Fetch all jobs for this customer
    const { data: jobsData } = await supabase
      .from("sewing_jobs")
      .select("*")
      .eq("customer_id", customerId)
      .order("date", { ascending: false });

    if (jobsData) {
      setJobs(jobsData);
      setTotalOrders(jobsData.length);

      // Calculate metrics
      const totalPaid = jobsData.reduce((sum, job) => sum + Number(job.amount_paid), 0);
      const totalOwed = jobsData.reduce((sum, job) => sum + Number(job.balance), 0);

      setLifetimeValue(totalPaid);
      setOutstandingBalance(totalOwed);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchCustomerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Done":
        return "text-green-600 bg-green-100";
      case "Part":
        return "text-yellow-600 bg-yellow-100";
      case "Pending":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="text-center">Loading customer details...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex-1 p-8">
        <div className="text-center">Customer not found</div>
        <Button onClick={() => router.push("/customers")} className="mt-4">
          Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/customers")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{customer.name}</h2>
          <p className="text-sm text-muted-foreground">Customer Profile</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: settings.brand_primary_color }}>
              {totalOrders}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lifetime Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(lifetimeValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${outstandingBalance > 0 ? "text-orange-600" : "text-green-600"}`}>
              {formatCurrency(outstandingBalance)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Order</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {customer.last_order_date
                ? format(new Date(customer.last_order_date), "MMM dd, yyyy")
                : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Information */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">{customer.phone || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Address</p>
                <p className="text-sm text-muted-foreground">{customer.address || "N/A"}</p>
              </div>
            </div>
            {customer.preferred_contact && (
              <div>
                <p className="text-sm font-medium">Preferred Contact</p>
                <p className="text-sm text-muted-foreground">{customer.preferred_contact}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Measurements & Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.measurements_notes && (
              <div>
                <p className="text-sm font-medium">Measurements</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {customer.measurements_notes}
                </p>
              </div>
            )}
            {customer.size_fit_notes && (
              <div>
                <p className="text-sm font-medium">Size/Fit Notes</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {customer.size_fit_notes}
                </p>
              </div>
            )}
            {customer.fabric_preferences && (
              <div>
                <p className="text-sm font-medium">Fabric Preferences</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {customer.fabric_preferences}
                </p>
              </div>
            )}
            {!customer.measurements_notes && !customer.size_fit_notes && !customer.fabric_preferences && (
              <p className="text-sm text-muted-foreground">No measurements or preferences recorded</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order History */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>
            All orders from {customer.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No orders found for this customer
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Total Charged</TableHead>
                    <TableHead className="text-right">Amount Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        {format(new Date(job.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">{job.item_sewn}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(job.total_charged)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(job.amount_paid)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={job.balance > 0 ? "text-orange-600 font-medium" : ""}>
                          {formatCurrency(job.balance)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            job.status
                          )}`}
                        >
                          {job.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
