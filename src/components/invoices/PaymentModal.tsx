'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PaymentForm } from '@/components/stripe/PaymentForm'
import { CreditCard, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { useStripeConfig } from '@/hooks/useStripe'

interface PaymentModalProps {
  invoiceId: string
  invoiceNumber: string
  amount: number
  currency: string
  clientName: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function PaymentModal({
  invoiceId,
  invoiceNumber,
  amount,
  currency,
  clientName,
  isOpen,
  onClose,
  onSuccess
}: PaymentModalProps) {
  const [useEmbedded, setUseEmbedded] = useState(false)
  const [loading, setLoading] = useState(false)
  const { isConfigured } = useStripeConfig()

  const handleStripeCheckout = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/payment-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create payment link')
      }

      const { checkoutUrl } = await response.json()
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Error creating payment link:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create payment link')
    } finally {
      setLoading(false)
    }
  }

  const handleEmbeddedPaymentSuccess = (paymentIntent: any) => {
    toast.success('Payment successful!')
    onSuccess?.()
    onClose()
  }

  const handleEmbeddedPaymentError = (error: string) => {
    toast.error(error)
  }

  if (!isConfigured) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Unavailable</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Payment processing is temporarily unavailable.
            </p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pay Invoice {invoiceNumber}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Invoice Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Invoice Details</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Invoice:</span>
                <span className="font-medium">{invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Client:</span>
                <span className="font-medium">{clientName}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-medium text-lg">{currency} {amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Options */}
          <div className="space-y-4">
            <h3 className="font-semibold">Choose Payment Method</h3>
            
            {/* Stripe Checkout Option */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Secure Stripe Checkout</h4>
                  <p className="text-sm text-gray-600">
                    Pay securely on Stripe's hosted checkout page
                  </p>
                </div>
                <Button 
                  onClick={handleStripeCheckout}
                  disabled={loading}
                  className="gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  {loading ? 'Creating...' : 'Pay with Stripe'}
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Embedded Payment Option */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium">Pay Here</h4>
                  <p className="text-sm text-gray-600">
                    Enter your card details below
                  </p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setUseEmbedded(!useEmbedded)}
                >
                  {useEmbedded ? 'Hide Form' : 'Show Form'}
                </Button>
              </div>
              
              {useEmbedded && (
                <PaymentForm
                  amount={amount}
                  currency={currency}
                  onSuccess={handleEmbeddedPaymentSuccess}
                  onError={handleEmbeddedPaymentError}
                />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
