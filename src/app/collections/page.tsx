"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { CollectionLog, PaymentMethod } from "@/types/database";
import { Input } from "@/components/ui/input";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import { Wallet, TrendingUp, Calendar } from "lucide-react";
import { TableSkeleton } from "@/components/table-skeleton";

const paymentMethods: PaymentMethod[] = ["Transfer", "Cash", "POS", "Other"];

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const supabase = createClient();

  const fetchCollections = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("collections_log")
      .select("*")
      .order("date", { ascending: false });

    // Apply date range filters if provided
    if (startDate) {
      query = query.gte("date", startDate);
    }
    if (endDate) {
      query = query.lte("date", endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching collections:", error);
    } else {
      setCollections(data || []);
    }
    setLoading(false);
  }, [supabase, startDate, endDate]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const filteredCollections = collections.filter((collection) => {
    const matchesSearch = collection.customer_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesMethod =
      methodFilter === "all" || collection.payment_method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const totalCollected = filteredCollections.reduce(
    (sum, collection) => sum + Number(collection.amount),
    0
  );

  // Group by payment method
  const collectionsByMethod = filteredCollections.reduce((acc, collection) => {
    const method = collection.payment_method;
    acc[method] = (acc[method] || 0) + Number(collection.amount);
    return acc;
  }, {} as Record<PaymentMethod, number>);

  return (
    <div className="flex-1 space-y-6 p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Collections Log</h2>
        <p className="text-muted-foreground">
          View all payment collections history
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total Collected
            </h3>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold" style={{ color: "#10B981" }}>
            {formatCurrency(totalCollected)}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Transfer
            </h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-xl font-bold" style={{ color: "#72D0CF" }}>
            {formatCurrency(collectionsByMethod["Transfer"] || 0)}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Cash
            </h3>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-xl font-bold" style={{ color: "#EC88C7" }}>
            {formatCurrency(collectionsByMethod["Cash"] || 0)}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              POS
            </h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-xl font-bold text-indigo-600">
            {formatCurrency(collectionsByMethod["POS"] || 0)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <Input
          placeholder="Search by customer name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Methods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            {paymentMethods.map((method) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Start date"
            className="w-[150px]"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="End date"
            className="w-[150px]"
          />
        </div>

        <div className="ml-auto text-sm text-muted-foreground">
          Showing <span className="font-bold">{filteredCollections.length}</span> collections
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton columns={5} rows={5} />
            ) : filteredCollections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  {collections.length === 0
                    ? "No payment collections recorded yet."
                    : "No collections match your filters."}
                </TableCell>
              </TableRow>
            ) : (
              filteredCollections.map((collection) => (
                <TableRow key={collection.id}>
                  <TableCell>{formatDate(collection.date)}</TableCell>
                  <TableCell className="font-medium">
                    {collection.customer_name}
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-600">
                    {formatCurrency(Number(collection.amount))}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        collection.payment_method === "Transfer"
                          ? "bg-blue-100 text-blue-700"
                          : collection.payment_method === "Cash"
                          ? "bg-green-100 text-green-700"
                          : collection.payment_method === "POS"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {collection.payment_method}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {collection.notes || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-md border bg-gray-50 p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Total for this period:</span>
          <span className="text-2xl font-bold text-green-600">
            {formatCurrency(totalCollected)}
          </span>
        </div>
      </div>
    </div>
  );
}
