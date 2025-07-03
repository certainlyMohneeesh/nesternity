'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Eye, FileText, Cloud, Zap } from 'lucide-react'

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

export default function SimplePDFDemoPage() {
  const [showAdvancedDemo, setShowAdvancedDemo] = React.useState(false)
  const [isGenerating, setIsGenerating] = React.useState(false)

  // Calculate totals for display
  const subtotal = sampleInvoice.items.reduce((sum, item) => sum + item.total, 0)
  const discountAmount = subtotal * (sampleInvoice.discount! / 100)
  const taxAmount = (subtotal - discountAmount) * (sampleInvoice.taxRate! / 100)
  const total = subtotal - discountAmount + taxAmount

  const handleServerPDFDownload = async () => {
    setIsGenerating(true)
    try {
      // This would call your API endpoint
      const response = await fetch(`/api/invoices/${sampleInvoice.id}/pdf`, {
        headers: {
          'Authorization': `Bearer your-token-here`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `invoice-${sampleInvoice.invoiceNumber}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        alert('Server PDF generation failed. This is expected in demo mode.')
      }
    } catch (error) {
      console.error('PDF download failed:', error)
      alert('PDF download failed. This is expected in demo mode.')
    } finally {
      setIsGenerating(false)
    }
  }

  const loadAdvancedDemo = async () => {
    setShowAdvancedDemo(true)
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">PDF Generation System Demo</h1>
        <p className="text-xl text-muted-foreground">
          Robust invoice PDF generation with React PDF and HTML fallbacks
        </p>
        <div className="flex justify-center gap-2 flex-wrap">
          <Badge variant="default">React PDF</Badge>
          <Badge variant="secondary">HTML Fallback</Badge>
          <Badge variant="outline">Supabase Upload</Badge>
          <Badge variant="destructive">Server-side API</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Invoice Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Preview
            </CardTitle>
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
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              PDF Generation Options
            </CardTitle>
            <CardDescription>
              Multiple approaches to generating and downloading PDFs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Basic Server Download */}
            <div className="space-y-3">
              <h3 className="font-semibold text-primary">Server-side Generation</h3>
              <p className="text-sm text-muted-foreground">
                Generate PDF on the server using our API endpoint with HTML fallback
              </p>
              <Button
                onClick={handleServerPDFDownload}
                disabled={isGenerating}
                className="w-full flex items-center gap-2"
              >
                <Cloud className="h-4 w-4" />
                {isGenerating ? 'Generating...' : 'Download PDF (Server API)'}
              </Button>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-primary mb-3">Advanced Demo</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Load the full React PDF demo with preview and client-side generation
              </p>
              
              {!showAdvancedDemo ? (
                <Button
                  onClick={loadAdvancedDemo}
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Load Advanced PDF Demo
                </Button>
              ) : (
                <div className="space-y-4">
                  {/* Dynamic import of the full PDF client */}
                  <React.Suspense fallback={
                    <div className="flex items-center justify-center p-8 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span>Loading PDF components...</span>
                      </div>
                    </div>
                  }>
                    <AdvancedPDFDemo invoice={sampleInvoice} />
                  </React.Suspense>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Implementation Details */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Architecture</CardTitle>
          <CardDescription>
            How the robust PDF generation system works
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-primary flex items-center gap-2">
                <FileText className="h-4 w-4" />
                React PDF
              </h3>
              <p className="text-sm text-muted-foreground">
                Uses @react-pdf/renderer to generate PDFs from React components. 
                Works best in browser environments with pixel-perfect layouts.
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="default" className="text-xs">Client-side</Badge>
                <Badge variant="secondary" className="text-xs">High Quality</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-primary flex items-center gap-2">
                <Eye className="h-4 w-4" />
                HTML Fallback
              </h3>
              <p className="text-sm text-muted-foreground">
                Generates styled HTML that can be converted to PDF. More reliable 
                in server environments with consistent cross-browser rendering.
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="default" className="text-xs">Server-side</Badge>
                <Badge variant="secondary" className="text-xs">Reliable</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-primary flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                Supabase Upload
              </h3>
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
            <h3 className="font-semibold mb-3">System Features</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                'Multiple download options',
                'Live PDF preview',
                'Automatic fallbacks',
                'Error handling',
                'Professional styling',
                'Tax & discount support',
                'Cloud storage integration',
                'Type-safe implementation'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-3">API Integration</h3>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm mb-2 font-medium">Server-side PDF generation endpoint:</p>
              <code className="text-sm bg-background px-2 py-1 rounded border">
                GET /api/invoices/[id]/pdf
              </code>
              <p className="text-sm mt-2 text-muted-foreground">
                Authenticated endpoint that generates and returns PDF files with proper headers for download.
                Includes automatic fallback from React PDF to HTML-based generation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Lazy-loaded advanced demo component
const AdvancedPDFDemo = React.lazy(() => 
  import('@/components/pdf/InvoicePDFClient').then(module => ({
    default: ({ invoice }: { invoice: any }) => (
      <div className="border rounded-lg p-4">
        <h4 className="font-semibold mb-3">Advanced PDF Generation</h4>
        <module.InvoicePDFClient invoice={invoice} showPreview={false} />
      </div>
    )
  }))
)
