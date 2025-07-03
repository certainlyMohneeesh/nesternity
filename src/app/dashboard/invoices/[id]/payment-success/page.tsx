'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Download, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  client: {
    name: string
    email: string
  }
  items: Array<{
    description: string
    quantity: number
    rate: number
    total: number
  }>
  taxRate: number
  discount: number
  currency: string
  pdfUrl?: string
}

export default function PaymentSuccessPage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    fetchInvoice()
  }, [params.id])

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setInvoice(data)
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
      toast.error('Failed to load invoice details')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    if (!invoice) return 0
    const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0)
    const taxAmount = subtotal * (invoice.taxRate / 100)
    const discountAmount = subtotal * (invoice.discount / 100)
    return subtotal + taxAmount - discountAmount
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading payment details...</div>
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
              <Button>Return to Invoices</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <Card className="mb-6">
          <CardContent className="text-center py-8">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h1>
            <p className="text-gray-600">
              Your payment has been processed successfully. Thank you for your business!
            </p>
            {sessionId && (
              <p className="text-sm text-gray-500 mt-2">
                Session ID: {sessionId}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{invoice.invoiceNumber}</CardTitle>
                <p className="text-gray-600 mt-1">
                  <strong>Client:</strong> {invoice.client.name}
                </p>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                {invoice.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Items */}
              <div>
                <h3 className="font-semibold mb-3">Items Paid:</h3>
                <div className="space-y-2">
                  {invoice.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b">
                      <div>
                        <span className="font-medium">{item.description}</span>
                        <span className="text-gray-500 ml-2">x{item.quantity}</span>
                      </div>
                      <span className="font-medium">
                        {invoice.currency} {item.total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Paid:</span>
                  <span>{invoice.currency} {calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Link href="/dashboard/invoices">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Invoices
            </Button>
          </Link>
          
          {invoice.pdfUrl && (
            <a href={invoice.pdfUrl} download>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
            </a>
          )}
        </div>

        {/* Next Steps */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-gray-600">
              <li>• You will receive a payment confirmation email shortly</li>
              <li>• Your invoice status has been updated to "PAID"</li>
              <li>• You can download your receipt using the button above</li>
              <li>• For any questions, please contact support</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
