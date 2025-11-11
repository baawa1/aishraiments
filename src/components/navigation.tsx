"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";
import {
  LayoutDashboard,
  Package,
  Scissors,
  DollarSign,
  Users,
  Receipt,
  Wallet,
  TrendingUp,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/jobs", label: "Sewing Jobs", icon: Scissors },
  { href: "/expenses", label: "Expenses", icon: DollarSign },
  { href: "/sales", label: "Sales", icon: Receipt },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/receivables", label: "Receivables", icon: Wallet },
  { href: "/reports", label: "Reports", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-screen flex-col border-r bg-gray-50/40 w-64">
      <div className="flex h-20 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="A'ish Raiments"
            width={50}
            height={50}
            className="rounded-full"
          />
          <div className="flex flex-col">
            <span className="text-lg font-bold" style={{ color: "#72D0CF" }}>
              A&apos;ish Raiments
            </span>
            <span className="text-xs" style={{ color: "#EC88C7" }}>
              Fashion with Panache
            </span>
          </div>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#72D0CF] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-gray-700 hover:bg-gray-100"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
