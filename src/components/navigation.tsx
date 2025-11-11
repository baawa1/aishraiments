"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSettings } from "@/contexts/SettingsContext";
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
  HandCoins,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/jobs", label: "Sewing Jobs", icon: Scissors },
  { href: "/expenses", label: "Expenses", icon: DollarSign },
  { href: "/sales", label: "Sales", icon: Receipt },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/receivables", label: "Receivables", icon: Wallet },
  { href: "/collections", label: "Collections", icon: HandCoins },
  { href: "/reports", label: "Reports", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { settings } = useSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-40 p-2 rounded-md bg-white border border-gray-200 shadow-sm lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6 text-gray-700" />
      </button>

      {/* Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar Navigation */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          flex h-screen flex-col border-r bg-gray-50/40 w-64
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex h-20 items-center justify-between border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={closeMobileMenu}>
          <Image
            src="/logo.png"
            alt={settings.business_name}
            width={50}
            height={50}
            className="rounded-full"
          />
          <div className="flex flex-col">
            <span className="text-lg font-bold" style={{ color: settings.brand_primary_color }}>
              {settings.business_name}
            </span>
            <span className="text-xs" style={{ color: settings.brand_accent_color }}>
              {settings.business_motto}
            </span>
          </div>
        </Link>

        {/* Close button for mobile */}
        <button
          onClick={closeMobileMenu}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          aria-label="Close menu"
        >
          <X className="h-5 w-5 text-gray-700" />
        </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              style={isActive ? { backgroundColor: settings.brand_primary_color } : {}}
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
    </>
  );
}
