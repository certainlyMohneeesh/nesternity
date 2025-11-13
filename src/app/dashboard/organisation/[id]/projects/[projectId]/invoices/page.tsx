'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { DownloadInvoiceButton } from '@/components/invoices/DownloadButton'
import InvoiceForm from '@/components/invoices/InvoiceForm'
import { toast } from 'sonner'
import { Plus, Eye, FileText, RefreshCw, Home } from 'lucide-react'
import { getSessionToken } from '@/lib/supabase/client-session'
import Link from 'next/link'
import { InvoiceCard } from '@/components/invoices/InvoiceCard'
import { useRouter } from 'next/navigation'

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

export default function InvoiceHistoryPage() {
  const params = useParams()
  const orgId = params.id as string
  const projectId = params.projectId as string
  
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      console.log('[InvoicesPage] Fetching invoices with filter:', statusFilter)
      
      const params = new URLSearchParams()
      params.append('organisationId', orgId)  // Add organisationId filter
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      
      // Get auth session for making authenticated requests
      const token = await getSessionToken()
      if (!token) {
        console.error('[InvoicesPage] No auth session found')
        toast.error('Authentication required')
        return
      }
      
      const response = await fetch(`/api/invoices?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('[InvoicesPage] Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('[InvoicesPage] Fetched invoices:', data.length)
        setInvoices(data)
      } else {
        const errorData = await response.json()
        console.error('[InvoicesPage] Error response:', errorData)
        toast.error(errorData.error || 'Failed to fetch invoices')
      }
    } catch (error) {
      console.error('[InvoicesPage] Error fetching invoices:', error)
      toast.error('Failed to fetch invoices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
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
    return (
      <div className="flex-1 flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invoices...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">
              <Home className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Invoices</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Manage your regular and recurring invoices
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/organisation/${orgId}/projects/${projectId}/invoices/recurring`}>
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Recurring Invoices
            </Button>
          </Link>
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
                organisationId={orgId}
                onSuccess={handleFormSuccess}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Invoices</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {/* Filter */}
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

          {/* Invoice List */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center min-h-[200px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading invoices...</p>
              </div>
            </div>
          ) : invoices.length === 0 ? (
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
                <InvoiceCard key={invoice.id} invoice={invoice} onStatusChange={fetchInvoices} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
