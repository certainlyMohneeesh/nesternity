# Razorpay Route Integration Guide

## Overview

Nesternity now uses **Razorpay Route** (similar to Stripe Connect) instead of user-provided API keys. This allows:
- Users to link their bank accounts directly
- Automatic fund transfers to user bank accounts
- Platform commission system (configurable, default 5%)
- Settlement scheduling preferences
- No need for users to create Razorpay accounts or manage API keys

## 🌏 Regional Availability

**Currently available only in:**
- 🇮🇳 India
- 🇲🇾 Malaysia

**Requirements:**
- Valid PAN number (India) or equivalent business registration
- Indian or Malaysian bank account
- Valid phone number and email

## How It Works

### Payment Flow

```
Client pays invoice → Platform receives payment → Auto-transfer to user's bank account (minus commission)
```

1. **User links bank account** in Payment Settings
2. **Razorpay verifies** the account (24-48 hours)
3. **User creates invoice** with payment link
4. **Client pays** via Razorpay payment link
5. **Platform receives** payment to master account
6. **Auto-transfer** to user's bank (based on settlement schedule)
7. **Commission deducted** (if enabled)

### Commission System

- **Default:** 5% commission enabled
- **Configurable:** Can be disabled per user
- **Per-user rates:** Each user can have different commission percentage
- **Transparent:** Commission shown on invoice and payment link

### Settlement Schedules

| Schedule | Description | Transfer Time |
|----------|-------------|---------------|
| **INSTANT** | Real-time transfers | Immediately after payment |
| **DAILY** | End of day settlement | 11:59 PM daily |
| **WEEKLY** | Weekly batch | Every Monday |
| **MONTHLY** | Monthly batch | 1st of each month |

## Setup Instructions

### 1. Environment Variables

Add to your `.env` file:

```bash
# Razorpay Route Master Account (Platform Account)
RAZORPAY_MASTER_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_MASTER_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx

# Razorpay Webhook Secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Commission Settings (Optional - defaults shown)
RAZORPAY_COMMISSION_ENABLED=true
RAZORPAY_COMMISSION_PERCENT=5.0
```

### 2. Razorpay Dashboard Setup

#### Create Route Master Account

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to **Settings → API Keys**
3. Generate **Live Mode** API keys (or Test Mode for development)
4. Copy `Key ID` and `Key Secret` to `.env`

#### Enable Route Feature

1. Contact Razorpay support to enable **Route** feature on your account
2. Request access to **Linked Accounts API**
3. Wait for activation confirmation (usually 1-2 business days)

#### Configure Webhooks

