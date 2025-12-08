# Dodo Payments Integration - Quick Start

This directory contains everything you need to migrate from Razorpay to Dodo Payments.

## 🚀 Quick Start

### 1. Setup Environment

```bash
cp .env.dodo.example .env
# Edit .env and add your Dodo Payments credentials
```

### 2. Analyze Current Subscriptions

```bash
bun run migrate:dodo
```

This will:
- Show all active Razorpay subscriptions
- Export data to `migrations/exports/`
- Provide migration instructions

### 3. Run Database Migration

```bash
bun run prisma:generate
bun run prisma:migrate dev --name migrate_to_dodo
```

### 4. Test Integration

Start your development server and test:

```bash
bun run dev
```

Test endpoints:
- Create checkout: `POST /api/dodo/checkout/create`
- Get subscription: `GET /api/dodo/subscription`
- Customer portal: `POST /api/dodo/portal`

### 5. Configure Webhooks

1. Go to [Dodo Dashboard > Webhooks](https://dashboard.dodopayments.com/webhooks)
2. Add endpoint: `https://yourdomain.com/api/dodo/webhook`
3. Select all subscription and payment events
4. Copy webhook secret to `.env`

## 📚 Documentation

- [Complete Migration Guide](./docs/DODO_MIGRATION_GUIDE.md) - Detailed step-by-step instructions
- [Dodo Payments API Docs](https://docs.dodopayments.com) - Official API reference

## 🔑 Key Features

### Checkout Sessions
Replace direct subscription creation with hosted checkout:

```typescript
const response = await fetch('/api/dodo/checkout/create', {
  method: 'POST',
  body: JSON.stringify({
    userId: user.id,
    email: user.email,
    productId: 'prod_xxxxx',
    planTier: 'STARTER'
  })
});

// Redirect to checkout
window.location.href = response.checkoutUrl;
```

### Customer Portal
Self-service subscription management:

```typescript
const response = await fetch('/api/dodo/portal', {
  method: 'POST',
  body: JSON.stringify({
    returnUrl: window.location.href
  })
});

// Redirect to portal
window.location.href = response.url;
```

### Webhooks
Automatic subscription sync via webhooks:

```typescript
// Webhook handler at /api/dodo/webhook
// Handles:
// - subscription.created
// - subscription.updated  
// - subscription.cancelled
// - payment.succeeded
// - payment.failed
```

## 🗂️ File Structure

```
nesternity/
├── src/
│   ├── lib/
│   │   ├── dodo.ts                    # Dodo Payments client library
│   │   └── subscription.ts            # Updated to use Dodo
│   └── app/api/dodo/
│       ├── checkout/create/route.ts   # Create checkout session
│       ├── subscription/route.ts      # Get subscription
│       ├── portal/route.ts            # Customer portal
│       └── webhook/route.ts           # Webhook handler
├── prisma/
│   └── schema.prisma                  # Updated with Dodo models
├── scripts/
│   └── migrate-razorpay-to-dodo.ts   # Migration analysis tool
└── docs/
    └── DODO_MIGRATION_GUIDE.md       # Complete guide
```

## 📊 Database Changes

New models:
- `DodoCustomer` - Replaces RazorpayCustomer
- `DodoSubscription` - Replaces RazorpaySubscription  
- `DodoPayment` - Replaces RazorpayPayment

Old Razorpay models remain for reference during migration.

## ⚠️ Important Notes

1. **Test Mode First**: Always test in test mode before going live
2. **Webhook Configuration**: Critical for subscription sync
3. **Customer Migration**: Plan communication with customers
4. **Keep Backups**: Export Razorpay data before migration
5. **Monitor Webhooks**: Check webhook logs after deployment

## 🧪 Testing Checklist

- [ ] Checkout session creation
- [ ] Successful subscription creation via webhook
- [ ] Payment success webhook
- [ ] Payment failure webhook
- [ ] Subscription cancellation
- [ ] Customer portal access
- [ ] Portal subscription management
- [ ] Usage tracking still works

## 🆘 Troubleshooting

### Webhook not working
```bash
# Test webhook locally with ngrok
bun run ngrok http 3000
# Update webhook URL in Dodo dashboard to ngrok URL
```

### Checkout session fails
```bash
# Verify API key
echo $DODO_API_KEY

# Check product ID exists in Dodo dashboard
# Ensure product is active and published
```

### Customer portal shows no data
```bash
# Check subscription was created
bun run prisma:studio
# Verify DodoSubscription exists for user
```

## 📞 Support

- **Dodo Payments**: support@dodopayments.com
- **Documentation**: https://docs.dodopayments.com
- **Status Page**: https://status.dodopayments.com

## 🎯 Next Steps

1. ✅ Read the [Migration Guide](./docs/DODO_MIGRATION_GUIDE.md)
2. ✅ Setup environment variables
3. ✅ Run migration analysis
4. ✅ Test in test mode
5. ✅ Configure webhooks
6. ✅ Update client-side code
7. ✅ Migrate customers
8. ✅ Switch to live mode

---

**Need help?** Check the [complete migration guide](./docs/DODO_MIGRATION_GUIDE.md) for detailed instructions.
