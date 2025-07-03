'use client'

import { StripeProvider } from '@/components/providers/StripeProvider'
import { PaymentForm } from '@/components/stripe/PaymentForm'
import { StripeIntegrationStatus } from '@/components/stripe/StripeIntegrationStatus'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStripeConfig } from '@/hooks/useStripe'

function PaymentExample() {
  const { publishableKey, isConfigured } = useStripeConfig()

  const handlePaymentSuccess = (paymentIntent: any) => {
    console.log('Payment successful:', paymentIntent)
  }

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error)
  }

  if (!isConfigured) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-4">Stripe Not Configured</h2>
            <p className="text-gray-600">
              Please configure your Stripe keys in environment variables.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <StripeIntegrationStatus />
        
        <Card>
          <CardHeader>
            <CardTitle>Stripe Integration Example</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Configuration Status</h3>
                <p className="text-sm text-gray-600">
                  ✅ Publishable Key: {publishableKey ? 'Configured' : 'Missing'}
                </p>
                <p className="text-sm text-gray-600">
                  ✅ Stripe Integration: {isConfigured ? 'Ready' : 'Not Ready'}
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold">Available Components</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• StripeProvider - Wrapper for Stripe Elements</li>
                  <li>• PaymentForm - Ready-to-use payment form</li>
                  <li>• useStripe - Hook for accessing Stripe instance</li>
                  <li>• useStripeConfig - Hook for configuration</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <StripeProvider>
          <PaymentForm
            amount={99.99}
            currency="USD"
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </StripeProvider>
      </div>
    </div>
  )
}

export default function StripeTestPage() {
  return <PaymentExample />
}
