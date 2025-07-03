import Stripe from 'stripe'

// Server-side validation (only runs on server)
if (typeof window === 'undefined') {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
}

// Create server-side Stripe instance (only on server)
export const stripe = typeof window === 'undefined' 
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-06-30.basil',
    })
  : null as any // Won't be used on client-side

// Safe client-side exports
export const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

// Client-side Stripe instance (for frontend usage)
export const getStripePromise = () => {
  if (typeof window === 'undefined') {
    return null
  }
  
  return import('@stripe/stripe-js').then((module) => 
    module.loadStripe(stripePublishableKey || '')
  )
}

export const getStripeCustomerId = async (userId: string, email: string) => {
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  })
  return customer.id
}

export const createSubscription = async (customerId: string, priceId: string) => {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  })
  return subscription
}

export const createCheckoutSession = async (
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) => {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
  })
  return session
}

export const createInvoice = async (
  customerId: string,
  amount: number,
  currency: string = 'inr',
  description?: string
) => {
  const invoice = await stripe.invoices.create({
    customer: customerId,
    collection_method: 'send_invoice',
    days_until_due: 30,
    currency,
    description,
    metadata: {
      amount: amount.toString(),
    },
  })

  await stripe.invoiceItems.create({
    customer: customerId,
    invoice: invoice.id,
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    description: description || 'Service Invoice',
  })

  return invoice
}

export const STRIPE_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    priceId: '',
    features: [
      'Up to 3 teams',
      'Up to 10 boards per team',
      'Basic task management',
      'Email support',
    ],
  },
  STANDARD: {
    name: 'Standard',
    price: 999, // ₹999 in paise
    priceId: process.env.STRIPE_STANDARD_PRICE_ID || '',
    features: [
      'Unlimited teams',
      'Unlimited boards',
      'Advanced task management',
      'Client management',
      'Invoice generation',
      'Priority support',
    ],
  },
  PRO: {
    name: 'Pro',
    price: 2999, // ₹2999 in paise
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    features: [
      'Everything in Standard',
      'Advanced analytics',
      'Custom integrations',
      'API access',
      'White-label options',
      'Dedicated support',
    ],
  },
} as const

// Client-side configuration helper
export const getStripeConfig = () => {
  return {
    publishableKey: stripePublishableKey,
    apiVersion: '2025-06-30.basil' as const,
  }
}

// Helper to check if Stripe is properly configured (server-side only)
export const isStripeConfigured = () => {
  if (typeof window !== 'undefined') {
    // Client-side check
    return !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  }
  
  // Server-side check
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET
  )
}
