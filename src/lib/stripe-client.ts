// Client-side Stripe configuration (safe for browser)
'use client'

export const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

// Client-side Stripe promise
export const getStripePromise = () => {
  if (typeof window === 'undefined') {
    return null
  }
  
  if (!stripePublishableKey) {
    console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
    return null
  }
  
  return import('@stripe/stripe-js').then((module) => 
    module.loadStripe(stripePublishableKey)
  )
}

// Client-side configuration helper
export const getStripeClientConfig = () => {
  return {
    publishableKey: stripePublishableKey,
    isConfigured: !!stripePublishableKey,
  }
}
