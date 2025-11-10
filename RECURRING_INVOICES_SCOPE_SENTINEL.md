# Recurring Invoices & Scope Sentinel Enhancement - Implementation Guide

## 🎯 Features Implemented

### 1. **Recurring Invoice System with AI Automation**

#### Database Schema (✅ COMPLETE)
```prisma
model Invoice {
  // Recurring Invoice Automation
  autoSendEnabled   Boolean    @default(false) // AI-powered auto-send
  sendDayOfPeriod   Int?       // Day of month/week to send
  recipientEmails   String[]   // Additional CC emails
  autoGenerateEnabled Boolean  @default(true) // Auto-create next invoice
  maxOccurrences    Int?       // Stop after X occurrences
  occurrenceCount   Int        @default(0) // Track count
  parentInvoiceId   String?    // Reference to template
}
```

####API Endpoints (✅ COMPLETE)

1. **POST /api/invoices/recurring/create**
   - Creates recurring invoice template
   - Sets up automation schedule
   - Supports WEEKLY, MONTHLY, QUARTERLY, YEARLY
   - Configurable day-of-period sending
   - Optional max occurrences

2. **POST /api/invoices/recurring/[id]/process**
   - Generates next invoice from template
   - AI-powered professional email generation
   - Auto-send if enabled
   - Updates occurrence counter
   - Calculates next issue date

3. **PATCH /api/invoices/recurring/[id]/toggle-automation**
   - Enable/disable auto-send
   - Update send day and recipient list
   - Modify automation settings

#### Features:
- ✅ Automated invoice generation
- ✅ AI-generated professional emails
- ✅ Flexible scheduling (weekly/monthly/quarterly/yearly)
- ✅ Occurrence limits
- ✅ Multi-recipient support
- ✅ Manual override options

### 2. **Enhanced Scope Sentinel with Budget Monitoring**

#### Database Schema (✅ COMPLETE)
```prisma
model ScopeRadar {
  // Budget Monitoring
  originalBudget    Float? // From proposal/client
  currentEstimate   Float? // Current cost estimate
  budgetOverrun     Float? // Amount over budget
  budgetOverrunPercent Float? // Percentage over
  
  // Client Communication
  clientEmailDraft  String? // AI-drafted warning
  emailSent         Boolean
  emailSentAt       DateTime?
}
```

#### Integration Points:
1. **Proposal Integration**
   - Extracts budget from accepted proposals
   - Sets as original budget baseline

2. **Invoice Integration**
   - Tracks cumulative invoice totals
   - Compares against original budget
   - Flags when approaching/exceeding

3. **Client Budget**
   - Uses client.budget field as fallback
   - Monitors across all projects for client

## 📋 TODO: Remaining Implementation

### 3. **Scope Sentinel Budget Monitoring Endpoint**

**File:** `/src/app/api/ai/scope-sentinel/budget-check/route.ts`

```typescript
/**
 * POST /api/ai/scope-sentinel/budget-check
 * Check project budget against original scope
 */

interface BudgetCheckRequest {
  projectId: string;
}

interface BudgetCheckResponse {
  originalBudget: number;
  currentSpend: number;
  remainingBudget: number;
  overrunPercent: number;
  riskLevel: 'safe' | 'warning' | 'critical';
  projectedTotal: number;
  clientEmailDraft: string; // AI-generated warning
  recommendations: string[];
}

// Implementation:
// 1. Fetch project with proposal/client budget
// 2. Sum all related invoices
// 3. Analyze scope creep impact
// 4. Generate client warning email if needed
// 5. Store in ScopeRadar
```

### 4. **AI Email Templates**

**File:** `/src/lib/ai/email-templates.ts`

```typescript
/**
 * Scope Creep Warning Email
 */
export async function generateScopeCreepWarningEmail(data: {
  clientName: string;
  projectName: string;
  originalBudget: number;
  currentEstimate: number;
  overrunAmount: number;
  overrunPercent: number;
  flaggedItems: Array<{ item: string; cost: number }>;
  currency: string;
}): Promise<string> {
  // Use Gemini to generate professional, polite email
  // Includes budget impact, scope creep items, next steps
}

/**
 * Recurring Invoice Email  
 */
export async function generateRecurringInvoiceEmail(invoice: Invoice): Promise<string> {
  // Professional recurring service invoice email
  // Thank you message, invoice details, payment info
}
```

### 5. **Cron Job for Recurring Invoices**

**File:** `/src/app/api/cron/process-recurring-invoices/route.ts`

```typescript
/**
 * GET /api/cron/process-recurring-invoices
 * Daily cron job to process recurring invoices
 * Set up in Vercel Cron: 0 9 * * * (9 AM daily)
 */

export async function GET(request: NextRequest) {
  // 1. Verify cron secret
  // 2. Find invoices where nextIssueDate <= today
  // 3. Process each invoice
  // 4. Send emails if autoSendEnabled
  // 5. Log results
  // 6. Return summary
}
```

**Vercel Configuration:** `vercel.json`
```json
{
  "crons": [{
    "path": "/api/cron/process-recurring-invoices",
    "schedule": "0 9 * * *"
  }]
}
```

### 6. **UI Components**

#### RecurringInvoiceForm Component
**File:** `/src/components/invoices/RecurringInvoiceForm.tsx`

```tsx
export function RecurringInvoiceForm() {
  // Form fields:
  // - Client selector
  // - Invoice items (description, quantity, rate)
  // - Recurrence (WEEKLY/MONTHLY/QUARTERLY/YEARLY)
  // - Tax rate, discount
  // - Automation toggle
  // - Send day of period
  // - Additional recipients
  // - Max occurrences
  
  // Submit: POST /api/invoices/recurring/create
}
```

