'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

// Dynamically import the PDF client component to avoid SSR issues
const InvoicePDFClient = dynamic(
  () => import('@/components/pdf/InvoicePDFClient').then(mod => ({ default: mod.InvoicePDFClient })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading PDF components...</span>
        </div>
      </div>
    )
  }
)

// Sample invoice data for demonstration
const sampleInvoice = {
  id: 'demo-invoice-123',
  invoiceNumber: 'INV-2025-001',
  createdAt: new Date('2025-01-15'),
  dueDate: new Date('2025-02-15'),
  notes: 'Thank you for your business! Payment terms: Net 30 days. Late payments may incur additional charges.',
  taxRate: 10,
  discount: 5,
  currency: 'USD',
  client: {
    name: 'Acme Corporation',
    email: 'billing@acme.com',
    company: 'Acme Corp.',
    address: '123 Business Ave, Suite 100\nNew York, NY 10001\nUnited States'
  },
  items: [
    {
      id: '1',
      description: 'Website Development Services',
      quantity: 1,
      rate: 5000,
      total: 5000
    },
    {
      id: '2',
      description: 'SEO Optimization',
      quantity: 3,
      rate: 500,
      total: 1500
    },
    {
      id: '3',
      description: 'Monthly Maintenance (6 months)',
      quantity: 6,
      rate: 200,
      total: 1200
    }
  ]
}

export default function PDFDemoPage() {
  // Calculate totals for display
  const subtotal = sampleInvoice.items.reduce((sum, item) => sum + item.total, 0)
  const discountAmount = subtotal * (sampleInvoice.discount! / 100)
  const taxAmount = (subtotal - discountAmount) * (sampleInvoice.taxRate! / 100)
  const total = subtotal - discountAmount + taxAmount

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">PDF Generation Demo</h1>
        <p className="text-xl text-muted-foreground">
          Demonstrating React PDF generation with HTML fallback
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant="default">React PDF</Badge>
          <Badge variant="secondary">HTML Fallback</Badge>
          <Badge variant="outline">Supabase Upload</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Invoice Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Preview</CardTitle>
            <CardDescription>
              Sample invoice data that will be used to generate the PDF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Invoice Header */}
            <div className="text-center border-b pb-4">
              <h2 className="text-2xl font-bold text-primary">INVOICE</h2>
              <p className="text-lg font-semibold">#{sampleInvoice.invoiceNumber}</p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Issue Date</p>
                <p className="font-semibold">{sampleInvoice.createdAt.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-semibold">{sampleInvoice.dueDate.toLocaleDateString()}</p>
              </div>
            </div>

            {/* Client Info */}
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-semibold text-primary mb-2">BILL TO</p>
              <p className="font-semibold">{sampleInvoice.client.name}</p>
              <p className="text-sm text-muted-foreground">{sampleInvoice.client.company}</p>
              <p className="text-sm text-muted-foreground">{sampleInvoice.client.email}</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {sampleInvoice.client.address}
              </p>
            </div>

            {/* Items */}
            <div>
              <p className="font-semibold mb-3">Items</p>
              <div className="space-y-2">
                {sampleInvoice.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <div className="flex-1">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} × ${item.rate.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold">${item.total.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount ({sampleInvoice.discount}%):</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({sampleInvoice.taxRate}%):</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Notes */}
            {sampleInvoice.notes && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-semibold mb-2">Notes</p>
                <p className="text-sm text-muted-foreground">{sampleInvoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PDF Generation Controls */}
        <Card>
          <CardHeader>
            <CardTitle>PDF Generation</CardTitle>
            <CardDescription>
              Multiple approaches to generating and downloading PDFs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InvoicePDFClient invoice={sampleInvoice} showPreview={false} />
          </CardContent>
        </Card>
      </div>

      {/* Implementation Details */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Details</CardTitle>
          <CardDescription>
            How the PDF generation system works
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-primary">React PDF</h3>
              <p className="text-sm text-muted-foreground">
                Uses @react-pdf/renderer to generate PDFs from React components. 
                Works best in browser environments. Provides pixel-perfect layouts.
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="default" className="text-xs">Client-side</Badge>
                <Badge variant="secondary" className="text-xs">High Quality</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-primary">HTML Fallback</h3>
              <p className="text-sm text-muted-foreground">
                Generates styled HTML that can be converted to PDF using browser print 
                or Puppeteer. More reliable in server environments.
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="default" className="text-xs">Server-side</Badge>
                <Badge variant="secondary" className="text-xs">Reliable</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-primary">Supabase Upload</h3>
              <p className="text-sm text-muted-foreground">
                Automatically uploads generated PDFs to Supabase Storage with 
                public URLs for sharing and long-term storage.
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="default" className="text-xs">Cloud Storage</Badge>
                <Badge variant="secondary" className="text-xs">Persistent</Badge>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-3">Features</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">Multiple download options</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">Live PDF preview</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">Automatic fallbacks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">Error handling</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">Professional styling</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">Tax & discount support</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">Cloud storage integration</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">Type-safe implementation</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-3">API Integration</h3>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm mb-2">Server-side PDF generation endpoint:</p>
              <code className="text-sm bg-background px-2 py-1 rounded">
                GET /api/invoices/[id]/pdf
              </code>
              <p className="text-sm mt-2 text-muted-foreground">
                Authenticated endpoint that generates and returns PDF files with proper headers for download.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
