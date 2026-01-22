'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { usePOS, Customer, PaymentHistory } from './pos-context'
import { Trash2, MessageCircle, Plus, TrendingDown } from 'lucide-react'

export default function DigitalCashbook() {
  const { customers, paymentHistory, addCustomer, updateCustomer, addPayment } = usePOS()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState<string | null>(null)
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone: '',
    notes: '',
  })
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    notes: '',
  })

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  )

  const customersWithDebt = filteredCustomers.filter((c) => c.debt > 0)

  const handleAddCustomer = () => {
    if (newCustomerData.name && newCustomerData.phone) {
      const customer: Customer = {
        id: `CUST-${Date.now()}`,
        name: newCustomerData.name,
        phone: newCustomerData.phone,
        debt: 0,
        lastTransaction: new Date().toISOString(),
        notes: newCustomerData.notes,
      }
      addCustomer(customer)
      setNewCustomerData({ name: '', phone: '', notes: '' })
      setShowAddCustomer(false)
      alert('Pelanggan berhasil ditambahkan')
    }
  }

  const handleAddDebt = (customerId: string) => {
    if (paymentData.amount > 0) {
      const payment: PaymentHistory = {
        id: '',
        customerId,
        amount: paymentData.amount,
        type: 'debt',
        timestamp: new Date().toISOString(),
        notes: paymentData.notes,
      }
      addPayment(payment)
      setPaymentData({ amount: 0, notes: '' })
      setShowAddPayment(null)
      alert('Utang berhasil dicatat')
    }
  }

  const handlePayDebt = (customerId: string) => {
    if (paymentData.amount > 0) {
      const payment: PaymentHistory = {
        id: '',
        customerId,
        amount: paymentData.amount,
        type: 'payment',
        timestamp: new Date().toISOString(),
        notes: paymentData.notes,
      }
      addPayment(payment)
      setPaymentData({ amount: 0, notes: '' })
      setShowAddPayment(null)
      alert('Pembayaran berhasil dicatat')
    }
  }

  const handleSendToWhatsApp = (customer: Customer) => {
    const debtText = encodeURIComponent(
      `Halo ${customer.name},\n\n` +
      `Tagihan Anda: Rp ${customer.debt.toLocaleString('id-ID')}\n` +
      `Mohon segera dilunasi.\n\n` +
      `Terima kasih.`
    )
    window.open(`https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${debtText}`)
  }

  const getCustomerPaymentHistory = (customerId: string) => {
    return paymentHistory.filter((p) => p.customerId === customerId).slice().reverse()
  }

  const totalDebt = customersWithDebt.reduce((sum, c) => sum + c.debt, 0)

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview">Daftar Pelanggan</TabsTrigger>
        <TabsTrigger value="debt">Pelanggan Berutang</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Manajemen Pelanggan</CardTitle>
            <Button onClick={() => setShowAddCustomer(!showAddCustomer)}>
              {showAddCustomer ? 'Batal' : 'Tambah Pelanggan'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {showAddCustomer && (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                <Input
                  placeholder="Nama pelanggan"
                  value={newCustomerData.name}
                  onChange={(e) =>
                    setNewCustomerData({ ...newCustomerData, name: e.target.value })
                  }
                />
                <Input
                  placeholder="Nomor WhatsApp (6281234567890)"
                  value={newCustomerData.phone}
                  onChange={(e) =>
                    setNewCustomerData({ ...newCustomerData, phone: e.target.value })
                  }
                />
                <Input
                  placeholder="Catatan (opsional)"
                  value={newCustomerData.notes}
                  onChange={(e) =>
                    setNewCustomerData({ ...newCustomerData, notes: e.target.value })
                  }
                />
                <Button onClick={handleAddCustomer} className="w-full">
                  Simpan Pelanggan
                </Button>
              </div>
            )}

            <Input
              placeholder="Cari pelanggan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Total Utang</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${
                            customer.debt > 0
                              ? 'text-destructive'
                              : 'text-green-600'
                          }`}
                        >
                          Rp {customer.debt.toLocaleString('id-ID')}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {customer.notes || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowAddPayment(customer.id)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          {customer.debt > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendToWhatsApp(customer)}
                              className="gap-1"
                            >
                              <MessageCircle className="h-4 w-4 text-green-600" />
                              Tagihan
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredCustomers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada pelanggan
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Modal */}
        {showAddPayment && (
          <Card className="border-primary">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {customers.find((c) => c.id === showAddPayment)?.name}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddPayment(null)}
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Utang saat ini:</Label>
                <p className="text-2xl font-bold text-destructive">
                  Rp{' '}
                  {customers
                    .find((c) => c.id === showAddPayment)
                    ?.debt.toLocaleString('id-ID')}
                </p>
              </div>

              <Input
                type="number"
                placeholder="Jumlah (Rp)"
                value={paymentData.amount}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
              />

              <Input
                placeholder="Catatan"
                value={paymentData.notes}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    notes: e.target.value,
                  })
                }
              />

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleAddDebt(showAddPayment)}
                >
                  Tambah Utang
                </Button>
                <Button
                  onClick={() => handlePayDebt(showAddPayment)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Bayar Utang
                </Button>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Riwayat Pembayaran:</h4>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {getCustomerPaymentHistory(showAddPayment).map((payment) => (
                    <div
                      key={payment.id}
                      className={`p-2 rounded-lg text-sm ${
                        payment.type === 'debt'
                          ? 'bg-red-50 text-red-900'
                          : 'bg-green-50 text-green-900'
                      }`}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">
                          {payment.type === 'debt' ? 'Utang' : 'Bayar'}:
                        </span>
                        <span>
                          Rp{' '}
                          {payment.amount.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="text-xs opacity-75">
                        {new Date(payment.timestamp).toLocaleDateString(
                          'id-ID'
                        )}{' '}
                        {new Date(payment.timestamp).toLocaleTimeString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="debt" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-500" />
              Total Piutang: Rp{' '}
              {totalDebt.toLocaleString('id-ID')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customersWithDebt.length === 0 ? (
              <Alert>
                <AlertDescription>Tidak ada pelanggan yang berutang</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {customersWithDebt.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {customer.phone}
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-xl font-bold text-destructive">
                        Rp {customer.debt.toLocaleString('id-ID')}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendToWhatsApp(customer)}
                        className="gap-1 whitespace-nowrap"
                      >
                        <MessageCircle className="h-4 w-4 text-green-600" />
                        Kirim Tagihan
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
