import React from 'react'
import { Document, Page, Text, View, StyleSheet, Link, Image } from '@react-pdf/renderer'

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

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 10,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  invoiceNumber: {
    fontSize: 18,
    marginBottom: 15,
    fontWeight: 'bold',
    color: '#374151',
  },
  dateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  dateItem: {
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 10,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  clientSection: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  clientTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#374151',
  },
  clientName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  clientInfo: {
    fontSize: 11,
    marginBottom: 3,
    color: '#6b7280',
  },
  table: {
    width: 'auto',
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    minHeight: 40,
    alignItems: 'center',
  },
  tableColHeader: {
    padding: 12,
    flex: 1,
  },
  tableCol: {
    padding: 12,
    flex: 1,
    justifyContent: 'center',
  },
  tableColDescription: {
    flex: 2,
  },
  tableColAmount: {
    flex: 1,
    alignItems: 'flex-end',
  },
  tableCellHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  tableCell: {
    fontSize: 11,
    color: '#374151',
  },
  tableCellAmount: {
    fontSize: 11,
    color: '#374151',
    textAlign: 'right',
  },
  totalsSection: {
    alignSelf: 'flex-end',
    width: '50%',
    paddingLeft: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  totalLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
  },
  finalTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    paddingHorizontal: 12,
    borderTopWidth: 2,
    borderTopColor: '#374151',
  },
  finalTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  finalTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  notesSection: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
  },
  notesText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#6b7280',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#9ca3af',
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'rotate(-45deg) translate(-50%, -50%)',
    fontSize: 60,
    color: '#f3f4f6',
    fontWeight: 'bold',
    zIndex: -1,
    opacity: 0.1,
  },
  paymentSection: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    border: '2 solid #3b82f6',
    alignItems: 'center',
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1d4ed8',
    marginBottom: 8,
  },
  paymentButton: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    padding: 12,
    borderRadius: 6,
    textDecoration: 'none',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    minWidth: 150,
  },
  paymentText: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  signatureSection: {
    marginTop: 30,
    alignItems: 'flex-end',
  },
  signatureTitle: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 8,
  },
  signatureImage: {
    width: 120,
    height: 60,
    objectFit: 'contain',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#6b7280',
    width: 150,
    marginTop: 40,
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
  },
})

export const InvoiceDocument: React.FC<InvoiceProps> = ({ invoice }) => {
  // Safe calculations with null handling
  const taxRate = invoice.taxRate || 0
  const discount = invoice.discount || 0
  
  const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const discountAmount = subtotal * (discount / 100)
  const total = subtotal + taxAmount - discountAmount

  // Format dates safely
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
        {/* Watermark */}
        {invoice.watermarkText && (
          <View style={styles.watermark}>
            <Text>{invoice.watermarkText}</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>INVOICE</Text>
          <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
        </View>

        {/* Date Section */}
        <View style={styles.dateSection}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Issue Date</Text>
            <Text style={styles.dateValue}>{formatDate(invoice.createdAt)}</Text>
          </View>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Due Date</Text>
            <Text style={styles.dateValue}>{formatDate(invoice.dueDate)}</Text>
          </View>
        </View>

        {/* Client Information */}
        <View style={styles.clientSection}>
          <Text style={styles.clientTitle}>Bill To:</Text>
          <Text style={styles.clientName}>{invoice.client.name}</Text>
          {invoice.client.company && (
            <Text style={styles.clientInfo}>{invoice.client.company}</Text>
          )}
          <Text style={styles.clientInfo}>{invoice.client.email}</Text>
          {invoice.client.address && (
            <Text style={styles.clientInfo}>{invoice.client.address}</Text>
          )}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={[styles.tableColHeader, styles.tableColDescription]}>
              <Text style={styles.tableCellHeader}>Description</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Qty</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Rate</Text>
            </View>
            <View style={[styles.tableColHeader, styles.tableColAmount]}>
              <Text style={styles.tableCellHeader}>Amount</Text>
            </View>
          </View>

          {/* Table Rows */}
          {invoice.items.map((item, index) => (
            <View style={styles.tableRow} key={item.id || index}>
              <View style={[styles.tableCol, styles.tableColDescription]}>
                <Text style={styles.tableCell}>{item.description}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{item.quantity}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {invoice.currency} {item.rate.toFixed(2)}
                </Text>
              </View>
              <View style={[styles.tableCol, styles.tableColAmount]}>
                <Text style={styles.tableCellAmount}>
                  {invoice.currency} {item.total.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              {invoice.currency} {subtotal.toFixed(2)}
            </Text>
          </View>
          
          {discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount ({discount}%):</Text>
              <Text style={styles.totalValue}>
                -{invoice.currency} {discountAmount.toFixed(2)}
              </Text>
            </View>
          )}
          
          {taxRate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({taxRate}%):</Text>
              <Text style={styles.totalValue}>
                {invoice.currency} {taxAmount.toFixed(2)}
              </Text>
            </View>
          )}
          
          <View style={styles.finalTotal}>
            <Text style={styles.finalTotalLabel}>Total:</Text>
            <Text style={styles.finalTotalValue}>
              {invoice.currency} {total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Payment Section */}
        {invoice.enablePaymentLink && invoice.paymentUrl && (
          <View style={styles.paymentSection}>
            <Text style={styles.paymentTitle}>💳 Pay Online</Text>
            <Link src={invoice.paymentUrl} style={styles.paymentButton}>
              PAY NOW - {invoice.currency} {total.toFixed(2)}
            </Link>
            <Text style={styles.paymentText}>
              Click the button above to pay securely online with your credit card
            </Text>
          </View>
        )}

        {/* Notes Section */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* E-Signature Section */}
        {invoice.eSignatureUrl && (
          <View style={styles.signatureSection}>
            <Text style={styles.signatureTitle}>Authorized Signature:</Text>
            <Image 
              style={styles.signatureImage} 
              src={invoice.eSignatureUrl}
            />
          </View>
        )}

        {/* Alternative signature line if no e-signature */}
        {!invoice.eSignatureUrl && (
          <View style={styles.signatureSection}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Authorized Signature</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Thank you for your business! • Generated on {new Date().toLocaleDateString()}
        </Text>
      </Page>
    </Document>
  )
}
