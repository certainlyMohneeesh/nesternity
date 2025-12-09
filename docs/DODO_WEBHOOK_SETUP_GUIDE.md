# Dodo Payments Webhook Setup Guide

This guide provides step-by-step instructions for setting up webhook endpoints in Dodo Payments for the Nesternity application.

## Prerequisites

- Active Dodo Payments account
- Access to the Dodo Payments Dashboard
- Deployed application with a public endpoint URL (e.g., `https://yourdomain.com/api/dodo/webhook`)

## Step-by-Step Setup

### 1. Access Webhook Settings

1. Log in to your **Dodo Payments Dashboard**
2. Navigate to **Settings > Webhooks** from the sidebar menu

### 2. Create a New Webhook Endpoint

1. Click the **Add Webhook** button
2. You'll see the webhook creation form

### 3. Configure Endpoint URL

Enter your webhook endpoint URL:
```
https://yourdomain.com/api/dodo/webhook
```

**For Development/Testing:**
- Use a tunneling service like ngrok: `https://your-subdomain.ngrok.io/api/dodo/webhook`
- Or deploy to a staging environment with HTTPS

<Warning>
⚠️ **Important**: Dodo Payments requires HTTPS for webhook endpoints in production. HTTP endpoints will be rejected.
</Warning>

### 4. Select Events to Subscribe

Choose the events your application needs. For Nesternity, select these critical events:

#### **Subscription Events** (Required)
- ✅ `subscription.created` - When a new subscription is created
- ✅ `subscription.updated` - When subscription details change
- ✅ `subscription.cancelled` - When a subscription is cancelled
- ✅ `subscription.expired` - When a subscription expires
- ✅ `subscription.paused` - When a subscription is paused
- ✅ `subscription.resumed` - When a paused subscription resumes

#### **Payment Events** (Required)
- ✅ `payment.created` - When a payment is initiated
- ✅ `payment.succeeded` - When a payment is successful
- ✅ `payment.failed` - When a payment fails
- ✅ `payment.refunded` - When a payment is refunded

#### **Optional Events** (Recommended)
- ⚪ `customer.created` - When a new customer is created
- ⚪ `customer.updated` - When customer details change
- ⚪ `dispute.created` - When a payment dispute is created
- ⚪ `dispute.accepted` - When a dispute is accepted

<Tip>
💡 **Pro Tip**: Only subscribe to events your application actually handles to reduce unnecessary webhook traffic and processing overhead.
</Tip>

### 5. Retrieve Your Webhook Secret

After creating the endpoint:

1. Find your newly created webhook in the list
2. Click on the webhook endpoint to view details
3. Locate the **Secret Key** section
4. Click **Show Secret** to reveal the webhook secret
5. Copy the secret key (it will look like: `whsec_xxxxxxxxxxxxxxxxxxxxxx`)

<Warning>
🔐 **Security Critical**: 
- Never commit the webhook secret to version control
- Never expose it in client-side code
- Store it securely in environment variables
</Warning>

### 6. Add Secret to Your Environment

Add the webhook secret to your `.env` file or environment configuration:

```bash
# .env
DODO_PAYMENTS_WEBHOOK_KEY=whsec_your_actual_webhook_secret_here
```

**For Production:**
- Add the secret to your hosting platform's environment variables (Vercel, Railway, etc.)
- Ensure the variable is encrypted and not logged

### 7. Verify Webhook Configuration

Test your webhook setup:

1. In the Dodo Payments Dashboard, click **Send Test Event**
2. Select an event type (e.g., `subscription.created`)
3. Click **Send Test Webhook**
4. Check your application logs to verify the webhook was received and processed

**Expected Response:**
- Your endpoint should return HTTP `200 OK` within 15 seconds
- Check your database to confirm the test data was processed correctly

### 8. Monitor Webhook Deliveries

In the Dodo Payments Dashboard:

1. Go to **Settings > Webhooks**
2. Click on your webhook endpoint
3. View the **Recent Deliveries** section to see:
   - Delivery status (Success/Failed)
   - Response codes
   - Retry attempts
   - Payload details

