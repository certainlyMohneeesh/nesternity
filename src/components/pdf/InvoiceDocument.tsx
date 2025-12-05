import React from 'react'
import { Document, Page, Text, View, StyleSheet, Link, Image, Font } from '@react-pdf/renderer'

// Register Roboto font (Keep existing registration)
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
      fontWeight: 300,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf',
      fontWeight: 500,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
      fontWeight: 700,
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
    client: {
      name: string
      email: string
      company?: string | null
      address?: string | null
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

// LOGO CDN URL
const LOGO_URL = 'https://scmyzihaokadwwszaimd.supabase.co/storage/v1/object/public/nesternity-assets/nesternity_l.png'

// Helper for Currency
const getCurrencyLocale = (currency: string): string => {
  const localeMap: Record<string, string> = { INR: 'en-IN', USD: 'en-US', EUR: 'de-DE' }
  return localeMap[currency.toUpperCase()] || 'en-US'
}

// --- NEW STYLES ---
const styles = StyleSheet.create({
  page: {
    padding: 40, // Reduced from 50 to save space
    fontFamily: 'Roboto',
    backgroundColor: '#ffffff',
    color: '#111827',
    fontSize: 10,
    lineHeight: 1.4,
  },
  
  // Header Section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 'auto',
    marginBottom: 10,
  },
  companyAddress: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  titleBig: {
    fontSize: 36,
    fontFamily: 'Roboto', // Serif look like the reference
    fontWeight: 'normal',
    color: '#111827',
  },

  // Meta Grid (Bill To + Dates)
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 20,
  },
  colLeft: {
    width: '55%',
  },
  colRight: {
    width: '40%',
    alignItems: 'flex-end',
  },
  
  // Label Styles
  label: {
    fontSize: 8,
    color: '#6b7280',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  value: {
    fontSize: 11,
    color: '#111827',
    fontWeight: 'medium',
  },
  valueDate: {
    fontSize: 11,
    color: '#111827',
    textAlign: 'right',
  },
  
  // Table
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#111827', // Dark line like reference
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 10,
  },
  th: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#111827',
  },
  td: {
    fontSize: 10,
    color: '#374151',
  },
  // Column Widths
  cDesc: { flex: 3, textAlign: 'left' },
  cQty: { flex: 0.5, textAlign: 'center' },
  cRate: { flex: 1, textAlign: 'right' },
  cTotal: { flex: 1, textAlign: 'right' },

  // Footer Section (Totals + Notes)
  footerSection: {
    flexDirection: 'row',
    marginTop: 10,
  },
  footerLeft: {
    flex: 3,
    paddingRight: 40,
  },
  footerRight: {
    flex: 2,
  },

  // Totals
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 10,
    color: '#111827',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    textTransform: 'uppercase',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8E30C8',
  },

  // Clean Notes
  notesContainer: {
    marginTop: 0,
  },
  notesTitle: {
    fontSize: 12,
    fontFamily: 'Roboto', // Serif
    fontWeight: 'normal',
    marginBottom: 8,
    color: '#111827',
  },
  notesText: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.5,
  },

  // Bottom Payment Bar
  bottomBar: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentButton: {
    color: '#8E30C8', // Your Blue
    fontSize: 10,
    fontWeight: 'bold',
    textDecoration: 'none',
  },
  brandText: {
    fontSize: 8,
    color: '#525252ff',
  },
})

export const InvoiceDocument: React.FC<InvoiceProps> = ({ invoice }) => {
  const taxRate = invoice.taxRate || 0
  const discount = invoice.discount || 0
  const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const discountAmount = subtotal * (discount / 100)
  const total = subtotal + taxAmount - discountAmount

  const locale = getCurrencyLocale(invoice.currency)
  const formatAmount = (amount: number) => 
    amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Image src={LOGO_URL} style={styles.logo} />
            <Text style={styles.companyAddress}>Professional Project Management</Text>
            <Text style={styles.companyAddress}>nesternity@cyth.dev | www.nesternity.cyth.app</Text>
          </View>
          <Text style={styles.titleBig}>Invoice</Text>
        </View>

        {/* Meta Info Grid */}
        <View style={styles.metaContainer}>
          <View style={styles.colLeft}>
            <Text style={styles.label}>BILLED TO:</Text>
            <Text style={[styles.value, { fontWeight: 'bold', marginBottom: 2 }]}>
              {invoice.client.name}
            </Text>
            {invoice.client.company && <Text style={styles.value}>{invoice.client.company}</Text>}
            <Text style={[styles.value, { color: '#6b7280' }]}>{invoice.client.email}</Text>
            {invoice.client.address && <Text style={[styles.value, { color: '#6b7280' }]}>{invoice.client.address}</Text>}
          </View>
          
          <View style={styles.colRight}>
            <View style={{ marginBottom: 10 }}>
              <Text style={[styles.label, { textAlign: 'right' }]}>DATE</Text>
              <Text style={styles.valueDate}>{formatDate(invoice.createdAt)}</Text>
            </View>
            <View>
              <Text style={[styles.label, { textAlign: 'right' }]}>INVOICE NO.</Text>
              <Text style={styles.valueDate}>{invoice.invoiceNumber}</Text>
            </View>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.cDesc]}>DESCRIPTION</Text>
            <Text style={[styles.th, styles.cQty]}>QTY</Text>
            <Text style={[styles.th, styles.cRate]}>RATE</Text>
            <Text style={[styles.th, styles.cTotal]}>AMOUNT</Text>
          </View>
          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.td, styles.cDesc]}>{item.description}</Text>
              <Text style={[styles.td, styles.cQty]}>{item.quantity}</Text>
              <Text style={[styles.td, styles.cRate]}>{invoice.currency} {formatAmount(item.rate)}</Text>
              <Text style={[styles.td, styles.cTotal]}>{invoice.currency} {formatAmount(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Footer Area: Split into Left (Notes) and Right (Totals) */}
        <View style={styles.footerSection}>
          <View style={styles.footerLeft}>
            <View style={styles.notesContainer}>
              {/* <Text style={styles.notesTitle}>Payment Info</Text>
              <Text style={styles.notesText}>Nesternity</Text>
              <Text style={styles.notesText}>Bank: Really Great Bank</Text>
              <Text style={styles.notesText}>Account No: 0123 4567 8901</Text> */}
              
              {invoice.notes && (
                <View style={{ marginTop: 15 }}>
                  <Text style={[styles.notesTitle, { fontSize: 10 }]}>Notes</Text>
                  <Text style={styles.notesText}>{invoice.notes}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.footerRight}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sub-Total</Text>
              <Text style={styles.summaryValue}>{invoice.currency} {formatAmount(subtotal)}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount ({discount}%)</Text>
                <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                  -{invoice.currency} {formatAmount(discountAmount)}
                </Text>
              </View>
            )}
            {taxRate > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax ({taxRate}%)</Text>
                <Text style={styles.summaryValue}>{invoice.currency} {formatAmount(taxAmount)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>{invoice.currency} {formatAmount(total)}</Text>
            </View>
          </View>
        </View>

        {/* Bottom Bar (Payment Link & Brand) */}
        <View style={styles.bottomBar}>
           <View>
             <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#8E30C8' }}>Nesternity</Text>
             <Text style={styles.brandText}>nesternity@cyth.dev</Text>
           </View>
           
           {invoice.enablePaymentLink && invoice.paymentUrl && (
             <Link src={invoice.paymentUrl} style={styles.paymentButton}>
               CLICK TO PAY ONLINE →
             </Link>
           )}
        </View>

      </Page>
    </Document>
  )
}