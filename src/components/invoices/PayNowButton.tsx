'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCard, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { useStripeConfig } from '@/hooks/useStripe'
import { supabase } from '@/lib/supabase'

interface PayNowButtonProps {
  invoiceId: string
  status: string
  amount: number
  currency: string
  disabled?: boolean
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'secondary'
}

export function PayNowButton({
  invoiceId,
  status,
  amount,
  currency,
  disabled = false,
  size = 'default',
  variant = 'default'
}: PayNowButtonProps) {
  const [loading, setLoading] = useState(false)
  const { isConfigured } = useStripeConfig()

  const handlePayNow = async () => {
    if (status === 'PAID') {
      toast.info('This invoice has already been paid')
      return
    }

    if (!isConfigured) {
      toast.error('Payment processing is temporarily unavailable')
      return
    }

    setLoading(true)
    try {
      // Get auth session for making authenticated requests
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Authentication required')
        setLoading(false)
        return
      }

      const response = await fetch(`/api/invoices/${invoiceId}/payment-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create payment link')
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
      disabled={disabled || loading || isPaid || isCancelled || !isConfigured}
      size={size}
      variant={isPaid ? 'outline' : variant}
      className={`gap-2 ${isPaid ? 'opacity-50' : ''}`}
      title={!isConfigured ? 'Payment processing unavailable' : undefined}
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
      ) : !isConfigured ? (
        <>
          <CreditCard className="w-4 h-4" />
          Payment Unavailable
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4" />
          <span className="flex items-center gap-1">
            Pay Now
            <span className="ml-2 px-2 py-0.5 text-xs rounded bg-yellow-200 text-yellow-800 font-semibold">Coming Soon</span>
          </span>
          <span className="ml-2 text-muted-foreground">
            ({currency} {amount.toFixed(2)})
          </span>
          <ExternalLink className="w-3 h-3" />
        </>
      )}
    </Button>
  )
}
