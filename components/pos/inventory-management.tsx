'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { usePOS, InventoryItem, IncomingGood } from './pos-context'
import { Trash2, AlertTriangle, Package, Plus } from 'lucide-react'

export default function InventoryManagement() {
  const { inventory, incomingGoods, addIncomingGood, updateInventoryItem, deleteInventoryItem, addInventoryItem } = usePOS()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddIncoming, setShowAddIncoming] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [incomingData, setIncomingData] = useState({
    itemId: '',
    quantity: 0,
    cost: 0,
    expiryDate: '',
  })
  const [newItemData, setNewItemData] = useState({
    name: '',
    barcode: '',
    quantity: 0,
    price: 0,
    cost: 0,
    minStock: 10,
    expiryDate: '',
    category: 'Umum',
  })

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barcode.includes(searchTerm)
  )

  const lowStockItems = inventory.filter((item) => item.quantity <= item.minStock)

  const handleAddIncoming = () => {
    if (incomingData.itemId && incomingData.quantity > 0 && incomingData.expiryDate) {
      const good: IncomingGood = {
        id: '',
        itemId: incomingData.itemId,
        quantity: incomingData.quantity,
        cost: incomingData.cost,
        timestamp: new Date().toISOString(),
        expiryDate: incomingData.expiryDate,
      }
      addIncomingGood(good)
      setIncomingData({
        itemId: '',
        quantity: 0,
        cost: 0,
        expiryDate: '',
      })
      setShowAddIncoming(false)
      alert('Barang masuk berhasil dicatat')
    } else {
      alert('Isi semua field')
    }
  }

  const handleAddItem = () => {
    if (newItemData.name && newItemData.barcode && newItemData.price > 0) {
      const item: InventoryItem = {
        id: `ITEM-${Date.now()}`,
        name: newItemData.name,
        barcode: newItemData.barcode,
        quantity: newItemData.quantity,
        price: newItemData.price,
        cost: newItemData.cost,
        minStock: newItemData.minStock,
        expiryDate: newItemData.expiryDate,
        category: newItemData.category,
        createdAt: new Date().toISOString(),
      }
      addInventoryItem(item)
      setNewItemData({
        name: '',
        barcode: '',
        quantity: 0,
        price: 0,
        cost: 0,
        minStock: 10,
        expiryDate: '',
        category: 'Umum',
      })
      setShowAddItem(false)
      alert('Produk berhasil ditambahkan')
    }
  }

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const today = new Date()
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
  }

  const isExpired = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const today = new Date()
    return expiry < today
  }

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Daftar Stok</TabsTrigger>
        <TabsTrigger value="low-stock">Stok Rendah</TabsTrigger>
        <TabsTrigger value="incoming">Barang Masuk</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Manajemen Inventaris</CardTitle>
            <Button onClick={() => setShowAddItem(!showAddItem)}>
              {showAddItem ? 'Batal' : 'Tambah Produk'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {showAddItem && (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                <Input
                  placeholder="Nama produk"
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
                  placeholder="Jumlah stok"
                  value={newItemData.quantity}
                  onChange={(e) =>
                    setNewItemData({ ...newItemData, quantity: parseInt(e.target.value) || 0 })
                  }
                />
                <Input
                  type="number"
                  placeholder="Harga jual (Rp)"
                  value={newItemData.price}
                  onChange={(e) =>
                    setNewItemData({ ...newItemData, price: parseFloat(e.target.value) || 0 })
                  }
                />
                <Input
                  type="number"
                  placeholder="Harga pokok (Rp)"
                  value={newItemData.cost}
                  onChange={(e) =>
                    setNewItemData({ ...newItemData, cost: parseFloat(e.target.value) || 0 })
                  }
                />
                <Input
                  type="number"
                  placeholder="Stok minimum"
                  value={newItemData.minStock}
                  onChange={(e) =>
                    setNewItemData({ ...newItemData, minStock: parseInt(e.target.value) || 10 })
                  }
                />
                <Input
                  type="date"
                  value={newItemData.expiryDate}
                  onChange={(e) =>
                    setNewItemData({ ...newItemData, expiryDate: e.target.value })
                  }
                />
                <Input
                  placeholder="Kategori"
                  value={newItemData.category}
                  onChange={(e) =>
                    setNewItemData({ ...newItemData, category: e.target.value })
                  }
                />
                <Button onClick={handleAddItem} className="w-full">
                  Simpan Produk
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Exp Date</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.barcode}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-sm font-medium ${
                            item.quantity <= item.minStock
                              ? 'bg-destructive/20 text-destructive'
                              : 'bg-green-500/20 text-green-700'
                          }`}
                        >
                          {item.quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        Rp {item.price.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-sm ${
                            isExpired(item.expiryDate)
                              ? 'text-destructive'
                              : isExpiringSoon(item.expiryDate)
                                ? 'text-orange-500'
                                : 'text-muted-foreground'
                          }`}
                        >
                          {new Date(item.expiryDate).toLocaleDateString('id-ID')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteInventoryItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredInventory.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada produk
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="low-stock" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Notifikasi Stok Rendah ({lowStockItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <Alert>
                <AlertDescription>Semua stok normal</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <Alert key={item.id} className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-900">
                      <strong>{item.name}</strong> - Stok: {item.quantity} (min: {item.minStock})
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="incoming" className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Riwayat Barang Masuk</CardTitle>
            <Button onClick={() => setShowAddIncoming(!showAddIncoming)}>
              {showAddIncoming ? 'Batal' : 'Catat Barang Masuk'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {showAddIncoming && (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                <div>
                  <Label>Pilih Produk:</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    value={incomingData.itemId}
                    onChange={(e) =>
                      setIncomingData({ ...incomingData, itemId: e.target.value })
                    }
                  >
                    <option value="">Pilih produk...</option>
                    {inventory.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  type="number"
                  placeholder="Jumlah"
                  value={incomingData.quantity}
                  onChange={(e) =>
                    setIncomingData({
                      ...incomingData,
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <Input
                  type="number"
                  placeholder="Harga pokok (Rp)"
                  value={incomingData.cost}
                  onChange={(e) =>
                    setIncomingData({
                      ...incomingData,
                      cost: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <Input
                  type="date"
                  value={incomingData.expiryDate}
                  onChange={(e) =>
                    setIncomingData({
                      ...incomingData,
                      expiryDate: e.target.value,
                    })
                  }
                />
                <Button onClick={handleAddIncoming} className="w-full">
                  Catat Barang Masuk
                </Button>
              </div>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Harga Pokok</TableHead>
                    <TableHead>Exp Date</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomingGoods.slice().reverse().map((good) => {
                    const item = inventory.find((i) => i.id === good.itemId)
                    return (
                      <TableRow key={good.id}>
                        <TableCell>{item?.name || 'Produk dihapus'}</TableCell>
                        <TableCell>{good.quantity}</TableCell>
                        <TableCell>
                          Rp {good.cost.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell>
                          {new Date(good.expiryDate).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell>
                          {new Date(good.timestamp).toLocaleDateString('id-ID')}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {incomingGoods.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada pencatatan barang masuk
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
