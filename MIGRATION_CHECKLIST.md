# Dodo Payments Migration - Implementation Checklist

## ✅ Completed (by AI Implementation)

### Code & Database
- [x] Updated Prisma schema with Dodo models
- [x] Created Dodo Payments client library (`src/lib/dodo.ts`)
- [x] Updated subscription logic (`src/lib/subscription.ts`)
- [x] Created checkout session API (`/api/dodo/checkout/create`)
- [x] Created subscription fetch API (`/api/dodo/subscription`)
- [x] Created customer portal API (`/api/dodo/portal`)
- [x] Created comprehensive webhook handler (`/api/dodo/webhook`)
- [x] Created migration analysis script
- [x] Added npm script: `migrate:dodo`
- [x] Created environment variable template
- [x] Created complete documentation

---

## 📋 Your Action Items

### 1. Dodo Payments Account Setup
- [ ] Sign up at [Dodo Payments](https://dodopayments.com)
- [ ] Complete business verification
- [ ] Note your business ID

### 2. Create Subscription Products
Create products in Dodo dashboard matching your tiers:

- [ ] **FREE Plan** (if applicable)
  - Name: "Free Plan"
  - Billing: One-time or N/A
  - Price: $0
  - Product ID: `____________`

- [ ] **STARTER Plan**
  - Name: "Starter Plan"
  - Billing: Monthly recurring
  - Price: $____ USD
  - Product ID: `____________`

- [ ] **PRO Plan**
  - Name: "Pro Plan"
  - Billing: Monthly recurring
  - Price: $____ USD
  - Product ID: `____________`

- [ ] **ENTERPRISE Plan**
  - Name: "Enterprise Plan"
  - Billing: Monthly recurring
  - Price: $____ USD
  - Product ID: `____________`

### 3. Get API Credentials
From Dodo Dashboard > API Keys:

- [ ] Test Mode API Key: `____________`
- [ ] Live Mode API Key: `____________`

### 4. Configure Environment Variables
Add to `.env`:

```bash
# Dodo Payments Configuration
DODO_API_KEY="your_test_api_key_here"
DODO_MODE="test"
DODO_WEBHOOK_SECRET="will_get_this_later"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"  # Update for production
```

- [ ] Added `DODO_API_KEY`
- [ ] Set `DODO_MODE="test"`
- [ ] Added `NEXT_PUBLIC_BASE_URL`

### 5. Database Migration
Run these commands:

```bash
# Generate Prisma client with new models
bun run prisma:generate

# Create migration
bun run prisma:migrate dev --name migrate_to_dodo_payments

# Verify migration
bun run prisma:studio
```

- [ ] Generated Prisma client
- [ ] Created migration
- [ ] Verified new tables exist (dodo_customers, dodo_subscriptions, dodo_payments)

### 6. Update Subscription Plans Table
Update your SubscriptionPlan records with Dodo product IDs:

```sql
-- Replace with your actual product IDs from step 2
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

- [ ] Updated STARTER plan
- [ ] Updated PRO plan
- [ ] Updated ENTERPRISE plan

### 7. Analyze Current Razorpay State
Run migration analysis:

```bash
bun run migrate:dodo
```

- [ ] Ran analysis script
- [ ] Reviewed output
- [ ] Saved export file location: `____________`
- [ ] Number of active subscriptions: `____`
- [ ] Number of customers to migrate: `____`

### 8. Test Checkout Session Creation
Start dev server and test:

```bash
# Terminal 1
bun run dev

# Terminal 2 - Test API
curl -X POST http://localhost:3000/api/dodo/checkout/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_123",
    "email": "test@example.com",
    "name": "Test User",
    "productId": "YOUR_TEST_PRODUCT_ID",
    "planTier": "STARTER"
  }'