1. Go to **Settings → Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/razorpay/webhook`
3. Select these events:
   - ✅ `payment_link.paid`
   - ✅ `payment_link.cancelled`
   - ✅ `payment_link.expired`
   - ✅ `payment_link.partially_paid`
   - ✅ `transfer.processed`
   - ✅ `transfer.failed`
   - ✅ `account.activated`
   - ✅ `account.suspended`
4. Copy the webhook secret to `.env` as `RAZORPAY_WEBHOOK_SECRET`

### 3. Database Migration

The schema is already updated. If you're on a fresh installation:

```bash
cd nesternity
npx prisma db push
```

If migrating from old schema:

```bash
# Backup your data first!
npx prisma db push --accept-data-loss
```

## User Flow

### For Users (Invoice Creators)

#### Step 1: Link Bank Account

1. Navigate to **Settings → Payment Settings**
2. Fill in required information:
   - **Contact Info:** Email, Phone
   - **Business Details:** Business name, PAN number
   - **Bank Account:** Account holder, number, IFSC, bank name
   - **Address:** Full business address
3. Click **"Link Bank Account"**
4. Wait for verification (24-48 hours)

#### Step 2: Configure Preferences

Once account is **ACTIVE**:

1. Choose **Settlement Schedule**:
   - Instant (recommended for quick access)
   - Daily, Weekly, or Monthly
2. Toggle **Platform Commission** (enabled by default at 5%)
3. Adjust commission percentage if needed
4. Click **"Save Payment Settings"**

#### Step 3: Create Invoices

1. Create invoice as usual
2. System automatically generates payment link
3. Payment link uses Razorpay Route for transfers
4. Share invoice with client

### For Clients (Payers)

1. Receive invoice via email or link
2. Click **"Pay Now"** button
3. Redirected to Razorpay payment page
4. Pay using UPI, Cards, NetBanking, Wallets
5. Instant confirmation

## Account Status

| Status | Icon | Description | Action Required |
|--------|------|-------------|-----------------|
| **Not Linked** | ⚪ | No account linked | Link bank account |
| **PENDING** | 🕐 | Verification in progress | Wait 24-48 hours |
| **ACTIVE** | ✅ | Ready to receive payments | None - ready to use |
| **NEEDS_CLARIFICATION** | ⚠️ | Additional info needed | Check verification notes |
| **SUSPENDED** | ❌ | Account suspended | Contact support |

## API Endpoints

### Payment Settings

#### GET `/api/payment-settings`

Get current payment settings for authenticated user.

**Headers:**
```
Authorization: Bearer {supabase_access_token}
```

**Response:**
```json
{
  "id": "uuid",
  "razorpayAccountId": "acc_xxxxx",
  "accountStatus": "ACTIVE",
  "accountActive": true,
  "settlementSchedule": "INSTANT",
  "enableCommission": true,
  "commissionPercent": 5.0,
  "accountType": "SAVINGS",
  "verificationNotes": null
}
```

#### POST `/api/payment-settings`

Create or update payment settings.

**Headers:**
```
Authorization: Bearer {supabase_access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "createLinkedAccountNow": true,
  "email": "user@example.com",
  "phone": "+919876543210",
  "panNumber": "ABCDE1234F",
  "accountHolderName": "John Doe",
  "accountNumber": "1234567890",
  "ifscCode": "SBIN0001234",
  "bankName": "State Bank of India",
  "accountType": "SAVINGS",
  "businessName": "John's Business",
  "businessAddress": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001"
}
```

### Invoices

#### POST `/api/invoices`

Create invoice with payment link (requires active linked account).

**Headers:**
```
Authorization: Bearer {supabase_access_token}
Content-Type: application/json
```

**Response:**
```json
{
  "id": "uuid",
  "invoiceNumber": "INV-001",
  "razorpayPaymentLinkId": "plink_xxxxx",
  "razorpayPaymentLinkUrl": "https://rzp.io/l/xxxxx",
  "status": "PENDING",
  "commissionAmount": 50.0,
  "transferAmount": 950.0
}
```

### Webhook Handler

#### POST `/api/razorpay/webhook`

Receives Razorpay webhook events.

**Headers:**
```
X-Razorpay-Signature: {signature}
Content-Type: application/json
```

**Events Handled:**
- `payment_link.paid` → Mark invoice PAID, create transfer
- `payment_link.cancelled` → Mark invoice CANCELLED
- `payment_link.expired` → Mark invoice OVERDUE
- `transfer.processed` → Log successful transfer
- `transfer.failed` → Alert for manual intervention
- `account.activated` → Update account status to ACTIVE
- `account.suspended` → Update account status to SUSPENDED

## Testing

### Local Development

1. Use Razorpay **Test Mode** credentials
2. Set up ngrok for webhook testing:
   ```bash
   ngrok http 3000
   ```
3. Update webhook URL in Razorpay dashboard to ngrok URL

### Test Scenarios

#### Test 1: Link Bank Account

```bash
# Create test user and payment settings
curl -X POST http://localhost:3000/api/payment-settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "createLinkedAccountNow": true,
    "email": "test@example.com",
    "phone": "+919876543210",
    "panNumber": "ABCDE1234F",
    "accountHolderName": "Test User",
    "accountNumber": "1234567890",
    "ifscCode": "SBIN0001234",
    "bankName": "State Bank of India",
    "accountType": "SAVINGS"
  }'
