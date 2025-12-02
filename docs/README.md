<img width="50" height="50" alt="nesternity_w" src="https://github.com/user-attachments/assets/386145f5-ebe0-4509-a72c-164005123716" />

#  Nesternity

**The Freelancer's Nest for Clients, Teams & Clarity**

A modern, AI-powered workspace for managing clients, projects, tasks, and invoices — all from one calm, intuitive hub.

[![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6.11-2D3748?style=flat&logo=prisma)](https://prisma.io)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](./LICENSE)

[Live Demo](https://nesternity.vercel.app) • [Documentation](./DEVELOPER_GUIDE.md) • [Getting Started](#-quick-start)

---

## ✨ What is Nesternity?

Nesternity is an all-in-one workspace designed for **freelancers, agencies, and small teams** to manage their entire operation from one place. Stop juggling between scattered tools — Nesternity brings everything together with AI-powered intelligence.

### Core Features

- **🎯 Project Management** - Kanban boards with drag-and-drop tasks
- **💼 Client & Team Management** - Organizations, projects, and role-based access
- **📄 Smart Proposals** - AI-generated proposals with budget estimation
- **🧾 Invoice System** - Professional PDF invoices with recurring billing
- **🔔 Notion-like Notifications** - Real-time updates with actionable items
- **🤖 AI Assistance** - Budget estimation, scope monitoring, and proposal generation
- **📊 Scope Sentinel** - Automatic scope creep detection and budget alerts
- **🔒 E-Signatures** - Digital contract signing with embedded signatures
- **💳 Payment Integration** - Razorpay subscriptions and invoice payments

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (recommended: [Neon](https://neon.tech))
- pnpm (`npm install -g pnpm`)

### Installation

```bash
# Clone repository
git clone https://github.com/certainlyMohneeesh/nesternity.git
cd nesternity

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Setup database
pnpm prisma:dev

# Start development server
pnpm dev
```

Visit `http://localhost:3000` 🎉

---

## 🏗️ Tech Stack

**Frontend**
- Next.js 15.3 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Shadcn/ui + Radix UI
- Framer Motion

**Backend**
- Next.js API Routes
- Prisma ORM
- PostgreSQL
- Supabase Auth

**AI & Integrations**
- Google Gemini AI
- Razorpay Payments
- Resend Email
- React PDF

---

## 📁 Project Structure

```
nesternity/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── ai/           # AI features (proposals, budget, scope)
│   │   │   ├── notifications/ # Notification system
│   │   │   ├── razorpay/     # Payment & subscriptions
│   │   │   └── ...
│   │   └── dashboard/        # Main app pages
│   ├── components/
│   │   ├── ai/               # AI components
│   │   ├── notifications/    # Notification center
│   │   ├── boards/           # Kanban boards
│   │   ├── invoices/         # Invoice management
│   │   └── ui/               # Base UI components
│   ├── lib/
│   │   ├── ai/               # AI adapter & prompts
│   │   ├── notifications.ts  # Notification helpers
│   │   └── db.ts             # Database client
│   └── hooks/                # Custom React hooks
├── prisma/                   # Database schema & migrations
└── docs/                     # Documentation
```

---

## 🎯 Key Features

### AI-Powered Workflow

**Smart Proposals**
- Generate professional proposals from client briefs
- Automatic budget estimation based on scope
- Integrated timeline and deliverable planning

**Budget Estimation**
- AI analyzes project scope and suggests realistic budgets
- Category-wise breakdown (design, development, QA, etc.)
- Historical data-based recommendations

**Scope Sentinel**
- Automatic scope creep detection
- Budget monitoring with risk alerts
- AI-generated change order drafts
- Client warning email templates

### Notification System

Notion-like inbox with:
- Team invite notifications
- Task assignment alerts
- Scope radar warnings
- Invoice status updates
- Browser push notifications
- Actionable buttons (View Task, Join Team, Copy Code)

### Professional Invoicing

- Beautiful PDF generation
- Recurring invoice support
- Multiple download options
- Razorpay payment integration
- Automatic tax calculations
- Client payment tracking

### Collaboration Tools

- Role-based permissions (Admin, Member, Viewer)
- Team invitations via email
- Real-time activity feed
- Kanban boards with @dnd-kit
- E-signature support for contracts

---

## 🔧 Development

```bash
# Development
pnpm dev              # Start dev server (Turbopack)
pnpm build            # Production build
pnpm start            # Start production server

# Database
pnpm prisma:dev       # Run migrations
pnpm prisma:studio    # Open Prisma Studio
pnpm prisma:reset     # Reset database

# Code Quality
pnpm lint             # Run ESLint
pnpm type-check       # TypeScript check
```

---

## 🌐 Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# AI (Google Gemini)
GOOGLE_GEMINI_API_KEY="..."

# Razorpay Payments
RAZORPAY_KEY_ID="..."
RAZORPAY_KEY_SECRET="..."

# Email (Resend)
RESEND_API_KEY="..."

# Optional: Newsletter
GOOGLE_SHEET_ID="..."
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="..."
```

See `.env.example` for complete list.

---

## 📖 Documentation

- **[Developer Guide](./DEVELOPER_GUIDE.md)** - Complete development setup
- **[AI Features](./AI_FEATURES_IMPLEMENTATION.md)** - AI system documentation
- **[Notification System](./NOTIFICATION_SYSTEM_IMPLEMENTATION.md)** - Notification architecture
- **[Scope Sentinel](./RECURRING_INVOICES_SCOPE_SENTINEL.md)** - Scope monitoring guide
- **[Razorpay Setup](./RAZORPAY_SUBSCRIPTION_SYSTEM.md)** - Payment integration

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
vercel
```

Or connect your GitHub repo for automatic deployments.

### Environment Setup

1. Add all environment variables in Vercel dashboard
2. Ensure PostgreSQL database is accessible
3. Run build command: `pnpm build`

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/certainlyMohneeesh/nesternity/issues)
- **Discussions**: [GitHub Discussions](https://github.com/certainlyMohneeesh/nesternity/discussions)
- **Email**: support@nesternity.com

---

<div align="center">

**Built with ❤️ by [Cythical Labs](https://cyth.dev)**

⭐ Star us on GitHub if you find Nesternity useful!

</div>
