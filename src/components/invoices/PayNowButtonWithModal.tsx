'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PaymentModal } from './PaymentModal'
import { CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { useStripeConfig } from '@/hooks/useStripe'
import { supabase } from '@/lib/supabase'

interface PayNowButtonWithModalProps {
  invoiceId: string
  invoiceNumber: string
  status: string
  amount: number
  currency: string
  clientName: string
  disabled?: boolean
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'secondary'
  showModal?: boolean // Option to show modal or redirect directly
}

export function PayNowButtonWithModal({
  invoiceId,
  invoiceNumber,
  status,
  amount,
  currency,
  clientName,
  disabled = false,
  size = 'default',
  variant = 'default',
  showModal = true
}: PayNowButtonWithModalProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false)
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

    if (showModal) {
      setShowPaymentModal(true)
    } else {
      // Direct redirect to Stripe checkout
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
        window.location.href = checkoutUrl
      } catch (error) {
        console.error('Error creating payment link:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to create payment link')
      } finally {
        setLoading(false)
      }
    }
  }

  const handlePaymentSuccess = () => {
    // Refresh the page or update the invoice status
    window.location.reload()
  }

  const isPaid = status === 'PAID'
  const isCancelled = status === 'CANCELLED'

  return (
    <>
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
            Pay Now ({currency} {amount.toFixed(2)})
          </>
        )}
      </Button>

      <PaymentModal
        invoiceId={invoiceId}
        invoiceNumber={invoiceNumber}
        amount={amount}
        currency={currency}
        clientName={clientName}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
    </>
  )
}