```

#### Test 2: Create Invoice

```bash
# Create invoice (requires active linked account)
curl -X POST http://localhost:3000/api/invoices \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Test Client",
    "clientEmail": "client@example.com",
    "items": [{"description": "Service", "amount": 1000}],
    "totalAmount": 1000
  }'
```

#### Test 3: Simulate Payment

Use Razorpay test cards:
- **Success:** `4111 1111 1111 1111`
- **Failure:** `4000 0000 0000 0002`

#### Test 4: Webhook Events

Use Razorpay Dashboard **Webhooks → Test Webhooks** to simulate events.

## Troubleshooting

### Issue: Account stuck in PENDING

**Cause:** Verification takes 24-48 hours

**Solution:**
1. Check verification notes in settings
2. Verify PAN number is correct
3. Ensure bank account details match PAN name
4. Contact Razorpay support if >48 hours

### Issue: Cannot create invoice (account not linked)

**Error:** `Payment settings not configured or account not active`

**Solution:**
1. Check Payment Settings page
2. Ensure account status is **ACTIVE**
3. Verify `accountActive` is `true`
4. Re-link if needed

### Issue: Transfer failed

**Symptoms:** `transfer.failed` webhook received

**Solution:**
1. Check invoice notes for transfer error
2. Verify bank account is valid
3. Check if account has daily transfer limits
4. Contact Razorpay support for details
5. Manual transfer may be needed

### Issue: Commission not deducted

**Check:**
1. `enableCommission` is `true` in payment settings
2. `commissionPercent` > 0
3. Check invoice `notes.commission_amount` field
4. Verify transfer amount = total - commission

### Issue: Webhook signature verification failed

**Cause:** Wrong webhook secret or modified payload

**Solution:**
1. Verify `RAZORPAY_WEBHOOK_SECRET` matches dashboard
2. Don't modify webhook payload
3. Check webhook logs in Razorpay dashboard
4. Ensure webhook URL uses HTTPS in production

## Security Best Practices

### 1. Environment Variables

- ✅ Never commit `.env` to git
- ✅ Use different keys for dev/prod
- ✅ Rotate keys periodically
- ✅ Restrict key permissions in Razorpay dashboard

### 2. Webhook Security

- ✅ Always verify webhook signatures
- ✅ Use HTTPS in production
- ✅ Log all webhook events
- ✅ Rate limit webhook endpoint
- ✅ Return 200 quickly (process async)

### 3. Data Protection

- ✅ Encrypt sensitive data at rest
- ✅ Never log full account numbers
- ✅ PCI-DSS compliance for card data
- ✅ Regular security audits
- ✅ GDPR compliance for EU users

### 4. Access Control

- ✅ Verify user owns invoice before payment
- ✅ Check account status before creating payment links
- ✅ Validate commission percentages (0-100%)
- ✅ Rate limit API endpoints
- ✅ Implement fraud detection

## Database Schema

### PaymentSettings Model

```prisma
model PaymentSettings {
  id                   String             @id @default(uuid())
  userId               String             @unique
  
  // Razorpay Route
  razorpayAccountId    String?            @unique
  accountStatus        AccountStatus      @default(PENDING)
  accountActive        Boolean            @default(false)
  accountType          BankAccountType    @default(SAVINGS)
  settlementSchedule   SettlementSchedule @default(INSTANT)
  enableCommission     Boolean            @default(true)
  commissionPercent    Float              @default(5.0)
  verificationNotes    String?
  
  // Bank Account (encrypted in production)
  accountHolderName    String?
  accountNumber        String?
  ifscCode             String?
  bankName             String?
  branchName           String?
  
  // Business/KYC
  businessName         String?
  gstNumber            String?
  panNumber            String?
  businessAddress      String?
  city                 String?
  state                String?
  pincode              String?
  country              String?            @default("India")
  email                String?
  phone                String?
  
  user                 User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt
}

