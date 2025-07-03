# Stripe Integration Guide

This project includes comprehensive Stripe integration for payment processing, subscriptions, and invoice management.

## Environment Variables Required

Add these environment variables to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key (starts with sk_test_ for test mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key (starts with pk_test_ for test mode)
STRIPE_WEBHOOK_SECRET=whsec_... # Your Stripe webhook secret for verifying webhook signatures

# Subscription Price IDs (from Stripe Dashboard)
STRIPE_STANDARD_PRICE_ID=price_... # Price ID for Standard subscription
STRIPE_PRO_PRICE_ID=price_... # Price ID for Pro subscription
```

## Setup Instructions

1. **Create Stripe Account**: Sign up at [stripe.com](https://stripe.com)

2. **Get API Keys**: 
   - Go to Stripe Dashboard → Developers → API keys
   - Copy "Publishable key" and "Secret key"

3. **Create Products & Prices**:
   - Go to Products in Stripe Dashboard
   - Create products for your subscription tiers
   - Copy the Price IDs for environment variables

4. **Setup Webhooks**:
   - Go to Developers → Webhooks → Add endpoint
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
   - Copy the webhook secret

## Available Components

### Server-side (Backend)

```typescript
import { stripe, isStripeConfigured } from '@/lib/stripe'

// Create checkout session
const session = await stripe.checkout.sessions.create({...})

// Check if Stripe is properly configured
if (isStripeConfigured()) {
  // Proceed with Stripe operations
}
```

### Client-side (Frontend)

```typescript
import { StripeProvider } from '@/components/providers/StripeProvider'
import { PaymentForm } from '@/components/stripe/PaymentForm'
import { useStripe, useStripeConfig } from '@/hooks/useStripe'

// Wrap your app with StripeProvider
<StripeProvider>
  <PaymentForm amount={99.99} currency="USD" />
</StripeProvider>

// Use Stripe in components
const { stripe, elements, isReady } = useStripe()
const { publishableKey, isConfigured } = useStripeConfig()
```

## Available Hooks

### `useStripe()`
Access Stripe instance and elements within StripeProvider.

```typescript
const { stripe, elements, publishableKey, isReady } = useStripe()
```

### `useStripeConfig()`
Get Stripe configuration and status.

```typescript
const { publishableKey, isConfigured } = useStripeConfig()
```

## API Endpoints

### Payment Intent
- **POST** `/api/stripe/create-payment-intent`
- Creates a payment intent for one-time payments

### Invoice Payment Links
- **POST** `/api/invoices/[id]/payment-link`
- Creates Stripe checkout session for invoice payment

### Subscription Management
- **POST** `/api/stripe/subscription`
- Create and manage subscriptions

### Webhooks
- **POST** `/api/stripe/webhook`
- Handles Stripe webhook events

## Features Implemented

### ✅ Invoice Payments
- Pay Now buttons on invoices
- Secure Stripe checkout integration
- Automatic invoice status updates via webhooks
- Payment success/failure handling

### ✅ Subscription Management
- Multiple pricing tiers (Free, Standard, Pro)
- Subscription creation and updates
- Webhook handling for subscription events

### ✅ Security
- Webhook signature verification
- User authentication for all payment operations
- Secure metadata passing

### ✅ Components Ready to Use
- `PaymentForm` - Complete payment form with card input
- `StripeProvider` - Context provider for Stripe
- `PayNowButton` - Invoice payment button
- Various hooks for Stripe integration

## Testing

1. Use Stripe test keys (start with `pk_test_` and `sk_test_`)
2. Use test card numbers:
   - `4242424242424242` - Visa (success)
   - `4000000000000002` - Visa (decline)
   - `4000000000009995` - Visa (insufficient funds)

## Example Usage

Visit `/stripe-test` in your application to see a working example of the Stripe integration.

## Troubleshooting

### Common Issues:

1. **"Stripe has not loaded yet"**
   - Ensure components are wrapped with `StripeProvider`
   - Check publishable key is correctly set

2. **Webhook signature verification failed**
   - Verify `STRIPE_WEBHOOK_SECRET` is correct
   - Ensure webhook URL is correctly configured in Stripe

3. **Payment failed**
   - Check if all required environment variables are set
   - Verify API keys are for the correct mode (test/live)
   - Check browser console for detailed error messages
