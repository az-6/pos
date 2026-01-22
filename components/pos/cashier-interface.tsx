"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePOS } from "./pos-context-firebase";
import { Trash2, Barcode, Search, Plus, Minus } from "lucide-react";

export default function CashierInterface() {
  const {
    cart,
    inventory,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    completeTransaction,
    addInventoryItem,
  } = usePOS();
  const [searchTerm, setSearchTerm] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "transfer"
  >("cash");
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [showNewItem, setShowNewItem] = useState(false);
  const [newItemData, setNewItemData] = useState({
    name: "",
    barcode: "",
    price: 0,
    cost: 0,
  });

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const filteredItems = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barcode.includes(searchTerm),
  );

  const handleBarcodeSubmit = () => {
    const item = inventory.find((i) => i.barcode === barcodeInput);
    if (item && item.quantity > 0) {
      addToCart(item, quantity);
      setBarcodeInput("");
      setQuantity(1);
      barcodeInputRef.current?.focus();
    } else {
      alert("Produk tidak ditemukan atau stok habis");
    }
  };

  const handleAddItem = () => {
    if (newItemData.name && newItemData.barcode && newItemData.price > 0) {
      const item = {
        id: `ITEM-${Date.now()}`,
        name: newItemData.name,
        barcode: newItemData.barcode,
        quantity: 100,
        price: newItemData.price,
        cost: newItemData.cost,
        minStock: 10,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        category: "Umum",
        createdAt: new Date().toISOString(),
      };
      addInventoryItem(item);
      setNewItemData({ name: "", barcode: "", price: 0, cost: 0 });
      setShowNewItem(false);
      alert("Produk berhasil ditambahkan");
    }
  };

  const handleSelectItem = (item: any) => {
    addToCart(item, quantity);
    setSearchTerm("");
    setQuantity(1);
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Keranjang kosong");
      return;
    }
    completeTransaction(paymentMethod);
    alert("Transaksi berhasil disimpan");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Scan Barcode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="barcode-input">Scan atau masukkan barcode:</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={barcodeInputRef}
                    id="barcode-input"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleBarcodeSubmit();
                      }
                    }}
                    placeholder="Scan barcode produk..."
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleBarcodeSubmit}>Scan</Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qty">Jumlah:</Label>
              <Input
                id="qty"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cari Produk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama atau barcode..."
                className="pl-10"
              />
            </div>

            {searchTerm && (
              <div className="max-h-96 overflow-y-auto border rounded-lg">
                {filteredItems.length > 0 ? (
                  <div className="divide-y">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 hover:bg-muted cursor-pointer"
                        onClick={() => handleSelectItem(item)}
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Rp {item.price.toLocaleString("id-ID")} ×{" "}
                            {item.quantity}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    Produk tidak ditemukan
                  </div>
                )}
              </div>
            )}

            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => setShowNewItem(!showNewItem)}
            >
              {showNewItem ? "Batal" : "Tambah Produk Baru"}
            </Button>

            {showNewItem && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
                <Input
                  placeholder="Nama Produk"
                  value={newItemData.name}
                  onChange={(e) =>
                    setNewItemData({ ...newItemData, name: e.target.value })
                  }
                />
                <Input
                  placeholder="Barcode"
                  value={newItemData.barcode}
                  onChange={(e) =>
                    setNewItemData({ ...newItemData, barcode: e.target.value })
                  }
                />
                <Input
                  type="number"
                  placeholder="Harga Jual (Rp)"
                  value={newItemData.price || ""}
                  onChange={(e) =>
                    setNewItemData({
                      ...newItemData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <Input
                  type="number"
                  placeholder="Harga Pokok (Rp)"
                  value={newItemData.cost || ""}
                  onChange={(e) =>
                    setNewItemData({
                      ...newItemData,
                      cost: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <Button onClick={handleAddItem} className="w-full">
                  Simpan Produk
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle>Keranjang Belanja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-80 overflow-y-auto space-y-2">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  Keranjang kosong
                </p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-2 border rounded"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Rp {item.price.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateCartQuantity(item.id, item.quantity - 1)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateCartQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>Rp {cartTotal.toLocaleString("id-ID")}</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment">Metode Pembayaran:</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value: any) => setPaymentMethod(value)}
                >
                  <SelectTrigger id="payment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Tunai</SelectItem>
                    <SelectItem value="card">Kartu</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleCheckout}
                className="w-full h-12 text-base"
                disabled={cart.length === 0}
              >
                Selesaikan Transaksi
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
