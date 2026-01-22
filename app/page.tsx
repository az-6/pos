"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CashierInterface from "@/components/pos/cashier-interface";
import InventoryManagement from "@/components/pos/inventory-management";
import DigitalCashbook from "@/components/pos/digital-cashbook";
import Dashboard from "@/components/pos/dashboard";
import { POSProvider } from "@/components/pos/pos-context-firebase";
import {
  Barcode as BarCode3,
  Package,
  DollarSign,
  TrendingUp,
} from "lucide-react";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <POSProvider>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-foreground">
              Point of Sale System
            </h1>
            <p className="text-sm text-muted-foreground">
              Sistem Manajemen Penjualan Terpadu
            </p>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Tabs defaultValue="cashier" className="w-full">
            <TabsList className="grid w-full grid-cols-4 gap-2">
              <TabsTrigger value="cashier" className="flex items-center gap-2">
                <BarCode3 className="h-4 w-4" />
                <span className="hidden sm:inline">Cashier</span>
              </TabsTrigger>
              <TabsTrigger
                value="inventory"
                className="flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Inventory</span>
              </TabsTrigger>
              <TabsTrigger value="cashbook" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Cashbook</span>
              </TabsTrigger>
              <TabsTrigger
                value="dashboard"
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cashier" className="mt-6">
              <CashierInterface />
            </TabsContent>

            <TabsContent value="inventory" className="mt-6">
              <InventoryManagement />
            </TabsContent>

            <TabsContent value="cashbook" className="mt-6">
              <DigitalCashbook />
            </TabsContent>

            <TabsContent value="dashboard" className="mt-6">
              <Dashboard />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </POSProvider>
  );
}
