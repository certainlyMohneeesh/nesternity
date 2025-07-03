'use client'

import React, { createContext, useContext } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { stripePublishableKey } from '@/lib/stripe'

// Create Stripe promise
const stripePromise = loadStripe(stripePublishableKey)

interface StripeProviderProps {
  children: React.ReactNode
  options?: {
    appearance?: {
      theme?: 'stripe' | 'night' | 'flat'
      variables?: Record<string, string>
    }
    clientSecret?: string
  }
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ 
  children, 
  options = {} 
}) => {
  const defaultOptions = {
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#0070f3',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '6px',
      },
    },
    ...options,
  }

  return (
    <Elements stripe={stripePromise} options={defaultOptions}>
      {children}
    </Elements>
  )
}

// Context for accessing Stripe configuration
const StripeConfigContext = createContext<{
  publishableKey: string
}>({
  publishableKey: stripePublishableKey,
})

export const useStripeConfig = () => {
  return useContext(StripeConfigContext)
}
