# Razorpay Subscription System - Complete Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Migration Strategy](#migration-strategy)
4. [Subscription Plans](#subscription-plans)
5. [Database Schema Changes](#database-schema-changes)
6. [Feature Limitations](#feature-limitations)
7. [Implementation Phases](#implementation-phases)
8. [API Integration](#api-integration)
9. [Admin Dashboard](#admin-dashboard)
10. [Testing Strategy](#testing-strategy)

---

## 1. Overview

### Goals
- **Complete Stripe → Razorpay Migration**: Replace all Stripe payment integrations with Razorpay
- **Subscription-Based Access Control**: Implement tiered subscription plans with feature limitations
- **AI Features Metering**: Control access to AI proposal maker, contracts, recurring invoices, and scope radar
- **Admin Control Panel**: Full subscription management from admin dashboard
- **Indian Market Focus**: Razorpay's superior support for Indian payment methods (UPI, Netbanking, Cards, Wallets)

### Why Razorpay?
- **Indian Compliance**: Built for Indian regulations (GST, TDS, etc.)
- **Lower Transaction Fees**: 2% vs Stripe's 2.9% + INR 3
- **Better UPI Integration**: Native UPI support with instant settlement
- **Rupee Settlement**: No currency conversion fees
- **Local Payment Methods**: Cards, UPI, Wallets, Netbanking, EMI
- **Better Customer Support**: India-based support team

---

## 2. Current State Analysis

### Stripe Components to Remove/Replace

#### Database Models (Prisma Schema)
```prisma
// TO BE REMOVED:
model StripeCustomer {
  id                 String   @id @default(cuid())
  userId             String   @unique
  stripeCustomerId   String   @unique
  email              String
  name               String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

model StripeSubscription {
  id                     String   @id @default(cuid())
  userId                 String   @unique
  stripeSubscriptionId   String   @unique
  stripeCustomerId       String
  status                 String
  priceId                String
  quantity               Int?
  cancelAtPeriodEnd      Boolean  @default(false)
  currentPeriodStart     DateTime
  currentPeriodEnd       DateTime
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
}

model StripePayment {
  id                 String   @id @default(cuid())
  userId             String
  stripePaymentId    String   @unique
  amount             Int
  currency           String
  status             String
  description        String?
  createdAt          DateTime @default(now())
}
```

#### API Routes to Replace
- `/api/stripe/create-checkout-session`
- `/api/stripe/create-portal-session`
- `/api/stripe/webhooks`
- `/api/stripe/subscription`
- Any other stripe-related endpoints

#### Environment Variables to Replace
```env
# REMOVE:
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# ADD:
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

---

## 3. Migration Strategy

### Phase 1: Database Schema Update (Week 1)
- Remove all Stripe models
- Add Razorpay models
- Add subscription plan tables
- Add usage tracking tables
- Run migration scripts

### Phase 2: Razorpay Integration (Week 1-2)
- Set up Razorpay SDK
- Implement payment gateway
- Create subscription checkout flow
- Set up webhook handlers
- Test payment flows

### Phase 3: Feature Limitations (Week 2-3)
- Implement subscription middleware
- Add feature gates for AI tools
- Add usage tracking
- Implement quota management
- Create upgrade prompts

### Phase 4: Admin Dashboard (Week 3-4)
- Subscription overview
- User management
- Plan management
- Analytics dashboard
- Manual subscription controls

### Phase 5: Testing & Deployment (Week 4)
- Integration testing
- Payment flow testing
- Webhook testing
- Load testing
- Production deployment

---

## 4. Subscription Plans

### Plan Tiers

#### 1. FREE Plan (₹0/month)
**Target**: Individual freelancers starting out

**Limits**:
- **Organisations**: 1
- **Projects**: 2
- **Team Members**: 3
- **AI Proposals**: 5/month
- **AI Contracts**: 0 (upgrade required)
- **Recurring Invoices**: 2 active
- **Scope Radar**: Basic (manual alerts only)
- **Invoice Generation**: 10/month
- **Storage**: 100 MB
- **Email Notifications**: Basic

**Features**:
- ✅ Basic invoicing
- ✅ Client management
- ✅ Task boards (1 active)
- ✅ Basic AI proposal generation
- ❌ AI contract generation
- ❌ Advanced analytics
- ❌ Priority support
- ❌ Custom branding

---

#### 2. STARTER Plan (₹999/month or ₹9,990/year - Save 17%)
**Target**: Growing freelancers and small teams

**Limits**:
- **Organisations**: 3
- **Projects**: 10
- **Team Members**: 10
- **AI Proposals**: 50/month
- **AI Contracts**: 20/month
- **Recurring Invoices**: 10 active
- **Scope Radar**: Standard (daily checks)
- **Invoice Generation**: 100/month
- **Storage**: 5 GB
- **Email Notifications**: Advanced

**Features**:
- ✅ Everything in FREE
- ✅ AI contract generation
- ✅ Advanced scope radar
- ✅ Multiple organisations
- ✅ Task boards (5 active)
- ✅ Basic analytics
- ✅ Email support
- ✅ Custom invoice templates
- ❌ Priority support
- ❌ Custom branding
- ❌ White-label

---

#### 3. PROFESSIONAL Plan (₹2,499/month or ₹24,990/year - Save 17%)
**Target**: Established agencies and teams

**Limits**:
- **Organisations**: 10
- **Projects**: 50
- **Team Members**: 50
- **AI Proposals**: 200/month
- **AI Contracts**: 100/month
- **Recurring Invoices**: 50 active
- **Scope Radar**: Advanced (real-time monitoring)
- **Invoice Generation**: 500/month
- **Storage**: 50 GB
- **Email Notifications**: Premium

**Features**:
- ✅ Everything in STARTER
- ✅ Unlimited task boards
- ✅ Advanced analytics & reporting
- ✅ Priority email support
- ✅ Custom branding
- ✅ API access
- ✅ Webhooks
- ✅ Advanced integrations
- ✅ Team collaboration tools
- ❌ White-label
- ❌ Dedicated account manager

---

#### 4. ENTERPRISE Plan (Custom Pricing)
**Target**: Large agencies and enterprises

**Limits**:
- **Organisations**: Unlimited
- **Projects**: Unlimited
- **Team Members**: Unlimited
- **AI Proposals**: Unlimited
- **AI Contracts**: Unlimited
- **Recurring Invoices**: Unlimited
- **Scope Radar**: Enterprise (custom rules)
- **Invoice Generation**: Unlimited
- **Storage**: Unlimited
- **Email Notifications**: Enterprise

**Features**:
- ✅ Everything in PROFESSIONAL
- ✅ White-label solution
- ✅ Custom domain
- ✅ Dedicated account manager
- ✅ Custom integrations
- ✅ SLA guarantees
- ✅ Priority phone support
- ✅ Custom training
- ✅ On-premise deployment option
- ✅ Advanced security features

---

## 5. Database Schema Changes

### New Prisma Schema

```prisma
// ==================== RAZORPAY MODELS ====================

model RazorpayCustomer {
  id                    String   @id @default(cuid())
  userId                String   @unique
  razorpayCustomerId    String   @unique
  email                 String
  name                  String?
  phone                 String?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  subscriptions         RazorpaySubscription[]
  payments              RazorpayPayment[]
  
  @@index([userId])
  @@index([razorpayCustomerId])
}

model RazorpaySubscription {
  id                        String   @id @default(cuid())
  userId                    String   @unique
  customerId                String
  razorpaySubscriptionId    String   @unique
  razorpayPlanId            String
  status                    SubscriptionStatus
  planTier                  PlanTier
  quantity                  Int      @default(1)
  
  // Billing
  currentPeriodStart        DateTime
  currentPeriodEnd          DateTime
  cancelAtPeriodEnd         Boolean  @default(false)
  canceledAt                DateTime?
  endedAt                   DateTime?
  
  // Razorpay specific
  totalCount                Int?     // Total billing cycles
  paidCount                 Int      @default(0)
  remainingCount            Int?
  shortUrl                  String?
  
  // Metadata
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt
  
  customer                  RazorpayCustomer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  user                      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  usageRecords              UsageRecord[]
  
  @@index([userId])
  @@index([customerId])
  @@index([razorpaySubscriptionId])
  @@index([status])
}

model RazorpayPayment {
  id                    String   @id @default(cuid())
  userId                String
  customerId            String
  razorpayPaymentId     String   @unique
  razorpayOrderId       String?
  
  // Amount
  amount                Int      // In paise (100 paise = ₹1)
  currency              String   @default("INR")
  
  // Status
  status                PaymentStatus
  method                String?  // card, upi, netbanking, wallet, etc.
  
  // Details
  description           String?
  email                 String?
  contact               String?
  
  // Metadata
  invoiceId             String?
  notes                 Json?
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  customer              RazorpayCustomer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([customerId])
  @@index([razorpayPaymentId])
  @@index([status])
}

model SubscriptionPlan {
  id                    String   @id @default(cuid())
  razorpayPlanId        String   @unique
  
  // Plan details
  name                  String
  tier                  PlanTier @unique
  description           String?
  
  // Pricing
  amount                Int      // Monthly price in paise
  currency              String   @default("INR")
  period                String   @default("monthly") // monthly, yearly
  interval              Int      @default(1)
  
  // Limits
  maxOrganisations      Int
  maxProjects           Int
  maxTeamMembers        Int
  maxAIProposals        Int
  maxAIContracts        Int
  maxRecurringInvoices  Int
  maxInvoices           Int
  maxStorage            BigInt   // In bytes
  
  // Features
  scopeRadarLevel       String   // basic, standard, advanced, enterprise
  analyticsLevel        String   // basic, advanced, enterprise
  supportLevel          String   // email, priority, enterprise
  customBranding        Boolean  @default(false)
  apiAccess             Boolean  @default(false)
  whiteLabel            Boolean  @default(false)
  
  // Status
  active                Boolean  @default(true)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@index([tier])
  @@index([active])
}

model UsageRecord {
  id                    String   @id @default(cuid())
  userId                String
  subscriptionId        String
  
  // Feature usage
  featureType           FeatureType
  count                 Int      @default(1)
  
  // Period
  periodStart           DateTime
  periodEnd             DateTime
  
  createdAt             DateTime @default(now())
  
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  subscription          RazorpaySubscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([subscriptionId])
  @@index([featureType])
  @@index([periodStart])
}

// ==================== ENUMS ====================

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  INCOMPLETE
  INCOMPLETE_EXPIRED
  TRIALING
  UNPAID
  PAUSED
}

enum PaymentStatus {
  CREATED
  AUTHORIZED
  CAPTURED
  REFUNDED
  FAILED
}

enum PlanTier {
  FREE
  STARTER
  PROFESSIONAL
  ENTERPRISE
}

enum FeatureType {
  AI_PROPOSAL
  AI_CONTRACT
  RECURRING_INVOICE
  SCOPE_RADAR_CHECK
  INVOICE_GENERATED
  STORAGE_USED
  TEAM_MEMBER_ADDED
  PROJECT_CREATED
  ORGANISATION_CREATED
}
```

---

## 6. Feature Limitations

### Middleware Implementation

```typescript
// src/middleware/subscription.ts

import { prisma } from '@/lib/db';
import { PlanTier, FeatureType } from '@prisma/client';

interface FeatureLimits {
  [PlanTier.FREE]: {
    [key in FeatureType]?: number;
  };
  [PlanTier.STARTER]: {
    [key in FeatureType]?: number;
  };
  [PlanTier.PROFESSIONAL]: {
    [key in FeatureType]?: number;
  };
  [PlanTier.ENTERPRISE]: {
    [key in FeatureType]?: number;
  };
}

const FEATURE_LIMITS: FeatureLimits = {
  FREE: {
    AI_PROPOSAL: 5,
    AI_CONTRACT: 0,
    RECURRING_INVOICE: 2,
    INVOICE_GENERATED: 10,
    PROJECT_CREATED: 2,
    ORGANISATION_CREATED: 1,
    TEAM_MEMBER_ADDED: 3,
  },
  STARTER: {
    AI_PROPOSAL: 50,
    AI_CONTRACT: 20,
    RECURRING_INVOICE: 10,
    INVOICE_GENERATED: 100,
    PROJECT_CREATED: 10,
    ORGANISATION_CREATED: 3,
    TEAM_MEMBER_ADDED: 10,
  },
  PROFESSIONAL: {
    AI_PROPOSAL: 200,
    AI_CONTRACT: 100,
    RECURRING_INVOICE: 50,
    INVOICE_GENERATED: 500,
    PROJECT_CREATED: 50,
    ORGANISATION_CREATED: 10,
    TEAM_MEMBER_ADDED: 50,
  },
  ENTERPRISE: {
    AI_PROPOSAL: -1, // Unlimited
    AI_CONTRACT: -1,
    RECURRING_INVOICE: -1,
    INVOICE_GENERATED: -1,
    PROJECT_CREATED: -1,
    ORGANISATION_CREATED: -1,
    TEAM_MEMBER_ADDED: -1,
  },
};

export async function checkFeatureLimit(
  userId: string,
  featureType: FeatureType
): Promise<{ allowed: boolean; limit: number; used: number; remaining: number }> {
  // Get user's subscription
  const subscription = await prisma.razorpaySubscription.findUnique({
    where: { userId },
    select: { planTier: true, currentPeriodStart: true, currentPeriodEnd: true },
  });

  if (!subscription) {
    // Default to FREE tier
    const limit = FEATURE_LIMITS.FREE[featureType] || 0;
    const used = await getUsageCount(userId, featureType, new Date(), new Date());
    return {
      allowed: used < limit,
      limit,
      used,
      remaining: Math.max(0, limit - used),
    };
  }

  const limit = FEATURE_LIMITS[subscription.planTier][featureType] || 0;
  
  // Unlimited for enterprise
  if (limit === -1) {
    return { allowed: true, limit: -1, used: 0, remaining: -1 };
  }

  const used = await getUsageCount(
    userId,
    featureType,
    subscription.currentPeriodStart,
    subscription.currentPeriodEnd
  );

  return {
    allowed: used < limit,
    limit,
    used,
    remaining: Math.max(0, limit - used),
  };
}

async function getUsageCount(
  userId: string,
  featureType: FeatureType,
  periodStart: Date,
  periodEnd: Date
): Promise<number> {
  const result = await prisma.usageRecord.aggregate({
    where: {
      userId,
      featureType,
      periodStart: { gte: periodStart },
      periodEnd: { lte: periodEnd },
    },
    _sum: { count: true },
  });

  return result._sum.count || 0;
}

export async function trackUsage(
  userId: string,
  featureType: FeatureType,
  count: number = 1
): Promise<void> {
  const subscription = await prisma.razorpaySubscription.findUnique({
    where: { userId },
    select: { id: true, currentPeriodStart: true, currentPeriodEnd: true },
  });

  if (!subscription) {
    throw new Error('No active subscription found');
  }

  await prisma.usageRecord.create({
    data: {
      userId,
      subscriptionId: subscription.id,
      featureType,
      count,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
    },
  });
}
```

### Feature Gates

```typescript
// src/lib/feature-gates.ts

import { checkFeatureLimit, trackUsage } from '@/middleware/subscription';
import { FeatureType } from '@prisma/client';

export async function canUseAIProposal(userId: string): Promise<{
  allowed: boolean;
  message?: string;
  upgradeRequired?: boolean;
}> {
  const check = await checkFeatureLimit(userId, FeatureType.AI_PROPOSAL);
  
  if (!check.allowed) {
    return {
      allowed: false,
      message: `You've reached your AI proposal limit (${check.limit}/month). Upgrade to generate more!`,
      upgradeRequired: true,
    };
  }

  return { allowed: true };
}

export async function canUseAIContract(userId: string): Promise<{
  allowed: boolean;
  message?: string;
  upgradeRequired?: boolean;
}> {
  const check = await checkFeatureLimit(userId, FeatureType.AI_CONTRACT);
  
  if (check.limit === 0) {
    return {
      allowed: false,
      message: 'AI contract generation is not available in your plan. Upgrade to STARTER or higher!',
      upgradeRequired: true,
    };
  }

  if (!check.allowed) {
    return {
      allowed: false,
      message: `You've reached your AI contract limit (${check.limit}/month). Upgrade for more!`,
      upgradeRequired: true,
    };
  }

  return { allowed: true };
}

export async function canCreateRecurringInvoice(userId: string): Promise<{
  allowed: boolean;
  message?: string;
  upgradeRequired?: boolean;
}> {
  const check = await checkFeatureLimit(userId, FeatureType.RECURRING_INVOICE);
  
  if (!check.allowed) {
    return {
      allowed: false,
      message: `You've reached your recurring invoice limit (${check.limit} active). Upgrade for more!`,
      upgradeRequired: true,
    };
  }

  return { allowed: true };
}

export async function useScopeRadar(userId: string): Promise<{
  allowed: boolean;
  level: 'basic' | 'standard' | 'advanced' | 'enterprise';
  message?: string;
}> {
  // Implement scope radar level check
  const subscription = await getUserSubscription(userId);
  
  if (!subscription) {
    return { allowed: true, level: 'basic' };
  }

  const plan = await getSubscriptionPlan(subscription.razorpayPlanId);
  
  return {
    allowed: true,
    level: plan.scopeRadarLevel as any,
  };
}
```

---

## 7. Implementation Phases

### Phase 1: Database Migration (Days 1-3)

**Tasks**:
1. Create new Prisma schema with Razorpay models
2. Write migration script to backup existing Stripe data
3. Run `prisma migrate dev` to create new tables
4. Seed initial subscription plans
5. Test database connections

**Deliverables**:
- Updated `schema.prisma`
- Migration scripts in `/prisma/migrations`
- Seed script for plans
- Database backup

---

### Phase 2: Razorpay SDK Setup (Days 4-7)

**Tasks**:
1. Install Razorpay Node SDK: `npm install razorpay`
2. Create Razorpay client wrapper
3. Set up environment variables
4. Create helper functions for common operations
5. Test API connectivity

**Code Example**:
```typescript
// src/lib/razorpay.ts
import Razorpay from 'razorpay';

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function createCustomer(data: {
  name: string;
  email: string;
  contact?: string;
}) {
  return await razorpay.customers.create(data);
}

export async function createSubscription(data: {
  plan_id: string;
  customer_id: string;
  total_count: number;
  quantity?: number;
}) {
  return await razorpay.subscriptions.create(data);
}
```

---

### Phase 3: Payment Flow (Days 8-12)

**Tasks**:
1. Create checkout page UI
2. Implement plan selection
3. Create Razorpay order
4. Handle payment success/failure
5. Update subscription status
6. Send confirmation emails

**API Routes**:
- `POST /api/razorpay/create-order` - Create payment order
- `POST /api/razorpay/verify-payment` - Verify payment signature
- `POST /api/razorpay/subscription/create` - Create subscription
- `POST /api/razorpay/subscription/cancel` - Cancel subscription
- `POST /api/razorpay/webhooks` - Handle webhooks

---

### Phase 4: Feature Gates Implementation (Days 13-17)

**Tasks**:
1. Implement subscription middleware
2. Add feature checks to AI proposal
3. Add feature checks to AI contracts
4. Add feature checks to recurring invoices
5. Add feature checks to scope radar
6. Create upgrade prompts/modals
7. Track usage for all features

---

### Phase 5: Admin Dashboard (Days 18-22)

**Features**:
- Subscription overview (active, canceled, past due)
- User subscription management
- Plan management (create, edit, deactivate)
- Usage analytics
- Revenue reports
- Manual subscription controls
- Refund management

---

### Phase 6: Testing (Days 23-25)

**Test Cases**:
- Payment flow (success, failure, timeout)
- Webhook handling
- Feature limits enforcement
- Usage tracking accuracy
- Subscription lifecycle (create, renew, cancel)
- Upgrade/downgrade flows
- Refund processing

---

## 8. API Integration

### Razorpay API Routes

#### Create Subscription Order
```typescript
// app/api/razorpay/create-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await req.json();
    
    // Get plan details
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
    
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Get or create Razorpay customer
    let customer = await prisma.razorpayCustomer.findUnique({
      where: { userId: user.id },
    });

    if (!customer) {
      const razorpayCustomer = await razorpay.customers.create({
        name: user.user_metadata.name || user.email,
        email: user.email!,
        contact: user.user_metadata.phone,
      });

      customer = await prisma.razorpayCustomer.create({
        data: {
          userId: user.id,
          razorpayCustomerId: razorpayCustomer.id,
          email: user.email!,
          name: user.user_metadata.name,
          phone: user.user_metadata.phone,
        },
      });
    }

    // Create subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: plan.razorpayPlanId,
      customer_id: customer.razorpayCustomerId,
      total_count: 12, // 12 months
      quantity: 1,
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      customerId: customer.razorpayCustomerId,
      planId: plan.id,
      amount: plan.amount,
      currency: plan.currency,
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
```

#### Webhook Handler
```typescript
// app/api/razorpay/webhooks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateWebhookSignature } from 'razorpay/dist/utils/razorpay-utils';
import { prisma } from '@/lib/db';
import { SubscriptionStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    const isValid = validateWebhookSignature(
      body,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET!
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    // Handle different event types
    switch (event.event) {
      case 'subscription.activated':
        await handleSubscriptionActivated(event.payload.subscription.entity);
        break;
      
      case 'subscription.charged':
        await handleSubscriptionCharged(event.payload.payment.entity);
        break;
      
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.payload.subscription.entity);
        break;
      
      case 'subscription.completed':
        await handleSubscriptionCompleted(event.payload.subscription.entity);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function handleSubscriptionActivated(subscription: any) {
  const customer = await prisma.razorpayCustomer.findUnique({
    where: { razorpayCustomerId: subscription.customer_id },
  });

  if (!customer) return;

  await prisma.razorpaySubscription.upsert({
    where: { razorpaySubscriptionId: subscription.id },
    create: {
      userId: customer.userId,
      customerId: customer.id,
      razorpaySubscriptionId: subscription.id,
      razorpayPlanId: subscription.plan_id,
      status: SubscriptionStatus.ACTIVE,
      planTier: getPlanTierFromPlanId(subscription.plan_id),
      currentPeriodStart: new Date(subscription.current_start * 1000),
      currentPeriodEnd: new Date(subscription.current_end * 1000),
      totalCount: subscription.total_count,
      paidCount: subscription.paid_count,
      remainingCount: subscription.remaining_count,
    },
    update: {
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(subscription.current_start * 1000),
      currentPeriodEnd: new Date(subscription.current_end * 1000),
      paidCount: subscription.paid_count,
      remainingCount: subscription.remaining_count,
    },
  });
}
```

---

## 9. Admin Dashboard

### Admin Routes Structure

```
/admin
  /dashboard          - Overview (revenue, active subs, etc.)
  /subscriptions      - All subscriptions list
  /plans              - Manage subscription plans
  /users              - User management with subscription status
  /usage              - Usage analytics per user/feature
  /payments           - Payment history
  /settings           - Razorpay settings, webhook config
```

### Key Admin Features

1. **Subscription Management**
   - View all subscriptions
   - Filter by status, plan, date
   - Manual activate/cancel/pause
   - Extend subscription periods
   - Apply discounts/coupons

2. **Plan Management**
   - Create new plans
   - Edit existing plans
   - Activate/deactivate plans
   - Set custom limits per plan
   - Pricing management

3. **Usage Analytics**
   - Feature usage by user
   - Popular features
   - Limit breach tracking
   - Usage trends
   - Export reports

4. **Revenue Dashboard**
   - MRR (Monthly Recurring Revenue)
   - ARR (Annual Recurring Revenue)
   - Churn rate
   - Upgrade/downgrade trends
   - Payment success/failure rates

---

## 10. Testing Strategy

### Unit Tests
- Feature limit checks
- Usage tracking
- Payment verification
- Webhook signature validation

### Integration Tests
- Full payment flow
- Subscription lifecycle
- Webhook handling
- Admin operations

### Test Environment
- Razorpay Test Mode
- Test cards: `4111 1111 1111 1111`
- Test UPI: `success@razorpay`
- Test webhook events

### Load Tests
- Concurrent payment processing
- Webhook handling under load
- Database performance

---

## Implementation Checklist

### Backend
- [ ] Remove Stripe models from schema
- [ ] Add Razorpay models to schema
- [ ] Run database migrations
- [ ] Install Razorpay SDK
- [ ] Create Razorpay client wrapper
- [ ] Implement subscription middleware
- [ ] Create feature gate functions
- [ ] Add usage tracking
- [ ] Build webhook handler
- [ ] Create admin API routes

### Frontend
- [ ] Remove Stripe components
- [ ] Create plan selection page
- [ ] Build Razorpay checkout
- [ ] Add upgrade prompts
- [ ] Create subscription settings page
- [ ] Build admin dashboard
- [ ] Add usage indicators
- [ ] Create limit warning modals

### AI Features Integration
- [ ] AI Proposal: Add feature gate
- [ ] AI Proposal: Track usage
- [ ] AI Proposal: Add upgrade prompt
- [ ] AI Contract: Add feature gate
- [ ] AI Contract: Track usage
- [ ] AI Contract: Add upgrade prompt
- [ ] Recurring Invoice: Add limit check
- [ ] Recurring Invoice: Track usage
- [ ] Scope Radar: Implement tier levels
- [ ] Scope Radar: Track checks

### Testing
- [ ] Unit tests for limits
- [ ] Integration tests for payments
- [ ] Webhook testing
- [ ] Load testing
- [ ] Security testing
- [ ] User acceptance testing

### Documentation
- [ ] API documentation
- [ ] User guide
- [ ] Admin guide
- [ ] Migration guide
- [ ] Troubleshooting guide

---

## Security Considerations

1. **Webhook Signature Verification**: Always verify Razorpay webhook signatures
2. **Environment Variables**: Store keys securely, never commit to git
3. **Rate Limiting**: Implement rate limits on payment endpoints
4. **Audit Logging**: Log all subscription changes and admin actions
5. **PCI Compliance**: Never store card details, use Razorpay's hosted pages
6. **Access Control**: Restrict admin routes to authorized users only

---

## Support & Maintenance

1. **Monitoring**: Set up alerts for failed payments, webhook errors
2. **Logs**: Maintain detailed logs for debugging
3. **Backups**: Regular database backups before major changes
4. **Updates**: Keep Razorpay SDK updated
5. **Documentation**: Keep admin documentation current

---

## Estimated Timeline

**Total: 4-5 weeks**

- Week 1: Database migration + Razorpay setup
- Week 2: Payment flows + Feature gates
- Week 3: AI feature integration + Admin dashboard
- Week 4: Testing + Bug fixes
- Week 5: Deployment + Monitoring

---

## Budget Estimate

- **Development**: 4-5 weeks
- **Razorpay Transaction Fees**: 2% per transaction
- **Testing Budget**: ₹10,000 for test transactions
- **Contingency**: 20% buffer

---

## Success Metrics

- Payment success rate > 95%
- Webhook delivery success > 99%
- Feature limit enforcement accuracy: 100%
- Admin dashboard uptime > 99.9%
- User upgrade conversion rate > 5%

---

## Next Steps

1. Review and approve this documentation
2. Set up Razorpay account (if not done)
3. Create test environment
4. Begin Phase 1: Database migration
5. Schedule regular check-ins

---

**Document Version**: 1.0  
**Last Updated**: November 13, 2025  
**Author**: Development Team  
**Status**: Ready for Implementation
