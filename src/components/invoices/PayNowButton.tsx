'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCard, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface PayNowButtonProps {
  invoiceId: string
  invoiceNumber: string
  status: string
  amount: number
  currency: string
  disabled?: boolean
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'secondary'
}

export function PayNowButton({
  invoiceId,
  invoiceNumber,
  status,
  amount,
  currency,
  disabled = false,
  size = 'default',
  variant = 'default'
}: PayNowButtonProps) {
  const [loading, setLoading] = useState(false)

  const handlePayNow = async () => {
    if (status === 'PAID') {
      toast.info('This invoice has already been paid')
      return
    }

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
      
      // Redirect to Stripe checkout
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Error creating payment link:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create payment link')
    } finally {
      setLoading(false)
    }
  }

  const isPaid = status === 'PAID'
  const isCancelled = status === 'CANCELLED'

  return (
    <Button
      onClick={handlePayNow}
      disabled={disabled || loading || isPaid || isCancelled}
      size={size}
      variant={isPaid ? 'outline' : variant}
      className={`gap-2 ${isPaid ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Creating Payment Link...
        </>
      ) : isPaid ? (
        <>
          <CreditCard className="w-4 h-4" />
          Paid
        </>
      ) : isCancelled ? (
        <>
          <CreditCard className="w-4 h-4" />
          Cancelled
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4" />
          Pay Now ({currency} {amount.toFixed(2)})
          <ExternalLink className="w-3 h-3" />
        </>
      )}
    </Button>
  )
}
