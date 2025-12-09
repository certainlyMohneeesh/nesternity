# Razorpay to Dodo Payments Migration Guide

This guide walks you through migrating your subscription system from Razorpay to Dodo Payments.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Migration Steps](#migration-steps)
4. [API Changes](#api-changes)
5. [Database Changes](#database-changes)
6. [Testing](#testing)
7. [Rollback Plan](#rollback-plan)

## Overview

### Why Migrate to Dodo Payments?

Dodo Payments offers:
- Modern checkout experience using checkout sessions
- Built-in customer portal for subscription management
- Better international payment support
- Simplified API with better documentation
- More flexible subscription management

### What's Changed?

**Database Models:**
- `RazorpayCustomer` → `DodoCustomer`
- `RazorpaySubscription` → `DodoSubscription`
- `RazorpayPayment` → `DodoPayment`

**API Endpoints:**
- `/api/razorpay/subscription/create` → `/api/dodo/checkout/create`
- `/api/razorpay/subscription` → `/api/dodo/subscription`
- `/api/razorpay/webhook` → `/api/dodo/webhook`
- New: `/api/dodo/portal` (Customer portal)

**Libraries:**
- `src/lib/razorpay.ts` → `src/lib/dodo.ts`

## Prerequisites

### 1. Dodo Payments Account Setup

1. Sign up at [Dodo Payments](https://dodopayments.com)
2. Complete business verification
3. Create products for each subscription tier:
   - Go to Dashboard > Products
   - Create products with recurring billing
   - Note down product IDs for each tier

### 2. Environment Variables

Add to your `.env` file:

```bash
# Dodo Payments Configuration
DODO_API_KEY="your_api_key"
DODO_MODE="test"
DODO_WEBHOOK_SECRET="your_webhook_secret"
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
```

Get these from:
- API Key: Dodo Dashboard > API Keys
- Webhook Secret: Dodo Dashboard > Webhooks

## Migration Steps

### Step 1: Analyze Current State

Run the migration analysis script:

```bash
bun run scripts/migrate-razorpay-to-dodo.ts --export
```

This will:
- Count active subscriptions
- List all customers
- Export data to `migrations/exports/razorpay-migration-*.json`
- Provide migration recommendations

### Step 2: Update Database Schema

```bash
# Generate Prisma client with new models
bun run prisma:generate

# Create migration
bun run prisma:migrate dev --name migrate_to_dodo_payments

# Apply migration to production
bun run prisma:migrate:deploy
```

### Step 3: Update Subscription Plans

Update your subscription plans table with Dodo product IDs:

```sql
-- Update with your actual Dodo product IDs
UPDATE subscription_plans 
SET dodo_product_id = 'prod_starter_xxxxx' 
WHERE tier = 'STARTER';

UPDATE subscription_plans 
SET dodo_product_id = 'prod_pro_xxxxx' 
WHERE tier = 'PRO';

UPDATE subscription_plans 
SET dodo_product_id = 'prod_enterprise_xxxxx' 
WHERE tier = 'ENTERPRISE';
```

### Step 4: Configure Webhooks

1. Go to Dodo Dashboard > Webhooks
2. Click "Add Endpoint"
3. Configure:
   - **URL:** `https://yourdomain.com/api/dodo/webhook`
   - **Events:** Select all:
     - `subscription.created`
     - `subscription.updated`
     - `subscription.cancelled`
     - `subscription.expired`
     - `payment.succeeded`
     - `payment.failed`
4. Copy the webhook secret and add to `.env`

### Step 5: Test in Test Mode

Before migrating real customers:

1. Set `DODO_MODE="test"` in `.env`
2. Create a test subscription:

```bash
curl -X POST https://yourdomain.com/api/dodo/checkout/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_id",
    "email": "test@example.com",
    "name": "Test User",
    "productId": "prod_test_xxxxx",
    "planTier": "STARTER",
    "successUrl": "https://yourdomain.com/success"
  }'
```

3. Complete checkout flow
4. Verify webhook events are received
5. Test customer portal:

```bash
curl -X POST https://yourdomain.com/api/dodo/portal \
  -H "Content-Type: application/json" \
  -d '{
    "returnUrl": "https://yourdomain.com/dashboard"
  }'
```

### Step 6: Migrate Customers

For each active Razorpay subscription:

#### Option A: Email Migration (Recommended)

Send an email to customers with a migration link:

```typescript
// Create checkout session for existing customer
const response = await fetch('/api/dodo/checkout/create', {
  method: 'POST',
  body: JSON.stringify({
    userId: customer.userId,
    email: customer.email,
    name: customer.name,
    productId: plan.dodoProductId,
    planTier: subscription.planTier,
    successUrl: `${baseUrl}/migration/success`,
    cancelUrl: `${baseUrl}/migration/cancel`,
    metadata: {
      migratedFrom: 'razorpay',
      oldSubscriptionId: subscription.razorpaySubscriptionId,
    }
  })
});

// Send email with checkout link
await sendMigrationEmail(customer.email, response.checkoutUrl);
```

#### Option B: Manual Dashboard Migration

1. Export customer data: `bun run scripts/migrate-razorpay-to-dodo.ts --export`
2. For each customer:
   - Create customer in Dodo Dashboard
   - Create subscription manually
   - Update database with new subscription ID

### Step 7: Update Client-Side Code

Update your frontend to use new endpoints:

**Before:**
```typescript
// Create subscription
const response = await fetch('/api/razorpay/subscription/create', {
  method: 'POST',
  body: JSON.stringify({ userId, razorpayPlanId, ... })
});
```

**After:**
```typescript
// Create checkout session
const response = await fetch('/api/dodo/checkout/create', {
  method: 'POST',
  body: JSON.stringify({ userId, productId, planTier, ... })
});

// Redirect to checkout
window.location.href = response.checkoutUrl;
```

**Customer Portal:**
```typescript
// New feature: Customer portal for self-service
const response = await fetch('/api/dodo/portal', {
  method: 'POST',
  body: JSON.stringify({ returnUrl: window.location.href })
});

window.location.href = response.url;
```

### Step 8: Switch to Live Mode

Once testing is complete and customers are migrated:

1. Update `.env`: `DODO_MODE="live"`
2. Update webhook URL to production
3. Deploy changes
4. Monitor webhook logs for any issues

### Step 9: Cleanup

After successful migration:

1. Keep Razorpay data for 30-90 days for reference
2. Archive Razorpay models in schema (comment out, don't delete)
3. Remove old API routes after grace period
4. Update documentation

```bash
# Optional: Create backup of Razorpay data
pg_dump -t razorpay_customers -t razorpay_subscriptions -t razorpay_payments \
  > razorpay_backup_$(date +%Y%m%d).sql
```

## API Changes

### Subscription Creation

**Old (Razorpay):**
```typescript
POST /api/razorpay/subscription/create
{
  "userId": "user_123",
  "email": "user@example.com",
  "razorpayPlanId": "plan_123",
  "totalCount": 12
}
```

**New (Dodo):**
```typescript
POST /api/dodo/checkout/create
{
  "userId": "user_123",
  "email": "user@example.com",
  "productId": "prod_123",
  "planTier": "STARTER",
  "successUrl": "https://yourdomain.com/success",
  "cancelUrl": "https://yourdomain.com/cancel"
}

// Returns checkout URL
{
  "checkoutUrl": "https://checkout.dodopayments.com/..."
}
```

### Get Subscription

**Old:**
```typescript
GET /api/razorpay/subscription
// Returns RazorpaySubscription
```

**New:**
```typescript
GET /api/dodo/subscription
// Returns DodoSubscription with same structure
```

### Customer Portal (New)

```typescript
POST /api/dodo/portal
{
  "returnUrl": "https://yourdomain.com/dashboard"
}

// Returns portal URL
{
  "url": "https://portal.dodopayments.com/..."
}
```

## Database Changes

### Schema Comparison

| Razorpay | Dodo | Notes |
|----------|------|-------|
| `razorpayCustomerId` | `dodoCustomerId` | Same purpose |
| `razorpaySubscriptionId` | `dodoSubscriptionId` | Same purpose |
| `razorpayPlanId` | `dodoProductId` | Product instead of plan |
| `totalCount` | ❌ Removed | Handled by Dodo |
| `paidCount` | ❌ Removed | Tracked by Dodo |
| `shortUrl` | ❌ Removed | Use checkout URL |
| ❌ N/A | `trialStart` | New: Trial support |
| ❌ N/A | `trialEnd` | New: Trial support |
| ❌ N/A | `metadata` | New: Custom data |

### Migration SQL

Keep both tables during transition:

```sql
-- New tables are created by Prisma migrate
-- Old tables remain for reference

-- To query migration status
SELECT 
  u.email,
  r.razorpay_subscription_id AS old_sub,
  d.dodo_subscription_id AS new_sub,
  CASE 
    WHEN d.id IS NOT NULL THEN 'Migrated'
    ELSE 'Pending'
  END AS status
FROM users u
LEFT JOIN razorpay_subscriptions r ON r.user_id = u.id
LEFT JOIN dodo_subscriptions d ON d.user_id = u.id;
```

## Testing

### Test Checklist

- [ ] Checkout session creation works
- [ ] Subscription creation via webhook works
- [ ] Payment webhook updates subscription
- [ ] Failed payment webhook updates status
- [ ] Subscription cancellation works
- [ ] Customer portal loads correctly
- [ ] Customer portal allows cancellation
- [ ] Customer portal shows payment history
- [ ] Usage tracking still works
- [ ] Feature limits enforce correctly

### Test Script

```typescript
// tests/dodo-integration.test.ts
import { test, expect } from 'bun:test';

test('Create checkout session', async () => {
  const response = await fetch('http://localhost:3000/api/dodo/checkout/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'test_user',
      email: 'test@example.com',
      productId: 'prod_test_123',
      planTier: 'STARTER'
    })
  });
  
  const data = await response.json();
  expect(data.checkoutUrl).toBeDefined();
  expect(data.checkoutUrl).toContain('checkout.dodopayments.com');
});

test('Get subscription', async () => {
  const response = await fetch('http://localhost:3000/api/dodo/subscription', {
    headers: { 'Authorization': 'Bearer test_token' }
  });
  
  const data = await response.json();
  expect(data.success).toBe(true);
});
```

## Rollback Plan

If migration issues occur:

### Immediate Rollback

1. Revert code deployment
2. Restore old Razorpay endpoints
3. Update DNS/routing to old system
4. Communicate with affected customers

### Partial Rollback

Keep both systems running:

```typescript
// Feature flag approach
const useDodoPayments = process.env.USE_DODO_PAYMENTS === 'true';

if (useDodoPayments) {
  // Use Dodo Payments
  return await createDodoCheckout(params);
} else {
  // Use Razorpay
  return await createRazorpaySubscription(params);
}
```

### Data Recovery

```sql
-- Restore from backup if needed
psql your_database < razorpay_backup_YYYYMMDD.sql

-- Revert migrations
bunx prisma migrate resolve --rolled-back migration_name
```

## Support

### Common Issues

**Issue: Webhook not received**
- Check webhook URL is accessible publicly
- Verify webhook secret is correct
- Check firewall/security group settings
- Review Dodo dashboard webhook logs

**Issue: Checkout session creation fails**
- Verify API key is correct
- Check product ID exists in Dodo dashboard
- Ensure product is active and published
- Review API error message

**Issue: Customer portal shows no subscription**
- Verify subscription was created via webhook
- Check database for DodoSubscription record
- Ensure customer ID matches

### Getting Help

- Dodo Payments Documentation: https://docs.dodopayments.com
- Dodo Support: support@dodopayments.com
- Project Issues: Create issue in your repository

## Appendix

### Environment Variables Reference

```bash
# Required
DODO_API_KEY=            # From Dodo Dashboard > API Keys
DODO_MODE=               # 'test' or 'live'
DODO_WEBHOOK_SECRET=     # From Dodo Dashboard > Webhooks
NEXT_PUBLIC_BASE_URL=    # Your application URL

# Optional
DODO_API_TIMEOUT=        # API request timeout (default: 30000ms)
```

### Useful Scripts

```bash
# Analyze current state
bun run scripts/migrate-razorpay-to-dodo.ts --export

# Generate Prisma client
bun run prisma:generate

# Apply migrations
bun run prisma:migrate:deploy

# View database
bun run prisma:studio

# Test webhook locally
bun run ngrok http 3000
# Then update webhook URL in Dodo dashboard
```

### Migration Timeline Estimate

- **Small (<100 customers):** 1-2 days
- **Medium (100-1000 customers):** 3-5 days  
- **Large (>1000 customers):** 1-2 weeks

Timeline includes:
- Setup and configuration: 4 hours
- Testing: 1-2 days
- Customer migration: Varies by count
- Monitoring and fixes: 1-2 days

---

**Last Updated:** December 2025
**Version:** 1.0
