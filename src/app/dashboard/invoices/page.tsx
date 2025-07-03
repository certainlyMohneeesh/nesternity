import { prisma } from '@/lib/db'
import { DownloadInvoiceButton } from '@/components/invoices/DownloadButton'
import { Badge } from '@/components/ui/badge'

interface Invoice {
  id: string
  invoiceNumber: string
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  dueDate: Date
  pdfUrl?: string | null
  client: {
    id: string
    name: string
    email: string
  }
}

export default async function InvoiceHistoryPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { issuedDate: 'desc' },
    include: { client: true },
  }) as Invoice[]

  const getStatusVariant = (status: Invoice['status']) => {
    switch (status) {
      case 'PAID':
        return 'default' // Use 'default' instead of 'success'
      case 'OVERDUE':
        return 'destructive'
      case 'CANCELLED':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Invoice History</h1>
      <div className="space-y-2">
        {invoices.map((invoice: Invoice) => (
          <div
            key={invoice.id}
            className="border rounded-xl p-4 flex justify-between items-center"
          >
            <div>
              <h2 className="text-lg font-medium">{invoice.invoiceNumber}</h2>
              <p className="text-sm text-muted-foreground">
                {invoice.client.name} &middot; Due {invoice.dueDate.toDateString()}
              </p>
              <Badge variant={getStatusVariant(invoice.status)}>
                {invoice.status}
              </Badge>
            </div>
            <DownloadInvoiceButton 
              pdfUrl={invoice.pdfUrl} 
              invoiceNumber={invoice.invoiceNumber}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
