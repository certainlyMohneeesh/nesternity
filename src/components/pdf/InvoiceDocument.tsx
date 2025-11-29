import React from 'react'
import { Document, Page, Text, View, StyleSheet, Link, Image, Font } from '@react-pdf/renderer'
import { replaceSymbolWithCurrencyCode } from '@/lib/utils'

// Register Roboto font for Unicode symbol support (Industry Standard)
// This ensures currency symbols like ₹, €, £, ¥ display correctly
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
      fontWeight: 300,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-lightitalic-webfont.ttf',
      fontWeight: 300,
      fontStyle: 'italic',
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf',
      fontWeight: 400,
      fontStyle: 'italic',
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf',
      fontWeight: 500,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-mediumitalic-webfont.ttf',
      fontWeight: 500,
      fontStyle: 'italic',
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
      fontWeight: 700,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bolditalic-webfont.ttf',
      fontWeight: 700,
      fontStyle: 'italic',
    },
  ],
})

interface InvoiceProps {
  invoice: {
    id: string
    invoiceNumber: string
    createdAt: Date | string
    dueDate: Date | string
    notes?: string | null
    taxRate: number | null
    discount: number | null
    currency: string
    enablePaymentLink?: boolean
    paymentUrl?: string | null
    watermarkText?: string | null
    eSignatureUrl?: string | null
    client: {
      id?: string
      name: string
      email: string
      company?: string | null
      address?: string | null
    }
    issuedBy?: {
      id: string
      email: string
      displayName?: string | null
    }
    items: Array<{
      id?: string
      description: string
      quantity: number
      rate: number
      total: number
    }>
  }
}

// LOGO CDN URL - Replace this with your Cloudflare CDN URL after setup
const LOGO_URL = 'https://scmyzihaokadwwszaimd.supabase.co/storage/v1/object/public/nesternity-assets/nesternity_l.png' // Update this!

// Get locale for currency formatting
const getCurrencyLocale = (currency: string): string => {
  const localeMap: Record<string, string> = {
    INR: 'en-IN',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    JPY: 'ja-JP',
    CNY: 'zh-CN',
    AUD: 'en-AU',
    CAD: 'en-CA',
    SGD: 'en-SG',
    HKD: 'zh-HK',
    NZD: 'en-NZ',
    BRL: 'pt-BR',
    MXN: 'es-MX',
    KRW: 'ko-KR',
  }
  return localeMap[currency.toUpperCase()] || 'en-US'
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 50,
    fontFamily: 'Roboto',
    position: 'relative',
  },
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    pointerEvents: 'none',
  },
  watermark: {
    fontSize: 70,
    color: '#f3f4f6',
    fontWeight: 'bold',
    opacity: 0.3,
    transform: 'rotate(-45deg)',
    textAlign: 'center',
  },
  content: {
    zIndex: 2,
    position: 'relative',
  },
  // Professional Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  logoSection: {
    flex: 1,
  },
  logo: {
    width: 140,
    height: 40,
    objectFit: 'contain',
    objectPosition: 'left center',
    marginBottom: 15,
    marginLeft: 0,
  },
  companyInfo: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.5,
    marginBottom: 2,
  },
  invoiceDetails: {
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  invoiceNumber: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 15,
  },
  badge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Date Section
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 35,
    gap: 30,
  },
  dateCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateLabel: {
    fontSize: 9,
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  // Billing Section
  billingSection: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 35,
  },
  billingCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  billingTitle: {
    fontSize: 11,
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  billingName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  billingInfo: {
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 1.6,
    marginBottom: 3,
  },
  // Modern Table
  table: {
    marginBottom: 30,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 14,
    paddingHorizontal: 15,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableCell: {
    fontSize: 11,
    color: '#1f2937',
  },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: 'center' },
  col3: { flex: 1.5, textAlign: 'right' },
  col4: { flex: 1.5, textAlign: 'right' },
  // Summary Section
  summarySection: {
    alignSelf: 'flex-end',
    width: '45%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#2563eb',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  // Notes & Payment
  notesSection: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    borderRadius: 6,
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 10,
    color: '#78350f',
    lineHeight: 1.6,
  },
  paymentSection: {
    marginTop: 30,
    padding: 25,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3b82f6',
    alignItems: 'center',
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 12,
  },
  paymentButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 10,
  },
  paymentButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  paymentHint: {
    fontSize: 9,
    color: '#64748b',
    textAlign: 'center',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 50,
    right: 50,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  poweredBy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  poweredByText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  nesternity: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#2563eb',
  },
})

