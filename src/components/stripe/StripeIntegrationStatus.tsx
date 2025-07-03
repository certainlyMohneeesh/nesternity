'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useStripeConfig } from '@/hooks/useStripe'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export function StripeIntegrationStatus() {
  const { publishableKey, isConfigured } = useStripeConfig()

  const statusItems = [
    {
      label: 'Stripe Publishable Key',
      status: !!publishableKey,
      value: publishableKey ? '✓ Configured' : '✗ Missing',
    },
    {
      label: 'Stripe Secret Key',
      status: !!process.env.STRIPE_SECRET_KEY,
      value: process.env.STRIPE_SECRET_KEY ? '✓ Configured' : '✗ Missing',
    },
    {
      label: 'Webhook Secret',
      status: !!process.env.STRIPE_WEBHOOK_SECRET,
      value: process.env.STRIPE_WEBHOOK_SECRET ? '✓ Configured' : '✗ Missing',
    },
    {
      label: 'Overall Integration',
      status: isConfigured,
      value: isConfigured ? '✓ Ready' : '✗ Not Ready',
    },
  ]

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    )
  }

  const getStatusBadge = (status: boolean) => {
    return (
      <Badge variant={status ? 'default' : 'destructive'}>
        {status ? 'OK' : 'Error'}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isConfigured ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-500" />
          )}
          Stripe Integration Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {statusItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(item.status)}
                <span className="font-medium">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{item.value}</span>
                {getStatusBadge(item.status)}
              </div>
            </div>
          ))}
        </div>

        {!isConfigured && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Setup Required
              </span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Please configure your Stripe environment variables to enable payment processing.
              See STRIPE_SETUP.md for detailed instructions.
            </p>
          </div>
        )}

        {isConfigured && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Ready for Payments
              </span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Stripe is properly configured. You can now process payments and manage subscriptions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