```

Expected response:
```json
{
  "success": true,
  "checkoutUrl": "https://checkout.dodopayments.com/...",
  "sessionId": "cs_xxxxx",
  "customerId": "cus_xxxxx"
}
```

- [ ] API returns checkout URL
- [ ] Can access checkout page
- [ ] Checkout page loads correctly

### 9. Test Checkout Flow (End-to-End)
Use Dodo test card details:

**Test Card:** 4242 4242 4242 4242
**Expiry:** Any future date
**CVC:** Any 3 digits

- [ ] Created checkout session
- [ ] Redirected to Dodo checkout
- [ ] Entered test card details
- [ ] Completed payment successfully
- [ ] Redirected to success URL

### 10. Configure Webhooks
In Dodo Dashboard > Webhooks:

**For Local Testing (use ngrok):**
```bash
# Terminal 1
bun run dev

# Terminal 2
ngrok http 3000

# Use ngrok URL in webhook configuration
```

**Webhook Configuration:**
- URL: `https://your-ngrok-url.ngrok.io/api/dodo/webhook` (or production URL)
- Events to select:
  - [x] subscription.created
  - [x] subscription.updated
  - [x] subscription.cancelled
  - [x] subscription.expired
  - [x] subscription.paused
  - [x] subscription.resumed
  - [x] payment.succeeded
  - [x] payment.failed

- [ ] Created webhook endpoint in Dodo dashboard
- [ ] Copied webhook secret
- [ ] Added webhook secret to `.env`: `DODO_WEBHOOK_SECRET="..."`
- [ ] Tested webhook with Dodo test event
- [ ] Verified webhook received in logs

### 11. Test Webhook Handling
Send test events from Dodo dashboard:

- [ ] subscription.created event received ✅
- [ ] Subscription created in database ✅
- [ ] payment.succeeded event received ✅
- [ ] Payment recorded in database ✅
- [ ] subscription.cancelled event received ✅
- [ ] Subscription status updated ✅

### 12. Test Customer Portal
Test self-service portal:

```bash
curl -X POST http://localhost:3000/api/dodo/portal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -d '{
    "returnUrl": "http://localhost:3000/dashboard/settings/billing"
  }'
```

- [ ] API returns portal URL
- [ ] Can access portal
- [ ] Portal shows subscription details
- [ ] Can cancel subscription from portal
- [ ] Can update payment method

### 13. Update Frontend Code
Update your React/Next.js components:

**Before:**
```typescript
// Old Razorpay approach
const response = await fetch('/api/razorpay/subscription/create', {
  method: 'POST',
  body: JSON.stringify({ userId, razorpayPlanId, ... })
});
```

**After:**
```typescript
// New Dodo approach
const response = await fetch('/api/dodo/checkout/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.id,
    email: user.email,
    name: user.displayName,
    productId: plan.dodoProductId,
    planTier: plan.tier,
  })
});

const data = await response.json();
if (data.checkoutUrl) {
  window.location.href = data.checkoutUrl;
}
```

Files to update:
- [ ] Subscription purchase flow
- [ ] Billing settings page
- [ ] Add customer portal button
- [ ] Update subscription status display

### 14. Test Complete User Flow
Test as a real user:

- [ ] User signs up
- [ ] User clicks "Upgrade to Pro"
- [ ] Redirected to Dodo checkout
- [ ] Enters payment details
- [ ] Payment succeeds
- [ ] Redirected back to app
- [ ] Subscription shows as active
- [ ] Feature limits updated correctly
- [ ] User can access customer portal
- [ ] User can manage subscription

### 15. Deploy to Staging/Preview
Deploy to test environment:

- [ ] Deploy code changes
- [ ] Update environment variables
- [ ] Update webhook URL to staging URL
- [ ] Test complete flow on staging
- [ ] Verify webhooks work on staging

### 16. Production Deployment Prep
Before going live:

**Dodo Account:**
- [ ] Complete business verification
- [ ] Switch to live mode in dashboard
- [ ] Create live mode products
- [ ] Get live mode API key
- [ ] Configure production webhook

