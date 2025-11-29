'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer'
import { InvoiceDocument } from '@/components/pdf/InvoiceDocument'
import { Download, Eye } from 'lucide-react'

// Force dynamic rendering to avoid SSR issues with PDFDownloadLink
export const dynamic = 'force-dynamic'

// Sample invoice data for demo
const sampleInvoice = {
    id: 'demo-invoice-001',
    invoiceNumber: 'INV-0001',
    createdAt: new Date('2025-11-29'),
    dueDate: new Date('2025-12-29'),
    status: 'PENDING' as const,
    taxRate: 18,
    discount: 10,
    currency: 'INR',
    notes: 'Payment terms: Net 30 days. Please include invoice number with payment. Thank you for your business!',
    enablePaymentLink: true,
    paymentUrl: 'https://pay.nesternity.com/demo',
    watermarkText: 'SAMPLE',
    eSignatureUrl: null,
    client: {
        id: 'demo-client-001',
        name: 'Mohneesh Naidu',
        email: 'certainlymohneesh@gmail.com',
        company: 'Mohneesh Naidu\'s Organisation',
        address: '123 Tech Street, Innovation District, Bangalore, Karnataka 560001'
    },
    issuedBy: {
        id: 'demo-user-001',
        email: 'hello@nesternity.com',
        displayName: 'Nesternity Team'
    },
    items: [
        {
            id: 'item-1',
            description: 'Website Development - Premium Package',
            quantity: 1,
            rate: 50000,
            total: 50000
        },
        {
            id: 'item-2',
            description: 'UI/UX Design Services',
            quantity: 8,
            rate: 5000,
            total: 40000
        },
        {
            id: 'item-3',
            description: 'Database Setup & Configuration',
            quantity: 1,
            rate: 15000,
            total: 15000
        },
        {
            id: 'item-4',
            description: 'API Integration Services',
            quantity: 5,
            rate: 3000,
            total: 15000
        }
    ]
}

export default function DemoInvoicePage() {
    const [showPreview, setShowPreview] = React.useState(false)
    const [isClient, setIsClient] = React.useState(false)

    React.useEffect(() => {
        setIsClient(true)
    }, [])

    // Calculate totals
    const subtotal = sampleInvoice.items.reduce((sum, item) => sum + item.total, 0)
    const taxAmount = subtotal * (sampleInvoice.taxRate / 100)
    const discountAmount = subtotal * (sampleInvoice.discount / 100)
    const total = subtotal + taxAmount - discountAmount

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="h-6 w-6" />
                            Invoice PDF Demo Preview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            This is a demo page to preview the professional invoice PDF design.
                            Use this to test the PDF layout, styling, and ensure everything looks perfect before sending to clients.
                        </p>
                        <div className="flex gap-4">
                            <Button
                                onClick={() => setShowPreview(!showPreview)}
                                variant={showPreview ? "secondary" : "default"}
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                {showPreview ? 'Hide Preview' : 'Show Preview'}
                            </Button>
                            {isClient && (
                                <PDFDownloadLink
                                    document={<InvoiceDocument invoice={sampleInvoice} />}
                                    fileName="demo-invoice.pdf"
                                >
                                    {({ loading }) => (
                                        <Button variant="outline" disabled={loading}>
                                            <Download className="h-4 w-4 mr-2" />
                                            {loading ? 'Generating PDF...' : 'Download Demo PDF'}
                                        </Button>
                                    )}
                                </PDFDownloadLink>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Sample Data Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sample Invoice Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-semibold">Invoice Number:</p>
                                <p className="text-muted-foreground">{sampleInvoice.invoiceNumber}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Client:</p>
                                <p className="text-muted-foreground">{sampleInvoice.client.name}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Subtotal:</p>
                                <p className="text-muted-foreground">₹{subtotal.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Tax ({sampleInvoice.taxRate}%):</p>
                                <p className="text-muted-foreground">₹{taxAmount.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Discount ({sampleInvoice.discount}%):</p>
                                <p className="text-muted-foreground">-₹{discountAmount.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Total Amount:</p>
                                <p className="text-muted-foreground font-bold text-green-600">
                                    ₹{total.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold">Issue Date:</p>
                                <p className="text-muted-foreground">{sampleInvoice.createdAt.toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Due Date:</p>
                                <p className="text-muted-foreground">{sampleInvoice.dueDate.toLocaleDateString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* PDF Preview */}
                {showPreview && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Live PDF Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden" style={{ height: '800px' }}>
                                {typeof window !== 'undefined' && (
                                    <PDFViewer width="100%" height="100%" showToolbar={true}>
                                        <InvoiceDocument invoice={sampleInvoice} />
                                    </PDFViewer>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Developer Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            <p>
                                <strong>📝 Purpose:</strong> This demo page helps you preview and test the invoice PDF design without creating actual invoices.
                            </p>
                            <p>
                                <strong>🎨 Customization:</strong> Edit the sample data above to test different scenarios, tax rates, discounts, etc.
                            </p>
                            <p>
                                <strong>🖼️ Logo:</strong> Make sure to update the LOGO_URL in <code className="bg-muted px-1 py-0.5 rounded">InvoiceDocument.tsx</code> with your Cloudflare CDN URL.
                            </p>
                            <p>
                                <strong>💳 Payment Link:</strong> The payment button is enabled in this demo to test its appearance.
                            </p>
                            <p>
                                <strong>💡 Access:</strong> Visit this page at <code className="bg-muted px-1 py-0.5 rounded">/demo/invoice</code> anytime during development.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
