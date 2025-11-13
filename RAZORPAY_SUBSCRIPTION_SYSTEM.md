# Razorpay Subscription System - Complete Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Migration Strategy](#migration-strategy)
4. [Generous Subscription Plans (India-first)](#subscription-plans)
5. [Database Schema Changes](#database-schema-changes)
6. [Feature Limits & Middleware](#feature-limits--middleware)
7. [Seed & Backfill Scripts](#seed--backfill-scripts)
8. [AI Cost Controls & Safety](#ai-cost-controls--safety)
9. [Implementation Phases & Rollout](#implementation-phases--rollout)
10. [API Integration](#api-integration)
11. [Admin Dashboard](#admin-dashboard)
12. [Testing & Monitoring Strategy](#testing--monitoring-strategy)
13. [Security Considerations](#security-considerations)
14. [Next Steps & Checklist](#next-steps--checklist)

---

## 1. Overview

### Goals
- Replace Stripe integrations with Razorpay for Indian payments.
- Implement subscription-based access control with generous free tier suitable for Indian freelancers and early adopters.
- Meter and control AI features (proposals/contracts/scope radar) with sensible, generous quotas and cost-protection mechanisms.
- Provide admin tools for plan management, manual upgrades, and usage backfills.
- Make the billing and quota enforcement extensible for multi-gateway support in the future (Stripe, PayPal, Wise).

### Why Razorpay?
- Indian-first payments, strong UPI support and lower transaction fees.
- Route (for India/Malaysia) provides platform-managed payouts and commission.
- Good webhook support and local compliance (GST/TDS considerations).

---

## 2. Current State Analysis

### Replace Stripe artifacts
- Remove Stripe models and endpoints (examples: `/api/stripe/*`, Stripe models in Prisma).
- Replace environment variables related to Stripe with Razorpay keys:
```env
# REMOVE:
# STRIPE_SECRET_KEY=
# STRIPE_PUBLISHABLE_KEY=
# STRIPE_WEBHOOK_SECRET=
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# ADD:
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

---

## 3. Migration Strategy (High level)

1. Update Prisma schema (add Razorpay models and subscription plans).
2. Create migration scripts; run on staging first and validate data.
3. Seed new subscription plans (generous defaults).
4. Implement middleware to check quotas & feature gates.
5. Replace Stripe UI/flows with Razorpay Payment Links / Route (for India) REST calls.
6. Add webhook handlers and reconcile existing invoices/subscriptions.
7. Launch behind a feature flag and do staged rollout.

---

## 4. Generous Subscription Plans (India-friendly)

Design principles:
- Make the FREE tier truly useful so users can onboard and reach product value.
- Keep paid tiers affordable in INR with clear upgrade incentives.
- Offer yearly discounts (15–20%) and a limited Growth trial for new signups.

Pricing & limits (monthly; display in UI in INR):

- FREE — ₹0 / month (Generous Starter)
  - Organisations: 3
  - Projects: 10
  - Team Members: 10
  - AI Proposals: 50 / month
  - AI Contracts: 5 / month
  - Recurring Invoices: 5 active
  - Invoice Generation: 200 / month
  - Storage: 1 GB
  - Scope Radar: Basic (manual + weekly checks)
  - Support: Community (email)

- STARTER — ₹299 / month (or yearly with ~17% discount)
  - Organisations: 10
  - Projects: 50
  - Team Members: 25
  - AI Proposals: 300 / month
  - AI Contracts: 50 / month
  - Recurring Invoices: 20 active
  - Invoice Generation: 1000 / month
  - Storage: 10 GB
  - Scope Radar: Standard (daily)
  - Support: Email (priority)

- GROWTH — ₹799 / month
  - Organisations: 25
  - Projects: 200
  - Team Members: 75
  - AI Proposals: 1000 / month
  - AI Contracts: 250 / month
  - Recurring Invoices: 100 active
  - Invoice Generation: 5,000 / month
  - Storage: 50 GB
  - Scope Radar: Advanced (near-real-time)
  - Support: Priority + in-app chat

- PRO — ₹1,999 / month
  - Organisations: 100
  - Projects: 1000
  - Team Members: 250
  - AI Proposals: 5000 / month
  - AI Contracts: 2000 / month
  - Recurring Invoices: Unlimited
  - Invoice Generation: Unlimited
  - Storage: 200 GB
  - Scope Radar: Enterprise (custom rules)
  - Support: Priority + account manager

- ENTERPRISE — Custom (unlimited, SLAs, white-label)

Billing & promos:
- Yearly plans: 15–20% discount (show exact savings).
- 14-day Growth trial for new signups (optional).
- Referral credits and limited promo coupons (admin configurable).

Rationale:
- These limits give real value on Free so users can adopt and see AI features' ROI.
- Quotas are generous but still bound to control operational AI costs.

---

## 5. Database Schema Changes

Below is the authoritative schema to add/update in `prisma/schema.prisma`. It includes Razorpay models, subscription plans, usage tracking, and simple audit/log models.

```prisma
// Add / update these models in prisma/schema.prisma

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
  userId                    String
  customerId                String
  razorpaySubscriptionId    String   @unique
  razorpayPlanId            String
  status                    SubscriptionStatus
  planTier                  PlanTier
  quantity                  Int      @default(1)

  currentPeriodStart        DateTime
  currentPeriodEnd          DateTime
  cancelAtPeriodEnd         Boolean  @default(false)
  canceledAt                DateTime?
  endedAt                   DateTime?

  totalCount                Int?
  paidCount                 Int      @default(0)
  remainingCount            Int?
  shortUrl                  String?

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

  amount                Int      // in paise
  currency              String   @default("INR")
  status                PaymentStatus
  method                String?
  description           String?
  email                 String?
  contact               String?
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
  name                  String
  tier                  PlanTier
  description           String?
  amount                Int      // monthly price in paise
  currency              String   @default("INR")
  period                String   @default("monthly")
  interval              Int      @default(1)
  maxOrganisations      Int
  maxProjects           Int
  maxTeamMembers        Int
  maxAIProposals        Int
  maxAIContracts        Int
  maxRecurringInvoices  Int
  maxInvoices           Int
  maxStorage            BigInt
  scopeRadarLevel       String
  analyticsLevel        String
  supportLevel          String
  customBranding        Boolean  @default(false)
  apiAccess             Boolean  @default(false)
  whiteLabel            Boolean  @default(false)
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
  featureType           FeatureType
  count                 Int      @default(1)
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

model AuditLog {
  id         String   @id @default(cuid())
  userId     String?
  action     String
  resource   String?
  resourceId String?
  meta       Json?
  createdAt  DateTime @default(now())
}
```

Enums (keep or add as needed):

```prisma
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
  GROWTH
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

## 6. Feature Limits & Middleware

Use feature limit constants that reflect the generous plans. Implement middleware that warns at 80% usage and blocks at 100%.

Example `FEATURE_LIMITS` (place in `src/lib/feature-limits.ts`):

```ts
export const FEATURE_LIMITS = {
  FREE: {
    AI_PROPOSAL: 50,
    AI_CONTRACT: 5,
    RECURRING_INVOICE: 5,
    INVOICE_GENERATED: 200,
    PROJECT_CREATED: 10,
    ORGANISATION_CREATED: 3,
    TEAM_MEMBER_ADDED: 10,
  },
  STARTER: {
    AI_PROPOSAL: 300,
    AI_CONTRACT: 50,
    RECURRING_INVOICE: 20,
    INVOICE_GENERATED: 1000,
    PROJECT_CREATED: 50,
    ORGANISATION_CREATED: 10,
    TEAM_MEMBER_ADDED: 25,
  },
  GROWTH: {
    AI_PROPOSAL: 1000,
    AI_CONTRACT: 250,
    RECURRING_INVOICE: 100,
    INVOICE_GENERATED: 5000,
    PROJECT_CREATED: 200,
    ORGANISATION_CREATED: 25,
    TEAM_MEMBER_ADDED: 75,
  },
  PROFESSIONAL: {
    AI_PROPOSAL: 5000,
    AI_CONTRACT: 2000,
    RECURRING_INVOICE: -1,
    INVOICE_GENERATED: -1,
    PROJECT_CREATED: -1,
    ORGANISATION_CREATED: -1,
    TEAM_MEMBER_ADDED: -1,
  },
  ENTERPRISE: {
    AI_PROPOSAL: -1,
    AI_CONTRACT: -1,
    RECURRING_INVOICE: -1,
    INVOICE_GENERATED: -1,
    PROJECT_CREATED: -1,
    ORGANISATION_CREATED: -1,
    TEAM_MEMBER_ADDED: -1,
  }
};
```

Example middleware logic summary (`src/middleware/subscription.ts`):
- On actions, call `checkFeatureLimit(userId, featureType)` which:
  - Finds user's subscription, or defaults to FREE.
  - Computes used count from `usageRecord` between period start/end.
  - Returns allowed/used/limit/remaining.
- At 80% usage, return a soft warning (UI shows upgrade CTA but still allow action).
- At 100%, block the action and return an upgrade-required response.
- For AI-heavy operations, show cost estimate and ask for confirmation when approaching monthly AI spend cap.

---

## 7. Seed & Backfill Scripts

Add a seed script (e.g., `prisma/seed-plans.ts` or `scripts/seed-plans.ts`) to populate `SubscriptionPlan` entries.

Example seed script:

```ts
// prisma/seed-plans.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      razorpayPlanId: 'free-plan',
      name: 'FREE',
      tier: 'FREE',
      description: 'Generous Free tier for freelancers',
      amount: 0,
      currency: 'INR',
      period: 'monthly',
      interval: 1,
      maxOrganisations: 3,
      maxProjects: 10,
      maxTeamMembers: 10,
      maxAIProposals: 50,
      maxAIContracts: 5,
      maxRecurringInvoices: 5,
      maxInvoices: 200,
      maxStorage: BigInt(1 * 1024 * 1024 * 1024), // 1GB
      scopeRadarLevel: 'basic',
      analyticsLevel: 'basic',
      supportLevel: 'community',
      customBranding: false,
      apiAccess: false,
      whiteLabel: false,
    },
    {
      razorpayPlanId: 'starter-plan',
      name: 'STARTER',
      tier: 'STARTER',
      description: 'Affordable plan for growing freelancers',
      amount: 29900, // ₹299.00 in paise
      currency: 'INR',
      period: 'monthly',
      interval: 1,
      maxOrganisations: 10,
      maxProjects: 50,
      maxTeamMembers: 25,
      maxAIProposals: 300,
      maxAIContracts: 50,
      maxRecurringInvoices: 20,
      maxInvoices: 1000,
      maxStorage: BigInt(10 * 1024 * 1024 * 1024), // 10GB
      scopeRadarLevel: 'standard',
      analyticsLevel: 'basic',
      supportLevel: 'email',
      customBranding: false,
      apiAccess: false,
      whiteLabel: false,
    },
    // Add GROWTH, PRO, ENTERPRISE entries similarly...
  ];

  for (const p of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { razorpayPlanId: p.razorpayPlanId },
      create: p,
      update: p,
    });
  }

  console.log('Subscription plans seeded');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
```

Backfill existing users to FREE plan script (example `scripts/backfill-free.ts`):

```ts
// scripts/backfill-free.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const freePlan = await prisma.subscriptionPlan.findUnique({ where: { razorpayPlanId: 'free-plan' } });
  if (!freePlan) throw new Error('Free plan missing');

  const users = await prisma.user.findMany({
    where: { /* optionally filter */ }
  });

  for (const u of users) {
    // Skip if user already has subscription
    const existing = await prisma.razorpaySubscription.findUnique({ where: { userId: u.id } });
    if (existing) continue;

    await prisma.razorpaySubscription.create({
      data: {
        userId: u.id,
        customerId: '', // fill after Razorpay customer creation if needed
        razorpaySubscriptionId: `manual-${Date.now()}-${u.id}`,
        razorpayPlanId: freePlan.razorpayPlanId,
        status: 'TRIALING',
        planTier: 'FREE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        totalCount: 0,
      }
    });
  }

  console.log('Backfilled users to FREE trial subscriptions');
}

main().catch(e => { console.error(e); process.exit(1); });
```

Admin script to manually set a plan for a user:

```ts
// scripts/set-plan.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function setPlan(userId: string, razorpayPlanId: string) {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { razorpayPlanId } });
  if (!plan) throw new Error('Plan not found');

  await prisma.razorpaySubscription.create({
    data: {
      userId,
      customerId: null,
      razorpaySubscriptionId: `manual-${Date.now()}`,
      razorpayPlanId: plan.razorpayPlanId,
      status: 'ACTIVE',
      planTier: plan.tier,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      totalCount: 0,
    },
  });

  console.log(`Plan ${razorpayPlanId} assigned to user ${userId}`);
}

setPlan(process.argv[2], process.argv[3]).catch(e => { console.error(e); process.exit(1); });
```

---

## 8. AI Cost Controls & Safety

AI features are valuable but costly; implement protections:
- Per-user monthly AI spend cap (e.g., FREE: ₹200/month equivalent) and token-based quotas.
- Map LLM usage to estimated cost (tokens * model unit cost); record in `UsageRecord` and an `AiSpend` log if necessary.
- Use cheaper models for drafts/summaries; reserve higher-cost models for final exports (contracts).
- Cache identical prompts and reuse generated content when inputs are the same.
- Soft-confirm modal for expensive operations when near cap; allow admin override/top-up credits.

Suggested AI spend tracking model:
- Track estimated cost per API call in `usageRecord` metadata (e.g., tokenCount, model, estimatedCostPaise).
- Add `AiCredits` table if you want to top-up or gift credits.

---

## 9. Implementation Phases & Rollout (Staged, safe)

Phase 0 — Staging & Preparation
- Add schema changes & run migrations on staging.
- Seed subscription plans.
- Implement feature flag `feature_new_pricing`.

Phase 1 — Middleware & Seeds
- Add `FEATURE_LIMITS`, middleware checks, and seed scripts.
- Backfill existing users onto FREE trial/subscription.

Phase 2 — Razorpay Integration
- Replace Stripe flows with Razorpay Payment Links & Route for India.
- Implement webhook handlers and signature validation.
- Create admin tools to link Razorpay customers for existing users.

Phase 3 — UI & UX
- Display plan info, usage metrics, and 80% warnings.
- Implement upgrade modals and billing page.

Phase 4 — Soft Launch (10% of users)
- Enable the new system for a small cohort behind feature flag.
- Monitor AI costs, webhook stability, and user feedback.

Phase 5 — Full Rollout
- Enable for all users after 7–14 days of close monitoring.
- Email users about the generous free tier and upgrade options.

Rollback plan:
- Deploy behind feature flag; ability to flip off to revert to legacy behavior.
- Keep previous migrations and data backups.

---

## 10. API Integration (Examples & endpoints)

Key endpoints to implement (Next.js App Router style):
- POST `/api/razorpay/create-order` — create Razorpay order / handle checkout
- POST `/api/razorpay/subscription/create` — create subscription; create Razorpay customer if needed
- POST `/api/razorpay/webhooks` — handle webhook events (verify signature)
- POST `/api/subscriptions/assign` — admin endpoint to assign plans manually
- GET `/api/usage/:userId` — return usage summary and thresholds

Security:
- Verify `x-razorpay-signature` header for webhooks.
- Keep Razorpay keys server-side only.

Sample: validate webhook signature using Razorpay utils (server side). See Razorpay docs for exact snippet and secure validation.

---

## 11. Admin Dashboard

Admin pages to add under `/admin`:
- `/admin/dashboard` — revenue & MRR graphs
- `/admin/subscriptions` — subscriptions list + filters
- `/admin/plans` — manage plan metadata & limits
- `/admin/users` — user management, plan overrides, top-ups
- `/admin/usage` — per-feature usage analytics & limit breaches
- `/admin/payments` — payment history & retry/payout controls
- `/admin/settings` — Razorpay config & webhook setup

Admin capabilities:
- Manually assign plans, top-up AI credits, refund payments, and disable accounts.
- Export usage and revenue CSVs.

---

## 12. Testing & Monitoring Strategy

Testing:
- Unit tests:
  - `checkFeatureLimit()` logic (edge cases: unlimited, -1 sentinel).
  - `trackUsage()` creates records with correct periods.
  - Webhook signature & parsing.
- Integration tests:
  - Subscription lifecycle (create → webhook activated → charge).
  - Usage enforcement (simulate usage until limit and ensure expected behavior).
- E2E (Playwright):
  - Signup → create orgs/projects → generate AI proposals until warnings and blocks.
  - Checkout (Razorpay test mode) and webhook simulation.

Monitoring & metrics:
- Events: `feature_used`, `feature_limit_warn`, `plan_changed`, `ai_spend_alert`.
- Track: AI spend per user/day, free->paid conversion, MRR, webhook failures, payment success rates.
- Alerts:
  - Daily AI spend > threshold
  - Webhook failure rate spikes
  - Payment failures > threshold

---

## 13. Security Considerations

- Always verify webhook signatures.
- Do not store card details—use Razorpay-hosted pages.
- Encrypt sensitive fields at rest (PAN/bank details only if storing for Route onboarding; prefer storing Razorpay IDs).
- Implement rate limiting and abuse detection for AI endpoints.
- Audit logs for billing operations & admin actions.

---

## 14. Next Steps & Checklist

Backend
- [ ] Update Prisma schema and create migrations (staging first).
- [ ] Seed subscription plans using the seed script.
- [ ] Implement `FEATURE_LIMITS` and middleware `checkFeatureLimit`.
- [ ] Implement Razorpay wrappers and webhook handlers.
- [ ] Add usage tracking on all AI features and create `UsageRecord` entries.

Frontend
- [ ] Show plan & usage in user settings and project pages.
- [ ] Add upgrade modals and soft warning UX.
- [ ] Implement admin views for plan overrides and top-ups.

Operations
- [ ] Create staging environment & test Razorpay integration in test mode.
- [ ] Run backfill script to assign FREE plan to existing users.
- [ ] Monitor AI usage and set alerts for cost spikes.

Communications
- [ ] Email existing users announcing the generous free tier and upgrade options.
- [ ] Add in-app banners for trial & promotional credits.

---

## Appendix: Useful Code Snippets & Notes

- Seed script: (see section 7)
- Backfill: (see section 7)
- Admin CLI: (see section 7)
- Middleware pattern: `checkFeatureLimit(userId, FeatureType) -> returns {allowed, used, limit, remaining}`
- AI spend mapping: store `estimatedCostPaise` per usage record for billing & alerts.

---

## Final Notes

This document updates the subscription system to be more generous and India-friendly while keeping operational cost control measures in place. It provides seed + backfill scripts, middleware patterns, AI-spend protections, a safe rollout plan, and admin tooling recommendations.

Use the staging environment to validate each step and enable the new pricing behind a feature flag for a controlled rollout.

**Document Version**: 1.1  
**Last Updated**: 2025-11-13  
**Author**: Nesternity Development Team