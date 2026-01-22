"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePOS } from "./pos-context-firebase";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
} from "lucide-react";

export default function Dashboard() {
  const { transactions, inventory } = usePOS();

  const analyticsData = useMemo(() => {
    // Daily turnover
    const dailyTurnover: { [key: string]: number } = {};
    const dailyProfit: { [key: string]: number } = {};

    transactions.forEach((t) => {
      const date = new Date(t.timestamp).toLocaleDateString("id-ID", {
        month: "2-digit",
        day: "2-digit",
      });
      dailyTurnover[date] = (dailyTurnover[date] || 0) + t.total;
      dailyProfit[date] = (dailyProfit[date] || 0) + t.profit;
    });

    const chartData = Object.entries(dailyTurnover)
      .sort(
        (a, b) =>
          new Date(`2024-${a[0]}`).getTime() -
          new Date(`2024-${b[0]}`).getTime(),
      )
      .slice(-7)
      .map(([date, total]) => ({
        date,
        turnover: total,
        profit: dailyProfit[date],
      }));

    // Best selling products
    const productSales: {
      [key: string]: { quantity: number; revenue: number; name: string };
    } = {};

    transactions.forEach((t) => {
      t.items.forEach((item) => {
        if (!productSales[item.id]) {
          productSales[item.id] = {
            quantity: 0,
            revenue: 0,
            name: item.name,
          };
        }
        productSales[item.id].quantity += item.quantity;
        productSales[item.id].revenue += item.price * item.quantity;
      });
    });

    const bestSellingProducts = Object.entries(productSales)
      .map(([id, data]) => ({
        id,
        name: data.name,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Totals
    const totalTurnover = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalProfit = transactions.reduce((sum, t) => sum + t.profit, 0);
    const totalLoss = totalTurnover - totalProfit;

    // Payment method breakdown
    const paymentMethodBreakdown: { [key: string]: number } = {};
    transactions.forEach((t) => {
      paymentMethodBreakdown[t.paymentMethod] =
        (paymentMethodBreakdown[t.paymentMethod] || 0) + t.total;
    });

    const paymentMethodData = Object.entries(paymentMethodBreakdown).map(
      ([method, amount]) => ({
        name:
          method === "cash"
            ? "Tunai"
            : method === "card"
              ? "Kartu"
              : "Transfer",
        value: amount,
      }),
    );

    return {
      chartData,
      bestSellingProducts,
      totalTurnover,
      totalProfit,
      totalLoss,
      paymentMethodData,
    };
  }, [transactions]);

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  const stats = [
    {
      label: "Total Penjualan",
      value: `Rp ${analyticsData.totalTurnover.toLocaleString("id-ID")}`,
      icon: ShoppingCart,
      color: "text-blue-600",
    },
    {
      label: "Total Keuntungan",
      value: `Rp ${analyticsData.totalProfit.toLocaleString("id-ID")}`,
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      label: "Total Rugi",
      value: `Rp ${analyticsData.totalLoss.toLocaleString("id-ID")}`,
      icon: TrendingDown,
      color: "text-red-600",
    },
    {
      label: "Total Transaksi",
      value: transactions.length.toString(),
      icon: DollarSign,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Turnover Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Turnover Harian (7 Hari Terakhir)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) =>
                      `Rp ${(value as number).toLocaleString("id-ID")}`
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="turnover"
                    stroke="#3b82f6"
                    name="Turnover"
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#10b981"
                    name="Keuntungan"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Metode Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.paymentMethodData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) =>
                      `${name}: Rp ${(value as number).toLocaleString("id-ID")}`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.paymentMethodData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) =>
                      `Rp ${(value as number).toLocaleString("id-ID")}`
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best Selling Products */}
      <Card>
        <CardHeader>
          <CardTitle>Produk Terlaris</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.bestSellingProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="quantity"
                  fill="#3b82f6"
                  name="Jumlah Terjual"
                  yAxisId="left"
                />
                <Bar
                  dataKey="revenue"
                  fill="#10b981"
                  name="Pendapatan"
                  yAxisId="right"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Profit/Loss Report */}
      <Card>
        <CardHeader>
          <CardTitle>Laporan Keuntungan/Rugi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Total Penjualan:
                  </span>
                  <span className="font-semibold">
                    Rp {analyticsData.totalTurnover.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Total Keuntungan:
                  </span>
                  <span className="font-semibold text-green-600">
                    Rp {analyticsData.totalProfit.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Rugi:</span>
                  <span className="font-semibold text-red-600">
                    Rp {analyticsData.totalLoss.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Transaksi:</span>
                  <span className="text-2xl font-bold">
                    {transactions.length}
                  </span>
                </div>
              </div>
              <div className="border rounded-lg p-4 bg-green-50">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Margin Keuntungan:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {analyticsData.totalTurnover > 0
                      ? Math.round(
                          (analyticsData.totalProfit /
                            analyticsData.totalTurnover) *
                            100,
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>
              <div className="border rounded-lg p-4 bg-muted">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Rata-rata Transaksi:</span>
                  <span className="text-2xl font-bold">
                    Rp{" "}
                    {transactions.length > 0
                      ? Math.round(
                          analyticsData.totalTurnover / transactions.length,
                        ).toLocaleString("id-ID")
                      : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
