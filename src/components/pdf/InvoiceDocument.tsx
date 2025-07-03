import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

interface InvoiceProps {
  invoice: {
    id: string
    invoiceNumber: string
    issuedDate: Date
    dueDate: Date
    notes?: string
    taxRate: number
    discount: number
    client: {
      id: string
      name: string
      email: string
      address?: string
    }
    issuedBy: {
      id: string
      email: string
      displayName?: string
    }
    items: Array<{
      id: string
      description: string
      quantity: number
      rate: number
      amount: number
    }>
  }
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  invoiceNumber: {
    fontSize: 16,
    marginBottom: 5,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  clientInfo: {
    marginBottom: 20,
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f0f0f0',
    padding: 8,
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 8,
  },
  tableCellHeader: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  tableCell: {
    fontSize: 10,
  },
  total: {
    marginTop: 20,
    alignSelf: 'flex-end',
    width: '40%',
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  },
})

export const InvoiceDocument: React.FC<InvoiceProps> = ({ invoice }) => {
  const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0)
  const taxAmount = subtotal * (invoice.taxRate / 100)
  const discountAmount = subtotal * (invoice.discount / 100)
  const total = subtotal + taxAmount - discountAmount

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>INVOICE</Text>
          <Text style={styles.invoiceNumber}>Invoice #{invoice.invoiceNumber}</Text>
          <Text style={styles.text}>Issued: {invoice.issuedDate.toLocaleDateString()}</Text>
          <Text style={styles.text}>Due: {invoice.dueDate.toLocaleDateString()}</Text>
        </View>

        <View style={styles.clientInfo}>
          <Text style={styles.text}>Bill To:</Text>
          <Text style={styles.text}>{invoice.client.name}</Text>
          <Text style={styles.text}>{invoice.client.email}</Text>
          {invoice.client.address && (
            <Text style={styles.text}>{invoice.client.address}</Text>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Description</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Quantity</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Rate</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Amount</Text>
            </View>
          </View>
          {invoice.items.map((item) => (
            <View style={styles.tableRow} key={item.id}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{item.description}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{item.quantity}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>${item.rate.toFixed(2)}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>${item.amount.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.total}>
          <Text style={styles.text}>Subtotal: ${subtotal.toFixed(2)}</Text>
          {invoice.discount > 0 && (
            <Text style={styles.text}>Discount ({invoice.discount}%): -${discountAmount.toFixed(2)}</Text>
          )}
          {invoice.taxRate > 0 && (
            <Text style={styles.text}>Tax ({invoice.taxRate}%): ${taxAmount.toFixed(2)}</Text>
          )}
          <Text style={[styles.text, { fontWeight: 'bold', fontSize: 14 }]}>
            Total: ${total.toFixed(2)}
          </Text>
        </View>

        {invoice.notes && (
          <View style={[styles.section, { marginTop: 30 }]}>
            <Text style={styles.text}>Notes:</Text>
            <Text style={styles.text}>{invoice.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  )
}