export const InvoiceDocument: React.FC<InvoiceProps> = ({ invoice }) => {
  const taxRate = invoice.taxRate || 0
  const discount = invoice.discount || 0

  const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const discountAmount = subtotal * (discount / 100)
  const total = subtotal + taxAmount - discountAmount

  // Get locale for currency formatting
  const locale = getCurrencyLocale(invoice.currency)

  // Format amounts with currency code (more reliable than symbols in PDF)
  const formatAmount = (amount: number) => {
    const formatted = amount.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    return `${invoice.currency} ${formatted}`
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {invoice.watermarkText && (
          <View style={styles.watermarkContainer}>
            <Text style={styles.watermark}>{invoice.watermarkText}</Text>
          </View>
        )}

        <View style={styles.content}>
          {/* Professional Header */}
          <View style={styles.header}>
            <View style={styles.logoSection}>
              <Image
                src={LOGO_URL}
                style={styles.logo}
              />
              <Text style={styles.companyInfo}>Professional Project Management</Text>
              <Text style={styles.companyInfo}>Email: hello@nesternity.com</Text>
              <Text style={styles.companyInfo}>Web: www.nesternity.com</Text>
            </View>
            <View style={styles.invoiceDetails}>
              <Text style={styles.invoiceTitle}>INVOICE</Text>
              <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
              <View style={styles.badge}>
                <Text>Amount Due</Text>
              </View>
            </View>
          </View>

          {/* Date Cards */}
          <View style={styles.dateRow}>
            <View style={styles.dateCard}>
              <Text style={styles.dateLabel}>Issue Date</Text>
              <Text style={styles.dateValue}>{formatDate(invoice.createdAt)}</Text>
            </View>
            <View style={styles.dateCard}>
              <Text style={styles.dateLabel}>Due Date</Text>
              <Text style={styles.dateValue}>{formatDate(invoice.dueDate)}</Text>
            </View>
          </View>

          {/* Billing Information */}
          <View style={styles.billingSection}>
            <View style={styles.billingCard}>
              <Text style={styles.billingTitle}>Bill To</Text>
              <Text style={styles.billingName}>{invoice.client.name}</Text>
              {invoice.client.company && (
                <Text style={styles.billingInfo}>{invoice.client.company}</Text>
              )}
              <Text style={styles.billingInfo}>{invoice.client.email}</Text>
              {invoice.client.address && (
                <Text style={styles.billingInfo}>{invoice.client.address}</Text>
              )}
            </View>
          </View>

          {/* Items Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.col1]}>Description</Text>
              <Text style={[styles.tableHeaderText, styles.col2]}>Qty</Text>
              <Text style={[styles.tableHeaderText, styles.col3]}>Rate</Text>
              <Text style={[styles.tableHeaderText, styles.col4]}>Amount</Text>
            </View>
            {invoice.items.map((item, index) => (
              <View style={styles.tableRow} key={item.id || index}>
                <Text style={[styles.tableCell, styles.col1]}>{item.description}</Text>
                <Text style={[styles.tableCell, styles.col2]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.col3]}>
                  {formatAmount(item.rate)}
                </Text>
                <Text style={[styles.tableCell, styles.col4]}>
                  {formatAmount(item.total)}
                </Text>
              </View>
            ))}
          </View>

          {/* Summary */}
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {formatAmount(subtotal)}
              </Text>
            </View>
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount ({discount}%)</Text>
                <Text style={styles.summaryValue}>
                  -{formatAmount(discountAmount)}
                </Text>
              </View>
            )}
            {taxRate > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax ({taxRate}%)</Text>
                <Text style={styles.summaryValue}>
                  {formatAmount(taxAmount)}
                </Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Due</Text>
              <Text style={styles.totalValue}>
                {formatAmount(total)}
              </Text>
            </View>
          </View>

          {/* Payment Link */}
          {invoice.enablePaymentLink && invoice.paymentUrl && (
            <View style={styles.paymentSection}>
              <Text style={styles.paymentTitle}>💳 Pay Securely Online</Text>
              <Link src={invoice.paymentUrl} style={styles.paymentButton}>
                <Text style={styles.paymentButtonText}>
                  PAY {formatAmount(total)}
                </Text>
              </Link>
              <Text style={styles.paymentHint}>
                Click to pay securely with credit card or bank transfer
              </Text>
            </View>
          )}

          {/* Notes */}
          {invoice.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesTitle}>Notes</Text>
              <Text style={styles.notesText}>{invoice.notes}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>
              Thank you for your business!
            </Text>
            <View style={styles.poweredBy}>
              <Text style={styles.poweredByText}>Powered by</Text>
              <Text style={styles.nesternity}>Nesternity</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}