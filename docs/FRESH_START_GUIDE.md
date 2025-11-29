# 🔄 Complete Fresh Start - Razorpay Route Integration

## ⚠️ WARNING: Data Wipe (Auth Users Preserved)

This will delete:
- All invoices, clients, teams, tasks, boards
- All app-related data in public schema
- **Auth users will be PRESERVED** (can't drop auth schema in Supabase)

**Note:** Users will still exist but will have no data associated with them.

## Option 1: Automated Script (Recommended)

```bash
./complete-fresh-start.sh
```

When prompted, type: `DELETE EVERYTHING`

## Option 2: Manual via Supabase Dashboard (Safer)

### Step 1: Drop All Data via Supabase SQL Editor

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click **SQL Editor** in left sidebar
3. Click **New Query**
4. Copy and paste the contents of `reset-database-complete.sql`
5. Click **Run** (or press Ctrl+Enter)
6. Wait for "Query completed successfully"

### Step 2: Clean Local Migrations

```bash
rm -rf prisma/migrations
mkdir -p prisma/migrations
```

### Step 3: Validate Schema

```bash
pnpm prisma validate
```

### Step 4: Generate Prisma Client

```bash
pnpm prisma generate
```

### Step 5: Create Fresh Migration

```bash
pnpm prisma migrate dev --name initial_razorpay_route
```

---

## What's Different After Reset?

### Old Model (Removed)
- Users had to provide Razorpay API keys
- Each user managed their own Razorpay account
- Complex setup, security concerns

### New Model (Razorpay Route) ✨
- **Platform has ONE master Razorpay account**
- Users just link their bank account (like Stripe Connect)
- Automatic fund transfers
- Platform can take commission (configurable)
- Much simpler and safer!

---

## After Reset: First-Time Setup

### 1. Update .env with Platform Credentials

```bash
# Your platform's master Razorpay account
RAZORPAY_MASTER_KEY_ID=rzp_live_xxxxx
RAZORPAY_MASTER_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx

# Commission settings
RAZORPAY_COMMISSION_ENABLED=true
RAZORPAY_COMMISSION_PERCENT=5.0
```

### 2. Start Development Server

```bash
pnpm dev
```

### 3. Sign Up New Account
- Go to http://localhost:3000
- Sign up (old accounts deleted)

### 4. Link Bank Account
1. Go to Settings → Payments
2. Fill in:
   - ✅ Account Holder Name
   - ✅ Account Number
   - ✅ IFSC Code
   - ✅ PAN Number (required for KYC)
   - ✅ Business Name
   - ✅ Contact Email/Phone
3. Click "Link Bank Account"
4. Status will show "PENDING" → "ACTIVE" after Razorpay verification

### 5. Create Invoice with Payment Link
1. Go to Invoices → Create Invoice
2. Fill in invoice details
3. Check "Enable Payment Link"
4. Submit
5. Payment link created automatically!
6. Money goes to platform → auto-transferred to user's bank

---

## Payment Flow

```
Client pays ₹10,000
      ↓
Platform Razorpay Account receives ₹10,000
      ↓
Razorpay AUTO transfers:
  → ₹9,500 to User's Bank (if 5% commission)
  → ₹500 to Platform (commission)
      ↓
User gets money in 1-2 business days
```

---

## Troubleshooting

### Error: "must be owner of table identities"
**Solution**: Use Option 2 (Manual via Supabase Dashboard)

### Error: "DIRECT_URL not found"
**Solution**: Add to .env:
```bash
DIRECT_URL="postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:5432/postgres"
```

### Psql not installed
**Solution**: 
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql

# Or use Option 2 (Supabase Dashboard)
```

---

## Region Support

✅ **Supported:** India, Malaysia  
❌ **Not Supported:** Other countries (Razorpay limitation)

Users will see this message in Settings → Payments:
> "⚠️ Bank account linking is currently available for Indian and Malaysian users only."

---

## Need Help?

1. Check `.env` has correct Supabase credentials
2. Verify DIRECT_URL uses port 5432
3. Ensure DATABASE_URL uses port 6543 with `?pgbouncer=true`
4. Run `pnpm prisma validate` to check schema
5. Check Supabase logs for auth issues

---

## What Gets Preserved

❌ **Nothing** - Complete wipe
- All users deleted
- All data deleted
- Fresh database

✅ **What You Keep**
- Code (Razorpay Route integration)
- Schema (with new PaymentSettings model)
- .env configuration
- Documentation

---

Ready to proceed? Run:

```bash
./complete-fresh-start.sh
```

Type `DELETE EVERYTHING` when prompted.