## Webhook Secret Rotation

Rotate your webhook secret periodically for enhanced security:

### When to Rotate
- Every 90 days as a security best practice
- Immediately if you suspect the secret has been compromised
- When offboarding team members with access
- After a security incident

### How to Rotate

1. Navigate to **Settings > Webhooks**
2. Click on your webhook endpoint
3. Find the **Secret Key** section
4. Click **Rotate Secret**
5. **Copy the new secret immediately** (you won't see it again)
6. Update your environment variables with the new secret

<Warning>
⚠️ **Grace Period**: After rotation, the old secret remains valid for 24 hours. Update your environment variables within this window to avoid webhook verification failures.
</Warning>

## Troubleshooting

### Common Issues

#### Webhook Returns 401 Unauthorized
**Cause**: Signature verification failed  
**Solution**: 
- Verify `DODO_PAYMENTS_WEBHOOK_KEY` is correctly set
- Check if secret was rotated recently
- Ensure you're using the latest secret from the dashboard

#### Webhook Returns 500 Internal Server Error
**Cause**: Application error during webhook processing  
**Solution**:
- Check application logs for error details
- Verify database connectivity
- Ensure all required fields are present in the payload

#### Webhook Not Receiving Events
**Cause**: Endpoint URL unreachable or events not subscribed  
**Solution**:
- Verify endpoint URL is publicly accessible
- Check if events are selected in webhook configuration
- Test with ngrok if developing locally

#### Webhook Timeouts (15 seconds exceeded)
**Cause**: Endpoint taking too long to respond  
**Solution**:
- Acknowledge webhook immediately with 200 OK
- Process webhook data asynchronously in background job
- Optimize database queries and external API calls

### Testing Locally with ngrok

1. Install ngrok: `npm install -g ngrok` or download from [ngrok.com](https://ngrok.com)
2. Start your local server: `bun run dev`
3. Create tunnel: `ngrok http 3000`
4. Copy the HTTPS URL: `https://xxxx-xx-xx-xxx-xx.ngrok-free.app`
5. Add `/api/dodo/webhook` to the URL
6. Use this as your webhook endpoint in Dodo Payments Dashboard

## Environment Variables Checklist

Ensure these environment variables are set:

```bash
# Dodo Payments API Configuration
NEXT_PUBLIC_DODO_PAYMENTS_BUSINESS_ID=business_xxxxxxxxxxxxx
DODO_PAYMENTS_API_KEY=sk_live_xxxxxxxxxxxxx (or sk_test_ for testing)
DODO_PAYMENTS_WEBHOOK_KEY=whsec_xxxxxxxxxxxxx

# Database (required for webhook processing)
DATABASE_URL=postgresql://...

# Application URL (for webhook return URLs)
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

## Security Best Practices

1. **Always Verify Signatures**: Never process webhooks without signature verification
2. **Use HTTPS**: Webhooks must be sent to HTTPS endpoints in production
3. **Implement Idempotency**: Handle duplicate webhook deliveries gracefully using idempotency keys
4. **Rate Limiting**: Implement rate limiting on your webhook endpoint to prevent abuse
5. **Logging**: Log all webhook events with payload and response details for debugging
6. **Error Handling**: Return appropriate HTTP status codes (200 for success, 400 for bad request, 500 for server errors)
7. **Async Processing**: Acknowledge webhooks quickly and process them asynchronously

## Code Reference

Your webhook implementation is located at:
- **Handler**: `src/app/api/dodo/webhook/route.ts`
- **Verification**: Uses `verifyWebhookSignature()` from `src/lib/dodo.ts`
- **Status Mapping**: `mapDodoSubscriptionStatus()` and `mapDodoPaymentStatus()` in `src/lib/dodo.ts`

## Support

If you encounter issues:
1. Check the [Dodo Payments Webhook Documentation](https://docs.dodopayments.com/webhooks)
2. Review webhook delivery logs in the Dodo Payments Dashboard
3. Check your application logs for error details
4. Contact Dodo Payments support with webhook endpoint ID and timestamp

---

**Last Updated**: December 2025  
**Version**: 1.0
