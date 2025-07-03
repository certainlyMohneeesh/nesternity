import { renderToBuffer } from '@react-pdf/renderer'
import { uploadInvoicePDF } from '@/lib/uploadToSupabase'
import { prisma } from '@/lib/db'
import React from 'react'

interface InvoiceData {
  invoiceNumber: string;
  clientId: string;
  dueDate: string;
  notes?: string;
  taxRate: string;
  discount: string;
}

export async function generatePdf(data: InvoiceData) {
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

  // For now, create a simple PDF buffer until we set up the full PDF generation
  const pdfBuffer = Buffer.from('Simple PDF placeholder for invoice: ' + invoice.invoiceNumber)

  const filename = `${invoice.invoiceNumber}.pdf`
  const pdfUrl = await uploadInvoicePDF(pdfBuffer, filename)

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { pdfUrl },
  })

  return { invoice, pdfUrl }
}
