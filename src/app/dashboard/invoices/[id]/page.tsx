'use client'

import { use, useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DownloadInvoiceButton } from '@/components/invoices/DownloadButton'

import { ArrowLeft, Calendar, User, Mail, FileText, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import React from 'react'
import dynamic from 'next/dynamic'

// Dynamic import for InvoicePDFClient to ensure it only loads on client-side
const InvoicePDFClient = dynamic(
  () => import('@/components/pdf/InvoicePDFClient').then(mod => ({ default: mod.InvoicePDFClient })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Loading PDF preview...</p>
        </div>
      </div>
    )
  }
)

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
  enablePaymentLink?: boolean
  paymentUrl?: string | null
  watermarkText?: string | null
  eSignatureUrl?: string | null
  client: {
    id: string
    name: string
    email: string
    company?: string
    address?: string
    phone?: string
  }
  items: Array<{
    id: string
    description: string
    quantity: number
    rate: number
    total: number
  }>
}

export default function InvoiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchInvoice = useCallback(async () => {
    try {
      // Get auth session for making authenticated requests
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Authentication required')
        setLoading(false)
        return
      }

      const response = await fetch(`/api/invoices/${resolvedParams.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setInvoice(data)
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || 'Failed to fetch invoice details')
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
      toast.error('Failed to load invoice details')
    } finally {
      setLoading(false)
    }
  }, [resolvedParams.id])

  useEffect(() => {
    fetchInvoice()
  }, [fetchInvoice])

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

  const calculateSubtotal = () => {
    if (!invoice) return 0
    return invoice.items.reduce((sum, item) => sum + item.total, 0)
  }

  const calculateTax = () => {
    if (!invoice) return 0
    const subtotal = calculateSubtotal()
    return subtotal * (invoice.taxRate / 100)
  }

  const calculateDiscount = () => {
    if (!invoice) return 0
    const subtotal = calculateSubtotal()
    return subtotal * (invoice.discount / 100)
  }

  const calculateTotal = () => {
    if (!invoice) return 0
    const subtotal = calculateSubtotal()
    const tax = calculateTax()
    const discount = calculateDiscount()
    return subtotal + tax - discount
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

  if (!invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-4">Invoice not found</h2>
            <Link href="/dashboard/invoices">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Invoices
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/invoices">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
              <p className="text-gray-600">Invoice Details</p>
            </div>
          </div>
          <Badge variant={getStatusVariant(invoice.status)} className="text-lg px-4 py-2">
            {invoice.status}
          </Badge>
        </div>

        {/* Invoice Overview */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold">{invoice.client.name}</p>
                {invoice.client.company && (
                  <p className="text-gray-600">{invoice.client.company}</p>
                )}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{invoice.client.email}</span>
              </div>
              {invoice.client.phone && (
                <div className="text-gray-600">
                  <strong>Phone:</strong> {invoice.client.phone}
                </div>
              )}
              {invoice.client.address && (
                <div className="text-gray-600">
                  <strong>Address:</strong> {invoice.client.address}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Invoice Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <div>
                  <span className="text-gray-600">Issued:</span>{' '}
                  <span className="font-medium">
                    {new Date(invoice.issuedDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <div>
                  <span className="text-gray-600">Due:</span>{' '}
                  <span className="font-medium">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-600" />
                <div>
                  <span className="text-gray-600">Currency:</span>{' '}
                  <span className="font-medium">{invoice.currency}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Description</th>
                      <th className="text-right py-2">Quantity</th>
                      <th className="text-right py-2">Rate ({invoice.currency})</th>
                      <th className="text-right py-2">Total ({invoice.currency})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-3">{item.description}</td>
                        <td className="text-right py-3">{item.quantity}</td>
                        <td className="text-right py-3">{item.rate.toFixed(2)}</td>
                        <td className="text-right py-3 font-medium">
                          {item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t my-4" />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{invoice.currency} {calculateSubtotal().toFixed(2)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({invoice.discount}%):</span>
                    <span>-{invoice.currency} {calculateDiscount().toFixed(2)}</span>
                  </div>
                )}
                {invoice.taxRate > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({invoice.taxRate}%):</span>
                    <span>{invoice.currency} {calculateTax().toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{invoice.currency} {calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {invoice.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <DownloadInvoiceButton
                invoiceId={invoice.id}
                invoiceNumber={invoice.invoiceNumber}
              />
            </div>
          </CardContent>
        </Card>

        {/* PDF Preview */}
        <Card>
          <CardHeader>
            <CardTitle>PDF Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {typeof window !== 'undefined' && (
              <React.Suspense fallback={
                <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading PDF preview...</p>
                  </div>
                </div>
              }>
                <InvoicePDFClient 
                  invoice={{
                    ...invoice,
                    createdAt: invoice.issuedDate,
                    dueDate: invoice.dueDate,
                    taxRate: invoice.taxRate,
                    discount: invoice.discount,
                    enablePaymentLink: invoice.enablePaymentLink,
                    paymentUrl: invoice.paymentUrl,
                    watermarkText: invoice.watermarkText,
                    eSignatureUrl: invoice.eSignatureUrl
                  }} 
                  showPreview={true}
                />
              </React.Suspense>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