**Environment:**
- [ ] Update `.env`: `DODO_MODE="live"`
- [ ] Add production API key
- [ ] Update `NEXT_PUBLIC_BASE_URL` to production
- [ ] Update webhook secret for production

**Database:**
- [ ] Run migrations on production: `bun run prisma:migrate:deploy`
- [ ] Update SubscriptionPlan with live product IDs
- [ ] Backup production database

### 17. Customer Migration Plan
Plan communication with existing customers:

- [ ] Draft migration email template
- [ ] Prepare FAQ for customers
- [ ] Set migration deadline
- [ ] Create customer support plan

**Migration Email Should Include:**
- Why you're migrating
- What customers need to do
- Link to new checkout
- Support contact information
- Timeline and deadline

### 18. Go Live
Execute production deployment:

- [ ] Deploy to production
- [ ] Verify webhook receiving events
- [ ] Test checkout flow in production
- [ ] Monitor error logs
- [ ] Send migration email to customers (if applicable)

### 19. Post-Launch Monitoring
Monitor for 24-48 hours:

- [ ] Check webhook logs daily
- [ ] Monitor error rates
- [ ] Track subscription creation rate
- [ ] Respond to customer questions
- [ ] Fix any issues immediately

### 20. Cleanup (After 30-90 days)
Once migration is complete:

- [ ] Verify all customers migrated
- [ ] Export Razorpay data for archival
- [ ] Comment out Razorpay models in schema (don't delete yet)
- [ ] Remove old API routes
- [ ] Update documentation
- [ ] Remove Razorpay credentials from `.env`

---

## 🚨 Troubleshooting

### Issue: Webhook not received
**Solutions:**
- [ ] Verify webhook URL is publicly accessible
- [ ] Check webhook secret matches
- [ ] Review webhook logs in Dodo dashboard
- [ ] Test with ngrok for local development

### Issue: Checkout session creation fails
**Solutions:**
- [ ] Verify API key is correct
- [ ] Check product ID exists and is active
- [ ] Review error message in API logs
- [ ] Ensure product is published in Dodo dashboard

### Issue: Customer portal shows no subscription
**Solutions:**
- [ ] Verify webhook created subscription
- [ ] Check database for DodoSubscription record
- [ ] Ensure customer ID matches
- [ ] Review webhook event logs

### Issue: Feature limits not working
**Solutions:**
- [ ] Verify subscription status is ACTIVE
- [ ] Check UsageRecord references correct subscription
- [ ] Review subscription.ts logic
- [ ] Test checkFeatureLimit() function

---

## 📊 Success Metrics

Track these after migration:

- [ ] **Subscription Creation Rate:** ____ per day
- [ ] **Checkout Abandonment Rate:** ____%
- [ ] **Payment Success Rate:** ____%
- [ ] **Customer Portal Usage:** ____ visits/day
- [ ] **Support Tickets:** ____ related to billing
- [ ] **Webhook Success Rate:** ____%

---

## 📞 Support Contacts

**Dodo Payments:**
- Email: support@dodopayments.com
- Dashboard: https://dashboard.dodopayments.com
- Documentation: https://docs.dodopayments.com

**Your Team:**
- Technical Lead: ____________
- Customer Support: ____________
- Database Admin: ____________

---

## 📚 Resources

- [ ] Read: `MIGRATION_SUMMARY.md`
- [ ] Read: `docs/DODO_MIGRATION_GUIDE.md`
- [ ] Read: `DODO_INTEGRATION.md`
- [ ] Bookmark: [Dodo API Docs](https://docs.dodopayments.com)
- [ ] Join: Dodo Slack/Discord (if available)

---

**Started:** _______________
**Completed:** _______________
**Status:** [ ] In Progress  [ ] Completed  [ ] Blocked

**Notes:**
_______________________________________________________
_______________________________________________________
_______________________________________________________