enum AccountStatus {
  PENDING
  ACTIVE
  SUSPENDED
  NEEDS_CLARIFICATION
}

enum SettlementSchedule {
  INSTANT
  DAILY
  WEEKLY
  MONTHLY
}

enum BankAccountType {
  SAVINGS
  CURRENT
}
```

## Migration from Old System

If you're migrating from the old API key system:

### 1. Notify Users

Send email to all users:
- Explain new Razorpay Route system
- Benefits (no API keys, direct transfers)
- Action required (link bank account)
- Deadline for migration

### 2. Data Migration

```sql
-- Backup old settings
CREATE TABLE payment_settings_backup AS 
SELECT * FROM payment_settings;

-- Clear old API key fields (if you want to remove them)
UPDATE payment_settings 
SET razorpay_key_id = NULL, 
    razorpay_key_secret = NULL;
```

### 3. Gradual Rollout

```typescript
// In invoice creation API
if (paymentSettings.razorpayAccountId) {
  // New Route system
  await createPaymentLinkWithTransfer(...);
} else if (paymentSettings.razorpayKeyId) {
  // Legacy API key system (deprecated)
  await createLegacyPaymentLink(...);
} else {
  throw new Error('Payment settings not configured');
}
```

### 4. Force Migration

After grace period:
```typescript
// Remove legacy system support
if (!paymentSettings.razorpayAccountId || !paymentSettings.accountActive) {
  throw new Error('Please link your bank account in Payment Settings');
}
```

## FAQs

### Q: Why can't I use my own Razorpay API keys?

**A:** Razorpay Route provides better security, automatic transfers, and simplified UX. Users don't need to create/manage Razorpay accounts.

### Q: How long does account verification take?

**A:** Usually 24-48 hours. Razorpay verifies your PAN and bank account details.

### Q: Can I disable commission?

**A:** Yes! Toggle "Platform Commission" in Payment Settings. This is useful for beta users or special partnerships.

### Q: What happens if transfer fails?

**A:** Invoice is marked with failed transfer status. Admin is notified. Manual transfer can be initiated.

### Q: Can I use Razorpay Route outside India/Malaysia?

**A:** Not currently. This is a Razorpay limitation. We'll add more regions as they become available.

### Q: Is test mode available?

**A:** Yes! Use Razorpay test mode credentials for development. All features work the same.

### Q: How do I get live mode access?

**A:** Complete Razorpay KYC verification and request Route feature activation from support.

### Q: Can I change settlement schedule?

**A:** Yes, anytime in Payment Settings. Changes apply to new payments only.

## Support

### Razorpay Support

- **Email:** support@razorpay.com
- **Phone:** +91-80-61151023
- **Dashboard:** https://dashboard.razorpay.com/app/helpdesk

### Platform Support

For Nesternity-specific issues:
1. Check this guide first
2. Check webhook logs in Razorpay dashboard
3. Check application logs for errors
4. Contact platform admin

## Changelog

### Version 1.0.0 (November 2025)

- ✅ Initial Razorpay Route implementation
- ✅ Linked account creation
- ✅ Payment link with auto-transfers
- ✅ Commission system
- ✅ Settlement scheduling
- ✅ Webhook handlers
- ✅ Payment Settings UI
- ✅ India & Malaysia support

### Upcoming Features

- 🔄 Multi-currency support
- 🔄 Refund handling
- 🔄 Dispute management
- 🔄 Advanced analytics
- 🔄 Bulk transfers
- 🔄 Email notifications
- 🔄 SMS notifications

## Resources

- [Razorpay Route Docs](https://razorpay.com/docs/route/)
- [Razorpay API Reference](https://razorpay.com/docs/api/)
- [Webhook Events](https://razorpay.com/docs/webhooks/payload/)
- [Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)

---

**Last Updated:** November 10, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
