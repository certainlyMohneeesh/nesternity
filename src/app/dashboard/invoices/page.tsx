'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DownloadInvoiceButton } from '@/components/invoices/DownloadButton'
import InvoiceForm from '@/components/invoices/InvoiceForm'
import { toast } from 'sonner'
import { Plus, Eye, FileText } from 'lucide-react'

interface Invoice {
  id: string
  invoiceNumber: string
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  dueDate: string
  issuedDate: string
  pdfUrl?: string | null
  taxRate: number
  discount: number
  currency: string
  notes?: string
  client: {
    id: string
    name: string
    email: string
  }
  items: Array<{
    id: string
    description: string
    quantity: number
    rate: number
    total: number
  }>
}

interface Client {
  id: string
  name: string
  email: string
}

export default function InvoiceHistoryPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)

  const fetchInvoices = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      
      const response = await fetch(`/api/invoices?${params}`)
      if (response.ok) {
        const data = await response.json()
        setInvoices(data)
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
      toast.error('Failed to fetch invoices')
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  useEffect(() => {
    fetchInvoices()
    fetchClients()
  }, [statusFilter])

  const getStatusVariant = (status: Invoice['status']) => {
    switch (status) {
      case 'PAID':
        return 'default'
      case 'OVERDUE':
        return 'destructive'
      case 'CANCELLED':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const calculateTotal = (invoice: Invoice) => {
    const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0)
    const taxAmount = subtotal * (invoice.taxRate / 100)
    const discountAmount = subtotal * (invoice.discount / 100)
    return subtotal + taxAmount - discountAmount
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    fetchInvoices()
  }

  if (loading) {
    return <div className="p-6">Loading invoices...</div>
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Invoice History</h1>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <InvoiceForm
              clients={clients}
              onSuccess={handleFormSuccess}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
            <p className="text-gray-600 mb-4">Start by creating your first invoice</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {invoices.map((invoice: Invoice) => (
            <Card key={invoice.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{invoice.invoiceNumber}</h3>
                      <Badge variant={getStatusVariant(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </div>
                    <p className="text-gray-600">
                      <strong>Client:</strong> {invoice.client.name} ({invoice.client.email})
                    </p>
                    <p className="text-gray-600">
                      <strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600">
                      <strong>Issued:</strong> {new Date(invoice.issuedDate).toLocaleDateString()}
                    </p>
                    <p className="text-lg font-semibold">
                      Total: {invoice.currency} {calculateTotal(invoice).toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <DownloadInvoiceButton
                      pdfUrl={invoice.pdfUrl}
                      invoiceNumber={invoice.invoiceNumber}
                    />
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>

                {invoice.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold mb-2">Items:</h4>
                    <div className="space-y-1">
                      {invoice.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.description} (x{item.quantity})</span>
                          <span>{invoice.currency} {item.total.toFixed(2)}</span>
                        </div>
                      ))}
                      {invoice.items.length > 3 && (
                        <p className="text-sm text-gray-500">
                          +{invoice.items.length - 3} more items
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
