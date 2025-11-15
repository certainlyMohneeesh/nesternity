import { NextRequest, NextResponse } from 'next/server'
import { createPaymentLink } from '@/lib/razorpay'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { invoiceId } = body
  if (!invoiceId) return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })

  // Load invoice
  const invoice = await db.invoice.findUnique({ where: { id: invoiceId }, include: { client: true, items: true } })
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  const amount = Math.round((invoice.items.reduce((s, i) => s + Number(i.total || 0), 0) || 0) * 100) // paise
  const options = {
    amount,
    currency: invoice.currency || 'INR',
    description: `Invoice ${invoice.invoiceNumber}`,
    customer: {
      name: invoice.client.name || '',
      email: invoice.client.email || '',
      contact: invoice.client.phone || '',
    },
    reference_id: invoice.id,
  }

  try {
    const paymentLink = await createPaymentLink(options)
    // Persist link info
    await db.invoice.update({ where: { id: invoiceId }, data: { razorpayPaymentLinkId: paymentLink.id, razorpayPaymentLinkUrl: paymentLink.short_url, razorpayPaymentLinkStatus: paymentLink.status } })
    return NextResponse.json({ paymentLink })
  } catch (err) {
    console.error('Create order error:', err)
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 })
  }
}
