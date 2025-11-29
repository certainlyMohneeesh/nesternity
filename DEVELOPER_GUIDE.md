# Developer Guide — Nesternity

This document mirrors and expands the README developer-facing details. It includes architecture specifics, setup instructions, and development workflows.

(For a user-friendly product README see `README.md`.)

---

Contents:
- Overview
- Tech stack & architecture
- Repo structure
- Key components and API references
- Development workflow
- Testing & linting
- Deployment
- Debugging & common pitfalls

## Overview
Nesternity is a team collaboration platform with invoice generation, Razorpay billing, AI proposal generation, and project management features.

## Tech stack & Architecture
See top-level `README.md`.

## Repo Structure & Files of interest
- `src/app/dashboard/organisation/layout.tsx` (header + breadcrumb + `UserNav` placement)
- `src/components/navigation/user-nav.tsx` (fetches DB-backed displayName & avatarUrl via `/api/user/profile`)
- `src/components/navigation/breadcrumb-combobox.tsx` (breadcrumb & quick project search)
- `src/app/dashboard/organisation/*` and `src/app/dashboard/organisation/[id]/projects/*` - project & org pages
- `src/app/api/*` - API endpoints like `profile`, `payment-settings`, and `razorpay` (webhooks)

## Product Flow (Developer perspective)

This section maps user-facing actions to the files and API endpoints you may want to modify or monitor when implementing new features.

1) Organisation creation
	- Users can create either a "Your Organisation" or a "Client Organisation". This uses the organisation list page and modal UI.
	- Files: `src/app/dashboard/organisation/page.tsx`, `src/components/organisation/organisation-modal.tsx`, `src/components/organisation/organisation-list.tsx`.
	- APIs: `GET/POST /api/organisations`, `GET /api/organisations/[id]`

2) Project creation
	- New projects are created within an organisation and redirect to `projectId` dashboard.
	- Files: `src/components/projects/ProjectForm.tsx`, `src/components/project/project-list.tsx`, `src/app/dashboard/organisation/[id]/projects/[projectId]/layout.tsx`
	- APIs: `GET/POST /api/organisations/[id]/projects`

3) Project Dashboard: Teams, Boards, Tasks
	- Boards are implemented using `@dnd-kit` and the `board-data` APIs. Teams use role-based APIs and components for invitations.
	- Files: `src/components/boards/*`, `src/components/tasks/*`, `src/components/teams/*`, `src/app/dashboard/organisation/[id]/projects/[projectId]/layout.tsx`
	- APIs: `GET/POST /api/teams`, `GET/POST /api/teams/[teamId]/boards`, `GET/POST /api/projects/[projectId]/boards`

4) Proposals -> Contracts -> Invoices
	- AI-assisted proposals are generated and if accepted, they become contracts and can be converted to invoices.
	- Files: `src/components/ai/ProposalEditor.tsx`, `src/components/proposals/*`, `src/components/contracts/*`, `src/components/pdf/ProposalDocument.tsx`
	- APIs: `GET/POST /api/proposals/*`, `POST /api/proposals/[proposalId]/convert-to-invoice`

5) Invoicing & Recurring Invoices
	- The `InvoiceForm` allows manual invoice creation; recurring invoices are supported via dedicated pages and scheduling logic.
	- Files: `src/components/invoices/InvoiceForm.tsx`, `src/components/invoices/RecurringInvoiceForm.tsx`, `src/app/dashboard/organisation/[id]/projects/[projectId]/invoices/recurring/*`
	- APIs: `GET/POST /api/invoices`, `GET/POST /api/recurring-invoices`

6) Razorpay Subscriptions & Billing
	- Razorpay integration includes subscription models, linked accounts, and webhooks. Subscription tiers are defined in `RAZORPAY_SUBSCRIPTION_SYSTEM.md`.
	- Files: `RAZORPAY_SUBSCRIPTION_SYSTEM.md`, `src/app/api/razorpay/*`, `src/app/api/payment-settings/route.ts`, `src/components/settings/BillingSection.tsx`
	- APIs: `GET /api/razorpay/subscription`, `POST /api/razorpay/subscription/create`, `POST /api/razorpay/webhooks`

7) AI Budget Estimator & Scope Sentinel
	- The AI Budget Estimator endpoint provides budget predictions from a brief; the Scope Sentinel helps detect scope creep and recurring invoice risks.
	- Files: `src/app/api/ai/estimate-budget/route.ts`, `src/components/proposals/BudgetEstimation.tsx`, `src/components/dashboard/ScopeRadarWidget.tsx`, `RECURRING_INVOICES_SCOPE_SENTINEL.md`
	- APIs: `GET/POST /api/ai/estimate-budget`, `POST /api/ai/scope-sentinel/scan`

Notes:
 - These mappings aim to make it easier to locate the user flows and the relevant files that implement them. If you’re adding a new feature or changing behavior, update the README and Developer Guide to keep the flow accurate.


## Getting Started
1. `pnpm install`
2. Set `.env.local` - include Postgres, Supabase, and Razorpay keys
3. Run Prisma migrations: `pnpm prisma:generate && pnpm prisma:migrate dev` (or run `./setup.sh`)
4. Run the dev server: `pnpm dev`

## Running tests & linting
- `pnpm test` - run tests
- `pnpm lint` - run ESLint
- `pnpm type-check` - run TypeScript

## Common debugging steps
- If the `UserNav` appears misaligned, check `src/app/dashboard/organisation/layout.tsx` where `UserNav` is positioned outside the centered container using `absolute right-4 top-1/2 -translate-y-1/2 md:right-8` for consistent placement.
- If TypeScript errors arise from tests, ensure test runner types are installed (e.g., `@types/jest`) or adjust `tsconfig.json` to exclude test paths during `type-check`.

## Feature-specific notes
- Razorpay: Use `GET /api/razorpay/subscription` to fetch subscription; `PaymentSettings` pages handle linking to Razorpay accounts.
- AI features: `src/app/api/ai/` contains AI endpoints for proposal generation and budget estimations.

---

If you need flow diagrams or deeper analysis on any feature, open an issue or request a specific doc entry — I can expand this file accordingly.
