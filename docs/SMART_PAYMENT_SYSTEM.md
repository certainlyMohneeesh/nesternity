# Smart Payment System - Usage Guide

## Overview
Complete implementation of UPI/QR payments, bank transfers, and international payments (Dodo BYOK) with analytics.

---

## 1. SmartPaymentRouter Component

### Purpose
Intelligent payment method selector that automatically routes based on:
- Client location (India/International)
- Amount threshold (₹1,00,000 for bank transfer)
- Currency (INR/USD/etc.)
- Payment settings configuration

### Usage Example

```tsx
import { SmartPaymentRouter } from '@/components/SmartPaymentRouter';

export default function InvoicePage({ invoice }) {
  return (
    <div>
      <h1>Invoice #{invoice.invoiceNumber}</h1>
      
      <SmartPaymentRouter
        amount={invoice.totalAmount}
        currency={invoice.currency}
        invoiceId={invoice.id}
        clientCountry={invoice.client.country}
        onPaymentMethodSelected={(method) => {
          console.log('Payment method selected:', method);
          // Track analytics, update UI, etc.
        }}
      />
    </div>
  );
}
```

### Features
- ✅ Auto-detects best payment method
- ✅ UPI QR generation for Indian payments < ₹1L
- ✅ Bank transfer details for amounts ≥ ₹1L
- ✅ Dodo Payments checkout for international
- ✅ Tab interface with India/International toggle
- ✅ Real-time validation of payment settings
- ✅ Beautiful UI with badges and icons

---

## 2. QR Analytics Dashboard

### Purpose
Comprehensive analytics for tracking QR code visits, user behavior, and conversion metrics.

### Usage Example

```tsx
import { QrAnalyticsDashboard } from '@/components/analytics/QrAnalyticsDashboard';

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto py-8">
      <QrAnalyticsDashboard />
    </div>
  );
}
```

### Features

#### Summary Metrics
- **Total Visits**: All QR code scans
- **Unique Visitors**: Based on IP addresses
- **QR Codes**: Number of active payment QRs
- **Avg Visits/QR**: Average engagement per QR

#### Device Breakdown
- Mobile (with percentage bar)
- Desktop (with percentage bar)
- Tablet (with percentage bar)

#### Geographic Distribution
- Top 5 countries by visits
- Percentage distribution
- Visual indicators

#### Browser Analytics
- Top 5 browsers used
- Visit counts and percentages

#### Top Performing QRs
- Most visited QR codes
- Amount and note display
- Visit counts with rankings

#### Timeline View
- Daily visit distribution
- Visual bar charts
- Last 14 days by default

#### Recent Visits Table
- Latest 50 scans
- Device, location, IP tracking
- Timestamp with relative time

### API Endpoint

**GET** `/api/analytics/qr-visits`

Query Parameters:
- `days` (optional): 7, 30, or 90 (default: 30)
- `qrId` (optional): Filter by specific QR code

Response:
```json
{
  "success": true,
  "period": {
    "days": 30,
    "startDate": "2024-11-09T00:00:00.000Z",
    "endDate": "2024-12-09T00:00:00.000Z"
  },
  "summary": {
    "totalVisits": 1234,
    "uniqueIps": 567,
    "uniqueQrs": 45,
    "avgVisitsPerQr": 27.4
  },
  "deviceBreakdown": {
    "mobile": 890,
    "tablet": 123,
    "desktop": 221
  },
  "locationBreakdown": {
    "India": 1100,
    "United States": 89,
    "United Kingdom": 45
  },
  "browserBreakdown": {
    "Chrome": 678,
    "Safari": 345,
    "Firefox": 211
  },
  "visitsByDay": {
    "2024-12-09": 45,
    "2024-12-08": 52,
    "2024-12-07": 38
  },
  "topQrs": [
    {
      "qrId": "clxxx123",
      "visits": 234,
      "amount": 50000,
      "note": "Website Development Invoice",
      "invoiceId": "inv_123"
    }
  ],
  "recentVisits": [...]
}
```

---

## 3. Payment Settings Configuration

Users must configure payment settings before accepting payments:

