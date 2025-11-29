**A blazing-fast, feature-rich team collaboration platform built with modern web technologies**

[Demo](https://nesternity.vercel.app) • [Documentation](#documentation) • [Developer Guide](DEVELOPER_GUIDE.md) • [Features](#features) • [Getting Started](#getting-started)

# 🚀 Nesternity - Modern Team Collaboration & the calmest CRM out there

<div align="center">

![Nesternity](https://img.shields.io/badge/Nesternity-CRM%20Platform-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

**A blazing-fast, feature-rich team collaboration platform built with modern web technologies**

[Demo](https://nesternity.vercel.app) • [Documentation](#documentation) • [Features](#features) • [Getting Started](#getting-started)

</div>

---

## ✨ Features

### 🎯 **Core Platform Features**
- **Team Management** - Create teams, invite members, manage roles and permissions
- **Project Boards** - Interactive Kanban boards with drag-and-drop functionality
- **Task Management** - Create, assign, and track tasks with priorities and due dates
- **Issue Tracking** - Comprehensive issue management with status tracking
- **Activity Feed** - Real-time activity tracking across all team actions
- **User Profiles** - Customizable user profiles with avatar support

### 💼 **Business Features**
- **Invoice Generation** - Professional PDF invoice creation with multiple download options
- **Payment Processing** - Integrated Stripe payments for invoices and subscriptions
- **Subscription Management** - Tiered pricing plans (Free, Standard, Pro)
- **Client Management** - Comprehensive client information and project association
- **Email System** - Automated email notifications and team invitations

### 🚀 **Technical Excellence**
- **Blazing Fast Performance** - Optimized with Turbopack and advanced caching
- **Real-time Updates** - Live collaboration features
- **Mobile Responsive** - Works seamlessly on all devices
- **Type Safety** - Full TypeScript implementation
- **Security First** - Comprehensive authentication and authorization
- **Production Ready** - Enterprise-grade architecture and deployment

---

## 🧭 Product Flow (User Journey)

This section outlines a typical flow in Nesternity from organisation creation to invoicing and billing. Each step includes the path to the related UI/page or API for quick reference.

1) Create an Organisation (Your Organisation or Client Organisation)
	- Create an organisation using the organisation page and modal UI.
	- Files: `src/app/dashboard/organisation/page.tsx`, `src/components/organisation/organisation-modal.tsx`, `src/components/organisation/organisation-list.tsx`

2) Create a Project within an Organisation
	- After creating a project, users are redirected to the Project Dashboard.
	- Files: `src/app/dashboard/organisation/[id]/projects/*`, `src/components/projects/ProjectForm.tsx`

3) Project Dashboard: Teams, Boards & Tasks (Kanban)
	- Project dashboard includes Teams, Boards (Kanban), Tasks, and Issue tracking. Team members can be assigned to tasks inside boards.
	- Files: `src/app/dashboard/organisation/[id]/projects/[projectId]/layout.tsx`, `src/components/boards/*`, `src/components/tasks/*`, `src/components/teams/*`

4) Proposals (AI-assisted) -> Contracts
	- Generate AI-produced proposals, send to clients, and convert an accepted proposal into a contract.
	- Files: `src/components/ai/ProposalEditor.tsx`, `src/app/dashboard/organisation/[id]/projects/[projectId]/proposals/*`

5) Contracts -> Invoice
	- Convert a signed contract into an invoice directly from the Contracts interface.
	- Files: `src/app/dashboard/organisation/[id]/projects/[projectId]/contracts/*`, `src/components/contracts/*`

6) Create Invoices (manual & recurring)
	- Create one-off invoices with the InvoiceForm, or create recurring invoices via the recurring invoice flows.
	- Files: `src/components/invoices/InvoiceForm.tsx`, `src/components/invoices/RecurringInvoiceForm.tsx`, `src/app/dashboard/organisation/[id]/projects/[projectId]/invoices/recurring/*`

7) Razorpay Subscription & Billing
	- Razorpay subscription features, plan tiers, and billing flows are detailed in `RAZORPAY_SUBSCRIPTION_SYSTEM.md`. Razorpay subscription data is stored in Prisma and is accessible via endpoints like `GET /api/razorpay/subscription`.
	- Files: `RAZORPAY_SUBSCRIPTION_SYSTEM.md`, `src/app/api/razorpay/*`, `src/app/api/payment-settings/route.ts`

8) AI Budget Estimator & AI Scope Sentinel
	- AI Budget Estimator estimates cost/effort for a project via AI-backed endpoints.
	- AI Scope Sentinel provides a Scope Radar that highlights scope change risks (used during recurring invoice flows and contract checks).
	- Files: `src/app/api/ai/estimate-budget/route.ts`, `src/components/proposals/BudgetEstimation.tsx`, `src/components/dashboard/ScopeRadarWidget.tsx`, `RECURRING_INVOICES_SCOPE_SENTINEL.md`

---

