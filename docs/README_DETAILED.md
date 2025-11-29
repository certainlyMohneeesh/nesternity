# Nesternity — Detailed Project Overview & Developer Guide

This README provides a comprehensive walkthrough of the Nesternity repository, its structure, features, and how to get started locally (including specific notes for the recently updated settings pages, user header, and payment integrations).

---

## 📌 Project Snapshot

- Repository: nesternity (Next.js App Router + Typescript)
- Main objective: CRM and team collaboration platform with invoice management and subscription billing.
- Key Integrations: Supabase Auth & Storage, Prisma (Postgres), Razorpay (in place of Stripe), Resend email, AI feature integrations, PDFs via React-PDF

---

## 🔧 Tech Stack

- Next.js 15 (App Router)
- TypeScript 5.x
- React 19
- Tailwind CSS and Shadcn components
- Prisma & PostgreSQL
- Supabase (Auth & Storage)
- Razorpay (payments) and Stripe (legacy / compatibility)
- Resend (transactional email)
- Lucide icons, Radix UI
- pnpm package manager

---

## 🔭 Repository Structure (Essentials)

/ (root)
- `package.json` - project scripts & dependencies
- `prisma/` - prisma schema & migrations
- `src/`
  - `app/` - Next.js app router pages, API routes
    - `api/` - server-side API routes (profile, payment settings, invoices, razorpay webhooks, etc.)
    - `dashboard/` - all authenticated dashboard routes (organisations, projects, invoices, settings)
    - other app-level pages (landing, auth, docs, email test, pricing)
  - `components/` - UI and page components
    - `settings/` - `ProfileForm`, `PaymentSettingsSection`, `BillingSection`, `PreferencesForm`
    - `navigation/` - `user-nav.tsx`, `breadcrumb-combobox.tsx`
    - `invoices/` - invoice form, payments, PDF doc components
    - `pdf/` - pdf generation components
    - `ui/` - `Field` and other shadcn UI primitives (Button, Label, Card, etc.)
  - `lib/` - utilities, db connector, supabase helpers, subscription helpers
  - `scripts/` - migration & integration scripts

---

## ⭐ Key Features & Pages

- Dashboard and org management: `src/app/dashboard/organisation` + `[id]` routes
- Projects, Boards, Tasks, Issues: project-level routes & components (`projects/[projectId]/...`)
- Invoices: `src/app/dashboard/invoices/` with Invoice generator, PDF exports & payment link support.
- Settings: `src/app/dashboard/settings` (root) with Profile, Billing, Payment Settings and Data sections.
- Razorpay: Account linking, subscription models, payments, webhook handlers present.
- Authentication & Profile: Supabase-auth and local `prisma.user` table; endpoints at `/api/user/profile` and `/api/profile`.

---

## 🛠️ Notable Server APIs & Endpoints

- `GET /api/user/profile` - fetch authenticated user's DB profile
- `GET, PUT, DELETE /api/profile` - profile retrieval/update/delete (we added DELETE for account removal)
- `GET /api/payment-settings` - get payment settings
- `POST /api/payment-settings` - upsert payment settings and optionally create Razorpay linked account
- `GET /api/razorpay/linked-account` - refresh/get linked Razorpay account status
- `GET /api/razorpay/subscription` - get user's subscription
- Razorpay webhooks: `src/app/api/razorpay/webhooks/route.ts`
- Other API routes: invoices, teams, proposals, AI endpoints, etc.

These APIs use Supabase auth token from the `Authorization` header and then operate on the Prisma DB or Razorpay APIs.

---

## ✅ Recent updates included (developer notes)

- Header & UserNav:
  - `src/app/dashboard/organisation/layout.tsx`: The header now keeps the breadcrumb centered and `UserNav` is positioned flush to the right edge of the viewport for a consistent header layout.
  - `src/components/navigation/user-nav.tsx`: Now fetches the database-backed `displayName` and `avatarUrl` via `GET /api/user/profile` and falls back to Supabase metadata. Also uses `displayName` for avatar initials and menu label.

- Settings pages/UI:
  - We added and refactored settings UI pages under `src/app/dashboard/settings/*` and profile/billing pages that reuse shadcn `Field` UI primitives from `src/components/ui/field.tsx`.
  - `PaymentSettingsSection.tsx` now uses `Field` components to keep a consistent UI.

- Account deletion & API:
  - `DELETE /api/profile` was implemented to remove the user from the DB and attempt to delete from Supabase Auth via admin route using the server/client service role; it handles authorization and returns a success message.
  - The settings pages call this DELETE route and redirect to login.