#### RecurringInvoiceCard Component
**File:** `/src/components/invoices/RecurringInvoiceCard.tsx`

```tsx
export function RecurringInvoiceCard({ invoice }: { invoice: Invoice }) {
  // Display:
  // - Next issue date
  // - Recurrence pattern
  // - Occurrence count
  // - Auto-send status
  // - Action buttons:
  //   - Generate Now (manual trigger)
  //   - Toggle Automation
  //   - Edit
  //   - Delete
}
```

#### ScopeRadarWidget Component
**File:** `/src/components/dashboard/ScopeRadarWidget.tsx`

```tsx
export function ScopeRadarWidget({ projectId }: { projectId: string }) {
  // Display:
  // - Budget status gauge
  // - Risk level indicator
  // - Flagged items count
  // - Quick actions:
  //   - View Details
  //   - Send Warning Email
  //   - Draft Change Order
  //   - Acknowledge
}
```

### 7. **Dashboard Integration**

**File:** `/src/app/dashboard/page.tsx`

Add widgets:
```tsx
{/* Scope Sentinel Alerts */}
<ScopeRadarAlerts userId={user.id} />

{/* Recurring Invoices */}
<RecurringInvoicesOverview userId={user.id} />
```

## 🚀 Quick Start Implementation Order

1. ✅ **Schema Updates** - DONE
2. ✅ **Recurring Invoice APIs** - DONE
3. **Budget Monitoring API** - Create budget-check endpoint
4. **Email Templates** - AI-generated emails
5. **Cron Job** - Automated processing
6. **UI Components** - Forms and cards
7. **Dashboard Integration** - Widgets and alerts
8. **Testing** - End-to-end workflows

## 📊 Testing Checklist

### Recurring Invoices
- [ ] Create monthly recurring invoice
- [ ] Verify auto-generation on schedule
- [ ] Test AI email generation
- [ ] Check auto-send functionality
- [ ] Validate occurrence limits
- [ ] Test manual trigger
- [ ] Verify automation toggle

### Scope Sentinel
- [ ] Create project with budget
- [ ] Add tasks beyond scope
- [ ] Trigger scope scan
- [ ] Verify budget tracking
- [ ] Test email warning generation
- [ ] Check change order draft
- [ ] Validate client email sending

## 🎯 User Workflows

### Workflow 1: Setup Recurring Invoice
1. Navigate to Invoices → Create Recurring
2. Select client and add items
3. Choose recurrence (MONTHLY)
4. Enable auto-send automation
5. Set send day (e.g., 1st of month)
6. Add recipient emails
7. Set max occurrences (optional)
8. Save template

**Result:** Invoice auto-generates and emails client monthly

### Workflow 2: Monitor Scope Creep
1. Project created with proposal budget
2. Tasks added during development
3. Scope Sentinel scans daily
4. Detects out-of-scope items
5. Calculates budget impact
6. Generates warning email draft
7. User reviews and sends to client
8. Client acknowledges or requests change order

**Result:** Proactive budget protection with client communication

## 🔗 API Usage Examples

### Create Recurring Invoice
```typescript
const response = await fetch('/api/invoices/recurring/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clientId: 'client_123',
    items: [
      { description: 'Monthly Retainer', quantity: 1, rate: 50000 }
    ],
    recurrence: 'MONTHLY',
    autoSendEnabled: true,
    sendDayOfPeriod: 1,
    recipientEmails: ['accounting@client.com'],
    maxOccurrences: 12, // 1 year
  }),
});
```

### Check Budget
```typescript
const response = await fetch('/api/ai/scope-sentinel/budget-check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'project_123',
  }),
});

const { overrunPercent, clientEmailDraft } = await response.json();
```

## 📝 Environment Variables

Add to `.env`:
```env
# Cron Secret (generate random string)
CRON_SECRET=your-secret-here

# Email Service (already configured)
RESEND_API_KEY=your-key-here
RESEND_FROM_EMAIL=invoices@yourdomain.com
```

## 🎨 UI Mockups

### Recurring Invoice Dashboard
```
┌─────────────────────────────────────┐
│ Recurring Invoices                  │
├─────────────────────────────────────┤
│ [+ Create Recurring]                │
│                                     │
│ ┌───────────────────────────────┐  │
│ │ Client ABC - Monthly Retainer │  │
│ │ ₹50,000 • Next: Dec 1, 2025   │  │
│ │ 🤖 Auto-send: ON (3/12)       │  │
│ │ [Generate Now] [Edit] [⚙]     │  │
│ └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Scope Radar Alert
```
┌─────────────────────────────────────┐
│ ⚠️ Scope Creep Detected             │
├─────────────────────────────────────┤
│ Project: Mobile App                 │
│ Risk: 🔴 HIGH (85%)                │
│                                     │
│ Budget Status:                      │
│ Original: ₹5,00,000                │
│ Current:  ₹6,20,000 (+24%)         │
│                                     │
│ 8 out-of-scope items flagged       │
│                                     │
│ [Send Warning] [Draft Change Order] │
└─────────────────────────────────────┘
```

## 💡 Next Steps

1. Implement budget-check API endpoint
2. Create email template functions
3. Set up cron job
4. Build UI components
5. Add to dashboard
6. Write tests
7. Deploy and monitor

Would you like me to continue implementing these remaining pieces?