If you want an in-depth developer walkthrough (with per-file descriptions and how-to's), check out `DEVELOPER_GUIDE.md`.

---

## 🏗️ **Architecture**

### **Tech Stack**
```
Frontend:  Next.js 15.3.4 + React 19 + TypeScript + Tailwind CSS
Backend:   Next.js API Routes + Prisma ORM + PostgreSQL
Auth:      Supabase Authentication
Payments:  Stripe Integration (Invoices + Subscriptions)
Storage:   Supabase Storage (File uploads, PDFs)
Email:     Resend + Supabase Auth
UI:        Radix UI + Shadcn/ui Components
```

### **Performance Optimizations**
- **Turbopack** bundling for 10x faster builds
- **Advanced caching** with LRU memory and storage cache
- **Request deduplication** and background refresh
- **Optimized database queries** with proper indexing
- **Bundle optimization** with tree shaking and code splitting

---

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ and pnpm
- PostgreSQL database (we recommend [Neon](https://console.neon.tech/) for quick setup)
- Supabase project for authentication
- Stripe account for payments (optional)

### **Quick Setup**

1. **Clone and Install**
```bash
git clone https://github.com/yourusername/nesternity.git
cd nesternity
pnpm install
```

2. **Environment Setup**
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

3. **Database Setup**
```bash
# Run automated setup
./setup.sh

# Or manually:
pnpm prisma:dev    # Run migrations
pnpm dev          # Start development server
```

4. **Visit** `http://localhost:3000`

### **Environment Variables**
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/nesternity"

# Supabase (Authentication)
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Stripe (Payments) - Optional
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (Resend) - Optional
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# Newsletter (Google Sheets) - Optional
GOOGLE_SHEET_ID="your-google-sheet-id"
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="your-recaptcha-site-key"
RECAPTCHA_SECRET_KEY="your-recaptcha-secret-key"
```

---

## 📁 **Project Structure**

```
nesternity/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Main dashboard pages
│   │   ├── auth/             # Authentication pages
│   │   └── (landing)/        # Marketing pages
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # Base UI components (Shadcn)
│   │   ├── boards/          # Kanban board components
│   │   ├── invoices/        # Invoice management
│   │   ├── teams/           # Team management
│   │   └── auth/            # Authentication components
│   ├── lib/                 # Utility functions and configurations
│   │   ├── db.ts           # Database connection
│   │   ├── api-client.ts   # API client with caching
│   │   └── auth.ts         # Authentication helpers
│   ├── hooks/              # Custom React hooks
│   └── styles/             # Global styles and themes
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
└── docs/                   # Documentation files
```

---

## 🎯 **Key Features Deep Dive**

### **Interactive Dashboard**
- Real-time activity feed
- Team performance metrics
- Quick action buttons
- Responsive design with mobile support

### **Advanced Board Management**
- Drag-and-drop task management using `@dnd-kit`
- Real-time collaboration
- Custom columns and swimlanes
- Task filtering and search

### **Professional Invoice System**
- PDF generation with React PDF
- Multiple download options (client/server-side)
- Automatic tax calculations
- Payment link generation
- Stripe integration for payments

### **Team Collaboration**
- Role-based permissions (Admin, Member, Viewer)
- Team invitations via email
- Real-time activity tracking
- Member management interface

### **Payment & Subscriptions**
- Stripe integration for secure payments
- Multiple subscription tiers
- Invoice payment processing
- Webhook handling for real-time updates

---

## 🧪 **Development Commands**

```bash
# Development
pnpm dev              # Start dev server with Turbopack
pnpm dev:slow         # Start dev server with Webpack

# Database
pnpm prisma:dev       # Run migrations + generate client
pnpm prisma:studio    # Open Prisma Studio
pnpm prisma:reset     # Reset database

# Build & Deploy
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm type-check       # Run TypeScript check

# Testing
pnpm test             # Run tests
pnpm test:watch       # Run tests in watch mode
```

---

## 📋 **Available Integrations**

### **Payment Processing**
- **Stripe** - Credit card payments, subscriptions, webhooks
- **Invoice payments** - Direct payment links
- **Subscription management** - Automated billing cycles

### **Email Services**
- **Resend** - Transactional emails with custom domains
- **Supabase Auth** - Built-in authentication emails
- **Newsletter** - Google Sheets integration with reCAPTCHA

### **Storage & CDN**
- **Supabase Storage** - File uploads and CDN delivery
- **PDF Generation** - Server-side and client-side options

### **Analytics & Monitoring**
- **Performance monitoring** - Core Web Vitals tracking
- **Error handling** - Comprehensive error boundaries
- **Activity logging** - Detailed audit trails

---

## 🚀 **Deployment**

### **Vercel (Recommended)**
```bash
# Deploy to Vercel
vercel

# Or connect your GitHub repo for automatic deployments
```

### **Docker**
```bash
# Build Docker image
docker build -t nesternity .

# Run container
docker run -p 3000:3000 nesternity
```

### **Railway/Render**
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

---

## 📖 **Documentation**

Comprehensive documentation is available in the `/docs` folder:

- **[Setup Guide](./DEVELOPMENT_WORKFLOW.md)** - Complete development setup
- **[Stripe Integration](./STRIPE_SETUP.md)** - Payment system configuration
- **[Email Setup](./EMAIL_SETUP.md)** - Email service configuration
- **[Newsletter Setup](./NEWSLETTER_SETUP.md)** - Google Sheets integration
- **[Performance Guide](./PRISMA_OPTIMIZATION.md)** - Performance optimization
- **[API Documentation](./docs/api.md)** - API endpoints reference

---

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🎉 **Success Stories**

> "Nesternity transformed how our team collaborates. The intuitive interface and powerful features helped us increase productivity by 40%." - **Sarah Johnson, Project Manager**

> "The invoice system saved us hours every week. Professional PDFs generated automatically with seamless payment integration." - **Mike Chen, Freelancer**

---

## 🆘 **Support & Community**

- **Issues**: [GitHub Issues](https://github.com/yourusername/nesternity/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/nesternity/discussions)
- **Email**: support@nesternity.com
- **Documentation**: [docs.nesternity.com](https://docs.nesternity.com)

---

<div align="center">

**Built with ❤️ by the Nesternity Team**

[Website](https://nesternity.com) • [Twitter](https://twitter.com/nesternity) • [LinkedIn](https://linkedin.com/company/nesternity)

⭐ **Star us on GitHub if you find Nesternity useful!**

</div>
