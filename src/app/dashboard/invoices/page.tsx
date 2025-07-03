import { Prisma } from '@prisma/client'
import { DownloadInvoiceButton } from '@/components/invoices/DownloadButton'
import { Badge } from '@/components/ui/badge'

export default async function InvoiceHistoryPage() {
  const invoices = await Prisma.invoice.findMany({
    orderBy: { issuedDate: 'desc' },
    include: { client: true },
  })

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Invoice History</h1>
      <div className="space-y-2">
        {invoices.map((invoice) => (
          <div
            key={invoice.id}
            className="border rounded-xl p-4 flex justify-between items-center"
          >
            <div>
              <h2 className="text-lg font-medium">{invoice.invoiceNumber}</h2>
              <p className="text-sm text-muted-foreground">
                {invoice.client.name} &middot; Due {invoice.dueDate.toDateString()}
              </p>
              <Badge variant={
                invoice.status === 'PAID' ? 'success' :
                invoice.status === 'OVERDUE' ? 'destructive' :
                invoice.status === 'CANCELLED' ? 'secondary' : 'default'
              }>
                {invoice.status}
              </Badge>
            </div>
            <DownloadInvoiceButton pdfUrl={invoice.pdfUrl} />
          </div>
        ))}
      </div>
    </div>
  )
}
