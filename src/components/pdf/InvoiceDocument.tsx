import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40 },
  header: { fontSize: 20, marginBottom: 20 },
  section: { marginBottom: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
})

export const InvoiceDocument = ({ invoice }: { invoice: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Invoice: {invoice.invoiceNumber}</Text>

      <View style={styles.section}>
        <Text>Client: {invoice.client.name}</Text>
        <Text>Due Date: {invoice.dueDate}</Text>
        <Text>Issued By: {invoice.issuedBy.displayName}</Text>
      </View>

      {invoice.items.map((item: any, idx: number) => (
        <View key={idx} style={styles.itemRow}>
          <Text>{item.description}</Text>
          <Text>{item.quantity} x {item.rate}</Text>
        </View>
      ))}

      <View style={styles.section}>
        <Text>Tax: {invoice.taxRate}%</Text>
        <Text>Discount: {invoice.discount}%</Text>
        <Text>Total: ₹{invoice.total}</Text>
      </View>
    </Page>
  </Document>
)
