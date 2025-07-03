import { renderToStream } from '@react-pdf/renderer'
import { InvoiceDocument } from '@/components/pdf/InvoiceDocument'
import { uploadInvoicePDF } from '@/lib/uploadToSupabase'
import { prisma } from '@/lib/prisma'

export async function generatePdf(data: any) {
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: data.invoiceNumber,
      clientId: data.clientId,
      issuedById: 'YOUR_USER_ID',
      dueDate: new Date(data.dueDate),
      notes: data.notes,
      taxRate: parseFloat(data.taxRate),
      discount: parseFloat(data.discount),
    },
    include: {
      client: true,
      issuedBy: true,
      items: true,
    },
  })

  const pdfStream = await renderToStream(<InvoiceDocument invoice={invoice} />)

  const chunks: Buffer[] = []
  for await (const chunk of pdfStream) chunks.push(chunk)
  const pdfBuffer = Buffer.concat(chunks)

  const filename = `${invoice.invoiceNumber}.pdf`
  const pdfUrl = await uploadInvoicePDF(pdfBuffer, filename)

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { pdfUrl },
  })
}