### India Tab
- **UPI ID**: yourname@paytm
- **Merchant Name**: Business name shown in UPI apps
- **Bank Details**: Account holder, number, IFSC, bank name, branch
- **Account Type**: Savings or Current
- **Bank Transfer Threshold**: Amount above which bank transfer is shown (default: ₹1,00,000)

### International Tab
- **Enable International**: Toggle for Dodo Payments
- **Dodo Account ID**: acc_xxxxxxxxxxxxxxxx
- **Dodo API Key**: sk_test_/sk_live_ (with show/hide toggle)
- **Mode**: TEST or LIVE

### Business Info Tab
- Contact: Email, phone
- Business: Legal name, PAN, GST
- Address: Full address details

---

## 4. Payment Flow

### For Indian Clients (INR, < ₹1L)
1. User selects amount → SmartPaymentRouter
2. System detects India + INR → Shows UPI option
3. User clicks "Generate Payment QR"
4. API creates UpiQr entry
5. Redirects to `/pay/{qrId}`
6. Displays beautiful QR code
7. User scans → Visit tracked in QrVisit table
8. Payment confirmed → Update invoice

### For Indian Clients (INR, ≥ ₹1L)
1. SmartPaymentRouter detects high amount
2. Shows bank transfer option
3. Redirects to payment page
4. Displays bank account details
5. User transfers → Manual verification
6. Admin confirms → Update invoice

### For International Clients
1. SmartPaymentRouter detects non-India/non-INR
2. Shows Dodo Payments option
3. User clicks "Pay with Dodo"
4. API creates checkout session
5. Redirects to Dodo checkout URL
6. Webhook handles payment events
7. Auto-updates invoice status

---

## 5. Database Schema

### UpiQr Table
```prisma
model UpiQr {
  id                String
  paymentSettingsId String
  invoiceId         String? @unique
  amount            Float?
  note              String?
  currency          String  @default("INR")
  isActive          Boolean @default(true)
  expiresAt         DateTime?
  createdAt         DateTime
  updatedAt         DateTime
  
  paymentSettings   PaymentSettings
  visits            QrVisit[]
}
```

### QrVisit Table
```prisma
model QrVisit {
  id          String
  qrId        String
  ipAddress   String?
  userAgent   String?
  country     String?
  city        String?
  referrer    String?
  visitedAt   DateTime
  
  qr          UpiQr
}
```

---

## 6. Export Analytics

Users can export analytics data as CSV:

```javascript
function exportData() {
  // Click "Export CSV" button
  // Generates CSV with columns:
  // Date, QR ID, Device, Country, City, IP Address
  // Downloads as: qr-analytics-{days}days.csv
}
```

---

## 7. Security Features

✅ Authentication required for all endpoints
✅ Ownership verification (user can only see their QRs)
✅ API keys encrypted (show/hide toggle)
✅ Visit tracking non-blocking (doesn't affect page load)
✅ HTTPS required for payment pages
✅ CORS protection on APIs

---

## 8. Mobile Optimization

- Responsive design (works on all screen sizes)
- Touch-friendly buttons
- QR codes optimized for mobile scanning
- "Pay with UPI App" deep link button
- Progressive enhancement

---

## 9. Error Handling

All components handle:
- Missing payment settings → Clear error messages
- Network failures → Toast notifications
- Invalid data → Validation messages
- Loading states → Skeleton screens
- Empty states → Helpful placeholders

---

## 10. Next Steps

### Immediate
1. Test payment flow end-to-end
2. Configure payment settings
3. Generate test QR codes
4. Verify analytics tracking

### Optional Enhancements
- Email notifications for payments
- SMS alerts for high-value transactions
- Webhook integration with accounting software
- Custom QR code branding/logos
- Payment reminders for unpaid invoices
- Multi-currency support expansion
- Payment plan/installment options

---

## Support

For issues or questions:
1. Check payment settings configuration
2. Verify .env variables (DATABASE_URL, DIRECT_URL)
3. Check Prisma client generation
4. Review API endpoint logs
5. Test with small amounts first

---

**Status**: ✅ All 8 todos completed!
**Tech Stack**: Next.js 16, Prisma 7.1.0, Bun, PostgreSQL, Supabase
**Payment Providers**: UPI (native), Bank Transfer (native), Dodo Payments (BYOK)
