# Razorpay Integration Guide

## Overview

This guide provides complete instructions for integrating Razorpay payment links into the Nesternity invoice system, replacing the existing Stripe integration.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Migration](#database-migration)
4. [Configuration](#configuration)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Webhook Setup](#webhook-setup)

## Prerequisites

- Razorpay Account (Sign up at https://razorpay.com)
- Access to Razorpay Dashboard
- Database access for running migrations
- Node.js 18+ and pnpm

## Environment Setup

### 1. Razorpay Credentials

Add the following environment variables to your `.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx          # From Razorpay Dashboard > Settings > API Keys
RAZORPAY_KEY_SECRET=your_razorpay_key_secret     # Keep this secret and secure
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret      # From Razorpay Dashboard > Webhooks
```

### 2. Getting Razorpay Credentials

#### Test Mode (Development)
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Switch to "Test Mode" in the top-right corner
3. Navigate to **Settings** → **API Keys**
4. Click "Generate Test Key"
5. Copy the **Key ID** (starts with `rzp_test_`) and **Key Secret**

#### Live Mode (Production)
1. Complete KYC verification on Razorpay
2. Switch to "Live Mode"
3. Navigate to **Settings** → **API Keys**
4. Click "Generate Live Key"
5. Copy the **Key ID** (starts with `rzp_live_`) and **Key Secret**

⚠️ **Security Note**: Never commit your Key Secret to version control!

### 3. Webhook Secret

1. In Razorpay Dashboard, go to **Settings** → **Webhooks**
2. Click "Add New Webhook"
3. Enter your webhook URL: `https://yourdomain.com/api/razorpay/webhook`
4. Select the following events:
   - `payment_link.paid`
   - `payment_link.cancelled`
   - `payment_link.expired`
   - `payment_link.partially_paid`
5. Copy the **Webhook Secret** shown after saving

## Database Migration

### Step 1: Generate Prisma Migration

Run the following commands to create and apply the database migration:

```bash
# Generate Prisma client with new models
pnpm prisma generate

# Create a new migration
pnpm prisma migrate dev --name add_razorpay_integration

# Or for production deployment
pnpm prisma migrate deploy
```

### Step 2: Verify Migration

The migration adds the following:

**Invoice Model Updates:**
- `razorpayPaymentLinkId` - Stores Razorpay payment link ID
- `razorpayPaymentLinkUrl` - Stores the short URL for payment
- `razorpayPaymentLinkStatus` - Tracks payment link status
- `razorpayPaymentId` - Stores successful payment ID
- `razorpayOrderId` - Stores associated order ID

**New PaymentSettings Model:**
- User-specific Razorpay credentials
- Bank account details
- Business information (GST, PAN, etc.)
- Address information

## Configuration

### User-Level Razorpay Setup

Users can configure Razorpay in two ways:

#### Option 1: Global Configuration (Environment Variables)
For single-user or admin-managed setups, use environment variables as shown above.

#### Option 2: Per-User Configuration (Recommended for SaaS)
Each user can configure their own Razorpay account:

1. Navigate to **Settings** → **Payments** tab
2. Enable "Razorpay Payments"
3. Enter Razorpay API credentials
4. Fill in business and bank details
5. Save settings

This allows freelancers to receive payments directly to their own Razorpay account.

## Testing

### Unit Tests

Create a test file to verify Razorpay integration:

```typescript
// tests/razorpay.test.ts
import { createPaymentLink, verifyWebhookSignature } from '@/lib/razorpay';

describe('Razorpay Integration', () => {
  it('should create payment link', async () => {
    const paymentLink = await createPaymentLink({
      amount: 100000, // ₹1000 in paise
      currency: 'INR',
      description: 'Test Invoice',
      customer: {
        name: 'Test Customer',
        email: 'customer@example.com',
      },
      reference_id: 'test-invoice-123',
    });

    expect(paymentLink).toBeDefined();
    expect(paymentLink.short_url).toBeTruthy();
  });

  it('should verify webhook signature', () => {
    const body = '{"event":"payment_link.paid"}';
    const signature = 'generated-signature';
    const secret = 'test-secret';

    const isValid = verifyWebhookSignature(body, signature, secret);
    expect(typeof isValid).toBe('boolean');
  });
});
```

### Integration Testing

Test the complete flow:

1. **Create Invoice with Payment Link**
   ```bash
   curl -X POST http://localhost:3000/api/invoices \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "invoiceNumber": "INV-001",
       "clientId": "client-id",
       "dueDate": "2025-12-31",
       "currency": "INR",
       "enablePaymentLink": true,
       "items": [{
         "description": "Test Service",
         "quantity": 1,
         "rate": 1000
       }]
     }'
   ```

2. **Verify Payment Link Generation**
   - Check the response for `razorpayPaymentLinkUrl`
   - Visit the URL to see the payment page

3. **Test Webhook** (using Razorpay test card)
   - Make a test payment
   - Verify webhook is received
   - Check invoice status is updated to PAID

### Test Mode Transactions

Razorpay provides test cards for simulation:

- **Successful Payment**: `4111 1111 1111 1111`
- **Failed Payment**: `4000 0000 0000 0002`
- CVV: Any 3 digits
- Expiry: Any future date

## Deployment

### Vercel Deployment

1. Add environment variables in Vercel dashboard:
   ```
   RAZORPAY_KEY_ID
   RAZORPAY_KEY_SECRET
   RAZORPAY_WEBHOOK_SECRET
   ```

2. Deploy using:
   ```bash
   vercel --prod
   ```

3. Run migrations on production database:
   ```bash
   pnpm prisma migrate deploy
   ```

### Railway/Render Deployment

1. Set environment variables in platform dashboard
2. Ensure database migrations run during build:
   ```json
   // package.json
   {
     "scripts": {
       "build": "prisma generate && prisma migrate deploy && next build"
     }
   }
   ```

## Webhook Setup

### Ngrok (for local testing)

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Use the HTTPS URL for webhook configuration
# Example: https://abc123.ngrok.io/api/razorpay/webhook
```

### Production Webhook URL

```
https://yourdomain.com/api/razorpay/webhook
```

### Webhook Events to Enable

In Razorpay Dashboard → Settings → Webhooks, enable:

- ✅ `payment_link.paid` - Payment successful
- ✅ `payment_link.cancelled` - Payment link cancelled
- ✅ `payment_link.expired` - Payment link expired
- ✅ `payment_link.partially_paid` - Partial payment received

### Webhook Security

The webhook handler automatically:
- Verifies Razorpay signature using HMAC SHA256
- Rejects unauthorized requests
- Updates invoice status based on events
- Logs all webhook activities

## Features

### Payment Link Features

- **Automatic Generation**: Payment links are created when invoices are marked for payment
- **Multiple Payment Methods**: UPI, Cards, Net Banking, Wallets
- **Email Notifications**: Automatic email sent to customer
- **SMS Reminders**: Optional SMS notifications (if phone number provided)
- **Custom Callbacks**: Redirects to success page after payment
- **Expiry Management**: Links automatically expire after due date

### Invoice Features

- **Dual Payment System**: Supports both Razorpay (priority) and Stripe (fallback)
- **Real-time Status Updates**: Webhook updates invoice status immediately
- **Payment Tracking**: Stores payment ID and order ID for reconciliation
- **Manual Override**: Admin can manually mark as paid if needed

## Troubleshooting

### Common Issues

1. **Payment Link Not Generated**
   - Check Razorpay credentials are correct
   - Verify `enableRazorpay` is true in payment settings
   - Check server logs for API errors

2. **Webhook Not Received**
   - Verify webhook URL is publicly accessible
   - Check webhook secret matches environment variable
   - Review Razorpay webhook logs in dashboard

3. **Invoice Status Not Updating**
   - Verify webhook signature is valid
   - Check database for invoice with matching payment link ID
   - Review server logs for errors

### Debug Mode

Enable detailed logging:

```typescript
// Set in .env.local
DEBUG=razorpay:*
LOG_LEVEL=debug
```

## Security Best Practices

1. **Never expose secrets**
   - Store all credentials in environment variables
   - Use `.env.local` for local development
   - Add `.env*.local` to `.gitignore`

2. **Webhook verification**
   - Always verify webhook signatures
   - Reject unsigned requests
   - Log suspicious activities

3. **User data protection**
   - Encrypt sensitive payment settings
   - Use HTTPS for all API calls
   - Implement rate limiting

4. **Access control**
   - Users can only access their own payment settings
   - Validate user authorization for all API endpoints
   - Audit payment-related activities

## Migration from Stripe

### Coexistence Mode

The current implementation supports both Stripe and Razorpay:

1. If user has Razorpay configured → Use Razorpay
2. If Razorpay not configured → Fall back to Stripe
3. Existing Stripe invoices continue to work

### Complete Migration

To fully migrate from Stripe to Razorpay:

1. Configure Razorpay for all users
2. Update existing invoices (optional)
3. Remove Stripe dependencies:
   ```bash
   pnpm remove @stripe/stripe-js @stripe/react-stripe-js stripe
   ```
4. Delete Stripe-related files

## Support

For issues or questions:
- Razorpay Documentation: https://razorpay.com/docs/
- Razorpay Support: https://razorpay.com/support/
- Community Forum: https://discuss.razorpay.com/

## Changelog

### v1.0.0 (Initial Release)
- ✅ Razorpay payment link generation
- ✅ Webhook event handling
- ✅ User-specific payment settings
- ✅ Bank account management
- ✅ Business details configuration
- ✅ Dual payment system (Razorpay + Stripe)
- ✅ Real-time payment status updates
- ✅ Comprehensive error handling

## License

This integration is part of the Nesternity project.