- Razorpay subscription endpoint:
  - `GET /api/razorpay/subscription` was added to fetch user's RazorpaySubscription (DB) for displaying current subscription on the Billing page.

---

## 🔐 Environment variables (short list)

- Database
  - `DATABASE_URL` (postgres connection string)
- Supabase/Auth
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only admin tasks)
- Razorpay
  - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- Email
  - `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- Optional: Stripe keys, if still in use for legacy flows
  - `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`

Full list and additional integrations are documented in the repo markdown files (e.g., `RAZORPAY_README.md`, `EMAIL_SETUP.md`, `NEWSLETTER_SETUP.md`).

---

## ⚙️ Local Development (recommended)

1. Clone the repo and install

```bash
git clone https://github.com/<owner>/nesternity.git
cd nesternity
pnpm install
```

2. Environment

```bash
cp .env.example .env.local
# Edit .env.local (Postgres, Supabase, Razorpay keys, etc.)
```

3. Generate Prisma client & setup DB

```bash
pnpm prisma:generate
pnpm prisma:migrate dev --name init   # or use dev:setup scripts
```

4. Start dev

```bash
pnpm dev
# optional: pnpm dev:full to launch the email worker concurrently
```

---

## 🧭 Important workflows and components

- Authentication & user links
  - `src/lib/supabase.ts` and `src/lib/supabase/server.ts` provide the app with client & server Supabase helpers.
  - `src/components/auth/session-context.tsx` exposes the auth session to client components.

- UI components
  - `src/components/ui/` holds the shadcn-derived components and custom components such as `Field`.
  - `Field` is the preferred base for all settings forms (accessible, responsive layouts).

- Payments & Invoices
  - `src/components/invoices/` provides UI for invoice creation, payment button integrations (Stripe/Razorpay flows), and PDF generation.
  - Razorpay payment & subscription handling is supported by `lib/razorpay-route`, `src/app/api/razorpay` endpoints, and `src/app/api/razorpay/webhooks` for event processing.

- AI/Automation
  - AI features are accessible in `/src/app/api/ai/*` and use `@google/generative-ai` and custom processors.

- Scripts
  - `scripts/` contains database migration helpers, migration to organisations script and utilities for seeding, indexing (for embeddings), etc.

---

## 🧪 Tests & Lint

- `pnpm lint` runs ESLint
- Tests are present but using a test framework that needs configuration — some errors might be seen if test runner types aren't installed. If you run `pnpm exec tsc --noEmit`, you might encounter type-related issues due to the repo’s test setup or toolchain.
- Add test runner (Jest) types if needed for local type-check and test runs.

---

## 🚀 Deploy (quick)

- Vercel: Recommended for Next.js app
  - Connect repo and configure envs
  - Ensure Prisma migrations (and `prisma generate`) are run on deployment via a build step

- Docker: build & run if necessary; scripts and `docker-compose.yml` exist for local infra.

---

## 📚 Useful internal docs to reference
- `QUICK_START_GUIDE.md` — Quick local development guide
- `RAZORPAY_SUBSCRIPTION_SYSTEM.md` and `RAZORPAY_README.md` — Razorpay documentation and migration notes
- `INVOICE_DOCUMENT_GUIDE.md` — Invoice Generation details
- `DEVELOPMENT_WORKFLOW.md` — Branching & development workflow
- `PRISMA_OPTIMIZATION.md` — Database perf

---

## ✅ Next recommended tasks
- Finalize Razorpay subscription UI flows (create/upgrade/cancel) in Billing component
- Add guard checks for account deletion (confirm if user owns organisations/projects)
- Add end-to-end tests around payments (webhooks) and account deletion flow
- Stabilize TypeScript & tests by adding required type-dev dependencies or cleaning up test configs

---

## 🧑‍💻 Contributing
- Please review `CONTRIBUTING.md`, `DEVELOPMENT_WORKFLOW.md`, and root-level documentation prior to submitting PRs.
- Follow the code styling rules (ESLint + Prettier) and keep changes scoped to the feature branch.

---

If you'd like, I can also generate a `README.md` tailored for production (smaller/concise) or add a technical `DEVELOPER_GUIDE.md` that deep-dives into a per-module explanation (APIs, UI, workflows) with diagrams and migration guides.

Feel free to ask for a follow-up: integration improvements, a Razorpay subscription details UI, or thorough test additions. 

---

*Generated on: 2025-11-20 — For internal contributor use.*
