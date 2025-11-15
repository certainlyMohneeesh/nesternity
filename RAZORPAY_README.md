# Razorpay Subscription System - Setup

This document describes how to set up and run the Razorpay subscription pieces added to the repository.

## Environment variables
Add the following env vars to your staging/production environment (e.g., .env.local):

```
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
DATABASE_URL=
```

## Prisma
After reviewing the appended models in `prisma/schema.prisma`, run Prisma migrate (recommended on a staging DB first):

```bash
npx prisma generate
npx prisma migrate dev --name add_razorpay_subscriptions
```

If you prefer to push schema without migrations (not recommended for prod):

```bash
npx prisma db push
```

## Seeding subscription plans
Run the seed script to populate standard plans:

```bash
node --loader ts-node/esm scripts/seed-plans.ts
# or
ts-node scripts/seed-plans.ts
```

## Backfill existing users
Run the backfill to assign FREE trial subscriptions (staging only first):

```bash
node --loader ts-node/esm scripts/backfill-free.ts
```

## Webhooks
Point Razorpay webhook events to `/api/razorpay/webhooks` and set the `RAZORPAY_WEBHOOK_SECRET` accordingly.

## Notes
- The code added includes helper modules in `src/lib` (feature limits, usage, subscription helpers).
- The Prisma client types may need regeneration (`npx prisma generate`) after schema changes.
- The provided scripts expect `prisma` client APIs generated for the new models (e.g., `prisma.subscriptionPlan`).

## Next steps
- Implement the admin UI and billing pages.
- Add middleware to enforce feature limits across API routes.
- Implement and test webhook handlers in staging.
