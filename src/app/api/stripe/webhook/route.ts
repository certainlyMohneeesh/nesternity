import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err: any) {
    console.error(`Webhook signature verification failed.`, err.message)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
      
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object)
        break
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object)
        break
      
      case 'invoice.created':
        await handleInvoiceCreated(event.data.object)
        break
      
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleSubscriptionUpdate(subscription: any) {
  const customerId = subscription.customer
  const subscriptionId = subscription.id
  const status = subscription.status
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000)
  const priceId = subscription.items.data[0]?.price?.id

  // Find user by stripe customer ID
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId }
  })

  if (!user) {
    console.error(`User not found for customer ${customerId}`)
    return
  }

  // Update or create subscription
  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: {
      stripePriceId: priceId,
      stripeSubId: subscriptionId,
      currentPeriodEnd,
      status,
    },
    create: {
      userId: user.id,
      stripePriceId: priceId,
      stripeSubId: subscriptionId,
      currentPeriodEnd,
      status,
    },
  })

  console.log(`Subscription updated for user ${user.id}`)
}

async function handleSubscriptionDeleted(subscription: any) {
  const customerId = subscription.customer

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId }
  })

  if (!user) {
    console.error(`User not found for customer ${customerId}`)
    return
  }

  // Delete subscription
  await prisma.subscription.deleteMany({
    where: { userId: user.id }
  })

  console.log(`Subscription deleted for user ${user.id}`)
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  const customerId = invoice.customer
  
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId }
  })

  if (!user) {
    console.error(`User not found for customer ${customerId}`)
    return
  }

  // If this is for our app's invoices, update the status
  if (invoice.metadata?.invoiceId) {
    await prisma.invoice.updateMany({
      where: {
        id: invoice.metadata.invoiceId,
        issuedById: user.id,
      },
      data: {
        status: 'PAID',
      },
    })
  }

  console.log(`Invoice payment succeeded for user ${user.id}`)
}

async function handleInvoicePaymentFailed(invoice: any) {
  const customerId = invoice.customer
  
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId }
  })

  if (!user) {
    console.error(`User not found for customer ${customerId}`)
    return
  }

  // If this is for our app's invoices, update the status
  if (invoice.metadata?.invoiceId) {
    await prisma.invoice.updateMany({
      where: {
        id: invoice.metadata.invoiceId,
        issuedById: user.id,
      },
      data: {
        status: 'OVERDUE',
      },
    })
  }

  console.log(`Invoice payment failed for user ${user.id}`)
}

async function handleInvoiceCreated(invoice: any) {
  // Log invoice creation
  console.log(`Invoice created: ${invoice.id}`)
}

async function handleCheckoutSessionCompleted(session: any) {
  try {
    const invoiceId = session.metadata?.invoiceId
    const userId = session.metadata?.userId

    if (!invoiceId || !userId) {
      console.log('Missing metadata in checkout session:', session.id)
      return
    }

    // Update invoice status to PAID
    await prisma.invoice.updateMany({
      where: {
        id: invoiceId,
        issuedById: userId,
      },
      data: {
        status: 'PAID',
      },
    })

    console.log(`Invoice ${invoiceId} marked as paid via checkout session ${session.id}`)
  } catch (error) {
    console.error('Error handling checkout session completion:', error)
  }
}
