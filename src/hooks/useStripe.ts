'use client'

import { useStripe as useStripeElements, useElements } from '@stripe/react-stripe-js'
import { stripePublishableKey } from '@/lib/stripe'

// Hook for accessing Stripe instance and elements within StripeProvider
export const useStripe = () => {
  const stripe = useStripeElements()
  const elements = useElements()

  return {
    stripe,
    elements,
    publishableKey: stripePublishableKey,
    isReady: stripe !== null && elements !== null,
  }
}

// Hook for accessing Stripe configuration
export const useStripeConfig = () => {
  return {
    publishableKey: stripePublishableKey,
    isConfigured: !!stripePublishableKey,
  }
}
