import { NextRequest, NextResponse } from 'next/server'
import { parseWebhookEvent } from '@/lib/razorpay'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  const bodyText = await request.text()
  const signature = request.headers.get('x-razorpay-signature') || ''

  const event = parseWebhookEvent(bodyText, signature)
  if (!event) return NextResponse.json({ ok: false }, { status: 400 })

  try {
    // Handle payment link paid
    if (event.event === 'payment_link.paid') {
      const link = event.payload.payment_link.entity
      const payment = event.payload.payment?.entity

      if (payment) {
        const invoiceRef = link.reference_id // may be invoice id
        let userId = ''
        let customerId = ''

        // Try to find invoice by reference (if we stored invoice id as reference_id when creating link)
        if (invoiceRef) {
          const inv = await db.invoice.findUnique({ where: { id: invoiceRef } })
          if (inv) userId = inv.issuedById || ''
        }

        // Try to find customer by razorpay customer id if present in link
        if (link?.user_id) {
          const customer = await db.razorpayCustomer.findFirst({ where: { razorpayCustomerId: link.user_id } })
          if (customer) {
            customerId = customer.id
            if (!userId) userId = customer.userId
          }
        }

        // Fallback: find customer by email if present on the payment
        if (!customerId && payment.email) {
          const customerByEmail = await db.razorpayCustomer.findFirst({ where: { email: payment.email } })
          if (customerByEmail) {
            customerId = customerByEmail.id
            if (!userId) userId = customerByEmail.userId
          }
        }

        // Persist payment
        await db.razorpayPayment.create({
          data: {
            userId: userId || '',
            customerId: customerId || '',
            razorpayPaymentId: payment.id,
            razorpayOrderId: payment.order_id,
            amount: payment.amount,
            currency: payment.currency,
            status: 'CAPTURED',
            method: payment.method || undefined,
            description: payment.description || undefined,
            email: payment.email || undefined,
            contact: payment.contact || undefined,
            invoiceId: invoiceRef ?? undefined,
            notes: {},
          }
        })
      }
    }

    // Handle subscription lifecycle events
    if (event.event?.startsWith('subscription')) {
      const sub = (event.payload as any)['subscription'] as any
      if (sub && sub.entity) {
        const entity = sub.entity
        // Upsert subscription
        // Map to internal customer & user if possible (find by razorpay customer id)
        let mappedUserId = ''
        let mappedCustomerId = ''
        if (entity.customer_id) {
          const cust = await db.razorpayCustomer.findFirst({ where: { razorpayCustomerId: entity.customer_id } })
          if (cust) {
            mappedCustomerId = cust.id
            mappedUserId = cust.userId
          }
        }

        const existing = await db.razorpaySubscription.findFirst({ where: { razorpaySubscriptionId: entity.id } })
        if (!existing) {
          await db.razorpaySubscription.create({
            data: {
              id: `rs_${Date.now()}`,
              userId: mappedUserId || '',
              customerId: mappedCustomerId || entity.customer_id || '',
              razorpaySubscriptionId: entity.id,
              razorpayPlanId: entity.plan_id || '',
              status: entity.status || 'ACTIVE',
              planTier: 'STARTER',
              quantity: entity.quantity ?? 1,
              currentPeriodStart: entity.current_start ? new Date(entity.current_start * 1000) : new Date(),
              currentPeriodEnd: entity.current_end ? new Date(entity.current_end * 1000) : new Date(),
              shortUrl: entity.short_url || undefined,
            }
          })
        } else {
          await db.razorpaySubscription.update({ where: { id: existing.id }, data: { customerId: mappedCustomerId || entity.customer_id || '', razorpayPlanId: entity.plan_id || '', status: entity.status || 'ACTIVE', quantity: entity.quantity ?? 1, currentPeriodStart: entity.current_start ? new Date(entity.current_start * 1000) : new Date(), currentPeriodEnd: entity.current_end ? new Date(entity.current_end * 1000) : new Date(), shortUrl: entity.short_url || undefined, updatedAt: new Date() } })
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error processing Razorpay webhook:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
