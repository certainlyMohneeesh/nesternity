'use client'

import { useState } from 'react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface PaymentFormProps {
  amount: number
  currency: string
  onSuccess?: (paymentIntent: any) => void
  onError?: (error: string) => void
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  currency,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      toast.error('Stripe has not loaded yet')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      toast.error('Card element not found')
      return
    }

    setProcessing(true)

    try {
      // Create payment intent on the server
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency: currency.toLowerCase(),
        }),
      })

      const { client_secret } = await response.json()

      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
        },
      })

      if (error) {
        toast.error(error.message || 'Payment failed')
        onError?.(error.message || 'Payment failed')
      } else if (paymentIntent.status === 'succeeded') {
        toast.success('Payment successful!')
        onSuccess?.(paymentIntent)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed'
      toast.error(errorMessage)
      onError?.(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 border rounded-lg">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">
              Total: {currency} {amount.toFixed(2)}
            </span>
            <Button
              type="submit"
              disabled={!stripe || processing}
              className="min-w-32"
            >
              {processing ? 'Processing...' : 'Pay Now'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
